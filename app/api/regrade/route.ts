import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { calculateScore } from "@/lib/scoring";
import { Answer, Question, QuestionType, Difficulty } from "@/lib/types";

// Helper to check MTF (Duplicated from answer route to keep contained)
function checkMTF(userAnswers: boolean[], correctAnswers: boolean[]) {
    if (userAnswers.length !== correctAnswers.length) return { isCorrect: false, correctCount: 0, totalCount: correctAnswers.length };
    let correctCount = 0;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) correctCount++;
    }
    return {
        isCorrect: correctCount === correctAnswers.length,
        correctCount,
        totalCount: correctAnswers.length
    };
}

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { questionId, type, correctAnswer, choices, statements, alternateAnswers } = body;

        if (!questionId) {
            return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
        }

        // 1. Update the Question Document
        const questionRef = adminDb.collection("questions").doc(questionId);

        await adminDb.runTransaction(async (t) => {
            const qDoc = await t.get(questionRef);
            if (!qDoc.exists) throw new Error("Question not found");

            const updateData: any = {};
            if (type) updateData.type = type;
            if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
            if (choices !== undefined) updateData.choices = choices;
            if (statements !== undefined) updateData.statements = statements;
            if (alternateAnswers !== undefined) updateData.alternateAnswers = alternateAnswers;

            t.update(questionRef, updateData);
        });

        // 2. Fetch the updated question to be sure
        const updatedQuestionDoc = await questionRef.get();
        const question = updatedQuestionDoc.data() as Question;

        // 3. Find all Teams that answered this question
        // We do this OUTSIDE the transaction because "answers" queries can't be locked widely
        const answersSnapshot = await adminDb.collection("answers")
            .where("questionId", "==", questionId)
            .get();

        const answerDocs = answersSnapshot.docs;
        const affectedTeamIds = new Set(answerDocs.map(d => d.data().teamId));

        const results: any[] = [];
        const errors: any[] = [];

        // 4. Per-Team Transaction Replay
        // We execute these sequentially or with limiting concurrency to avoid contention
        const teamIds = Array.from(affectedTeamIds);

        for (const teamId of teamIds) {
            try {
                await adminDb.runTransaction(async (t) => {
                    // A. Lock Team
                    const teamRef = adminDb.collection("teams").doc(teamId);
                    const teamDoc = await t.get(teamRef);
                    if (!teamDoc.exists) return; // Team deleted? Skip.

                    // B. Fetch Team's History
                    // Transactional query requires an index on teamId+submittedAt usually.
                    // If not indexed, we fetch all by teamId and sort in memory.
                    // Note: Firestore Transactions require all reads before writes.
                    const historySnap = await t.get(
                        adminDb.collection("answers")
                            .where("teamId", "==", teamId)
                    );

                    let history = historySnap.docs.map(d => ({
                        id: d.id,
                        ref: d.ref,
                        ...d.data()
                    } as Answer & { ref: any }));

                    // Sort chronologically (Critical for Streak)
                    history.sort((a, b) => a.submittedAt - b.submittedAt);

                    let simulatedScore = 0;
                    let simulatedStreak = 0;

                    // C. Replay History
                    for (const ans of history) {
                        const isTargetQuestion = ans.questionId === questionId;

                        let newIsCorrect: boolean | null = ans.isCorrect;
                        let mtfCorrectCount = ans.mtfCorrectCount;
                        let mtfTotalCount = ans.mtfTotalCount;

                        if (isTargetQuestion) {
                            // Re-evaluate Correctness
                            if (question.type === "mcq") {
                                if (question.correctChoiceIndex !== undefined && typeof ans.answer === 'number') {
                                    newIsCorrect = ans.answer === question.correctChoiceIndex;
                                }
                            } else if (question.type === "mtf") {
                                if (question.statements && Array.isArray(ans.answer)) {
                                    const keys = question.statements.map(s => s.isTrue);
                                    const userAns = ans.answer as boolean[];
                                    const res = checkMTF(userAns, keys);
                                    newIsCorrect = res.isCorrect;
                                    mtfCorrectCount = res.correctCount;
                                    mtfTotalCount = res.totalCount;
                                }
                            } else if (question.type === "saq" || question.type === "spot") {
                                const userTxt = String(ans.answer || "").trim().toLowerCase();
                                const keyTxt = (question.correctAnswer || "").trim().toLowerCase();
                                let matches = keyTxt.length > 0 && userTxt === keyTxt;

                                if (!matches && question.alternateAnswers) {
                                    matches = question.alternateAnswers.some(a => a.trim().toLowerCase() === userTxt);
                                }

                                if (matches) newIsCorrect = true;
                                else {
                                    // If key changed and it no longer matches, mark incorrect
                                    // But if it was manually graded correct?
                                    // Regrade implies enforcing NEW logic.
                                    // If pending (null), it becomes false if logic fails.
                                    // If true, it becomes false if logic fails.
                                    newIsCorrect = false;
                                }
                            }
                        }

                        // Recalculate Score
                        const difficulty = (ans as any).difficulty || "easy";
                        const timeSpent = ans.timeSpent || 0;
                        let newPoints = 0;

                        if (newIsCorrect === true) {
                            newPoints = calculateScore(difficulty, timeSpent, simulatedStreak, true);
                            simulatedStreak = Math.min(simulatedStreak + 1, 4);
                        } else if (newIsCorrect === false) {
                            newPoints = 0;
                            simulatedStreak = 0;
                        } else {
                            // Pending
                            newPoints = 0;
                            // Streak preserved (no change)?
                            // Streak logic: Pending answers do NOT reset streak, but don't add to it.
                            // But usually pending means we don't know yet.
                            // If we treat it as 0 points, streak stays same?
                            // Actually, in the answer route, we don't change streak if isCorrect is null.
                            // So simulatedStreak remains whatever it was.
                        }

                        // D. Check Diff and Queue Update
                        // We check ALL fields that might change
                        if (ans.isCorrect !== newIsCorrect ||
                            ans.points !== newPoints ||
                            ans.mtfCorrectCount !== mtfCorrectCount) {

                            t.update(ans.ref, {
                                isCorrect: newIsCorrect,
                                points: newPoints,
                                pendingGrading: newIsCorrect === null,
                                mtfCorrectCount: mtfCorrectCount || null,
                                mtfTotalCount: mtfTotalCount || null
                            });
                        }

                        simulatedScore += newPoints;
                    }

                    // E. Update Team
                    // Always write the re-calculated score to be safe from drift
                    t.update(teamRef, {
                        score: simulatedScore,
                        streak: simulatedStreak
                    });

                    results.push({ teamId, score: simulatedScore, streak: simulatedStreak });
                });
            } catch (err) {
                console.error(`Failed to transactionally regrade team ${teamId}`, err);
                errors.push({ teamId, error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            updatedTeams: results.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Regraded Question ${questionId}. Success: ${results.length}, Fail: ${errors.length}`
        });

    } catch (error) {
        console.error("Regrade error:", error);
        return NextResponse.json({ error: "Regrade failed" }, { status: 500 });
    }
}
