import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";

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

        const questionDoc = await adminDb.collection("questions").doc(questionId).get();
        if (!questionDoc.exists) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        const question = questionDoc.data()!;
        const difficulty: Difficulty = question.difficulty || "easy";

        const teamRef = adminDb.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }
        const teamData = teamDoc.data()!;
        const currentStreak = teamData.streak || 0;

        let isCorrect: boolean | null = null;
        const questionType = type as QuestionType;

        let correctAnswerData: Record<string, unknown> | null = null;
        let mtfCorrectCount = 0;
        let mtfTotalCount = 0;

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
                    correctAnswerData = {
                        type: "mtf",
                        statements: question.statements,
                    };
                }
                break;

            case "saq":
            case "spot":
                isCorrect = null;
                correctAnswerData = {
                    type: questionType,
                    pendingGrading: true,
                };
                break;

            default:
                isCorrect = null;
        }

        let earnedPoints = 0;
        let newStreak = currentStreak;

        if (questionType === "mtf") {
            if (mtfTotalCount > 0) {
                const baseScore = calculateScore(difficulty, timeSpent, currentStreak, true);
                earnedPoints = Math.round(baseScore * (mtfCorrectCount / mtfTotalCount));

                if (isCorrect) {
                    newStreak = Math.min(currentStreak + 1, 4);
                } else if (mtfCorrectCount === 0) {
                    newStreak = 0;
                }
            }
        } else if (isCorrect === true) {
            earnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else if (isCorrect === false) {
            newStreak = 0;
        }

        const answerId = `${teamId}_${questionId}`;
        await adminDb.collection("answers").doc(answerId).set({
            teamId,
            questionId,
            roundId,
            answer,
            type: questionType,
            submittedAt: Date.now(),
            timeSpent,
            isCorrect,
            points: earnedPoints,
            difficulty,
            mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : null,
            mtfTotalCount: questionType === "mtf" ? mtfTotalCount : null,
        });

        if (isCorrect !== null || (questionType === "mtf" && earnedPoints > 0)) {
            const currentScore = teamData.score || 0;
            await teamRef.update({
                score: currentScore + earnedPoints,
                streak: newStreak,
            });
        }

        let message = "";
        if (questionType === "mtf") {
            message = `${mtfCorrectCount}/${mtfTotalCount} correct! +${earnedPoints} points`;
            if (mtfCorrectCount === mtfTotalCount) {
                message += ` (streak: ${newStreak})`;
            }
        } else if (isCorrect === true) {
            message = `Correct! +${earnedPoints} points (${difficulty}, ${timeSpent.toFixed(1)}s, streak: ${newStreak})`;
        } else if (isCorrect === false) {
            message = "Incorrect. Streak reset.";
        } else {
            message = "Answer submitted. Waiting for admin to grade.";
        }

        return NextResponse.json({
            success: true,
            isCorrect,
            points: earnedPoints,
            streak: newStreak,
            message,
            correctAnswer: correctAnswerData,
            pendingGrading: isCorrect === null && questionType !== "mtf",
            mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : undefined,
            mtfTotalCount: questionType === "mtf" ? mtfTotalCount : undefined,
        });
    } catch (error) {
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
