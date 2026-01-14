import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

function checkMTFPartial(userAnswers: boolean[], correctAnswers: boolean[]): {
    correctCount: number;
    totalCount: number;
    allCorrect: boolean;
} {
    if (userAnswers.length !== correctAnswers.length) {
        return { correctCount: 0, totalCount: correctAnswers.length, allCorrect: false };
    }

    let correctCount = 0;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            correctCount++;
        }
    }

    return {
        correctCount,
        totalCount: correctAnswers.length,
        allCorrect: correctCount === correctAnswers.length,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, questionId, roundId, answer, type, timeSpent } = body;

        if (!teamId || !questionId || !roundId || answer === undefined || !type || timeSpent === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await adminDb.runTransaction(async (transaction) => {
            const answerId = `${teamId}_${questionId}`;
            const answerRef = adminDb.collection("answers").doc(answerId);
            const teamRef = adminDb.collection("teams").doc(teamId);
            const questionRef = adminDb.collection("questions").doc(questionId);
            const roundRef = adminDb.collection("rounds").doc(roundId);

            const [answerDoc, teamDoc, questionDoc, roundDoc] = await Promise.all([
                transaction.get(answerRef),
                transaction.get(teamRef),
                transaction.get(questionRef),
                transaction.get(roundRef)
            ]);

            // 1. Prevent Double Submission or Replay
            if (answerDoc.exists) {
                // Already submitted. Return existing result to be idempotent.
                // We throw a specific error to handle it in the response without failing 500
                throw new Error("ALREADY_SUBMITTED");
            }

            if (!teamDoc.exists || !questionDoc.exists || !roundDoc.exists) {
                throw new Error("NOT_FOUND");
            }

            const teamData = teamDoc.data()!;

            if (teamData.status === "eliminated") {
                throw new Error("ELIMINATED");
            }

            const question = questionDoc.data()!;
            const roundData = roundDoc.data()!;

            // 2. Validate Time (Grace period 5s)
            const GRACE_PERIOD_MS = 10000; // ample grace for lag
            const now = Date.now();
            const startTime = roundData.startTime;
            const timerSec = roundData.questionTimer || 30;

            // Only enforce if round is active
            if (startTime) {
                const pauseDur = roundData.totalPauseDuration || 0;
                const maxEndTime = startTime + (timerSec * 1000) + pauseDur + GRACE_PERIOD_MS;

                // If round is paused, we might be lenient or strict. 
                // Logic: If pausedAt is set, timer is technically stopped, so submissions might be allowed if they happened "before" pause?
                // For now, simple check: if it's way past time, reject.
                if (now > maxEndTime) {
                    throw new Error("TIME_EXPIRED");
                }
            }


            const difficulty: Difficulty = question.difficulty || "easy";
            const currentStreak = teamData.streak || 0;
            let isCorrect: boolean | null = null;
            const questionType = type as QuestionType;
            let correctAnswerData: Record<string, unknown> | null = null;
            let mtfCorrectCount = 0;
            let mtfTotalCount = 0;

            // Scoring Logic
            switch (questionType) {
                case "mcq":
                    if (question.correctChoiceIndex !== undefined) {
                        isCorrect = answer === question.correctChoiceIndex;
                        correctAnswerData = {
                            type: "mcq",
                            correctChoiceIndex: question.correctChoiceIndex,
                            choices: question.choices,
                        };
                    }
                    break;
                case "mtf":
                    if (question.statements && Array.isArray(answer)) {
                        const correctAnswers = question.statements.map((s: { isTrue: boolean }) => s.isTrue);
                        const mtfResult = checkMTFPartial(answer, correctAnswers);
                        mtfCorrectCount = mtfResult.correctCount;
                        mtfTotalCount = mtfResult.totalCount;
                        isCorrect = mtfResult.allCorrect;
                        correctAnswerData = { type: "mtf", statements: question.statements };
                    }
                    break;
                case "saq":
                case "spot":
                    isCorrect = null; // Pending
                    correctAnswerData = { type: questionType, pendingGrading: true };
                    break;
                default:
                    isCorrect = null;
            }

            let earnedPoints = 0;
            let newStreak = currentStreak;

            if (questionType === "mtf") {
                if (mtfTotalCount > 0) {
                    const half = mtfTotalCount / 2;
                    if (mtfCorrectCount <= half) {
                        earnedPoints = 0;
                    } else {
                        const baseScore = calculateScore(difficulty, timeSpent, currentStreak, true);
                        earnedPoints = Math.round(baseScore * (mtfCorrectCount - half) / half);
                    }
                    if (isCorrect) newStreak = Math.min(currentStreak + 1, 4);
                    else if (mtfCorrectCount === 0) newStreak = 0;
                }
            } else if (isCorrect === true) {
                earnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
                newStreak = Math.min(currentStreak + 1, 4);
            } else if (isCorrect === false) {
                newStreak = 0;
            }

            // Write Answer
            transaction.set(answerRef, {
                teamId,
                questionId,
                roundId,
                answer,
                type: questionType,
                submittedAt: now,
                timeSpent,
                isCorrect,
                points: earnedPoints,
                difficulty,
                imageUrl: question.imageUrl || null,
                questionText: question.text || "",
                mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : null,
                mtfTotalCount: questionType === "mtf" ? mtfTotalCount : null,
            });

            // Update Team Score (Atomic)
            if (earnedPoints !== 0 || newStreak !== currentStreak) {
                transaction.update(teamRef, {
                    score: FieldValue.increment(earnedPoints),
                    streak: newStreak
                });
            }

            // Build Message
            let message = "";
            if (questionType === "mtf") {
                message = `${mtfCorrectCount}/${mtfTotalCount} correct! +${earnedPoints} points`;
                if (mtfCorrectCount === mtfTotalCount) message += ` (streak: ${newStreak})`;
            } else if (isCorrect === true) {
                message = `Correct! +${earnedPoints} points (${difficulty}, ${timeSpent.toFixed(1)}s, streak: ${newStreak})`;
            } else if (isCorrect === false) {
                message = "Incorrect. Streak reset.";
            } else {
                message = "Answer submitted. Waiting for admin to grade.";
            }

            return {
                success: true,
                isCorrect,
                points: earnedPoints,
                streak: newStreak,
                message,
                correctAnswer: correctAnswerData,
                pendingGrading: isCorrect === null && questionType !== "mtf",
                mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : undefined,
                mtfTotalCount: questionType === "mtf" ? mtfTotalCount : undefined,
            };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        if (error.message === "ALREADY_SUBMITTED") {
            // Fetch duplicate return? For now just say it exists
            return NextResponse.json({ error: "Answer already received" }, { status: 409 });
        }
        if (error.message === "TIME_EXPIRED") {
            return NextResponse.json({ error: "Time expired for this question" }, { status: 403 });
        }
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        if (error.message === "ELIMINATED") {
            return NextResponse.json({ error: "Team is eliminated" }, { status: 403 });
        }
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
