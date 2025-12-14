import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";

// Helper to check MTF and return partial score info
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

        // Get question to check correct answer
        const questionDoc = await adminDb.collection("questions").doc(questionId).get();
        if (!questionDoc.exists) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        const question = questionDoc.data()!;
        const difficulty: Difficulty = question.difficulty || "easy";

        // Get team to get current streak
        const teamRef = adminDb.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }
        const teamData = teamDoc.data()!;
        const currentStreak = teamData.streak || 0;

        // Determine if answer is correct based on question type
        let isCorrect: boolean | null = null;
        const questionType = type as QuestionType;

        // Prepare correct answer data to return to client
        let correctAnswerData: any = null;

        // MTF partial scoring info
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
                    // For streak purposes, only all correct counts as "correct"
                    isCorrect = mtfResult.allCorrect;
                    correctAnswerData = {
                        type: "mtf",
                        statements: question.statements, // includes isTrue for each
                    };
                }
                break;

            case "saq":
            case "spot":
                // SAQ and Spot require manual grading by admin
                // Do NOT auto-grade - leave isCorrect as null
                isCorrect = null;
                correctAnswerData = {
                    type: questionType,
                    pendingGrading: true,
                };
                break;

            default:
                isCorrect = null; // Unknown type, manual grading needed
        }

        // Calculate score using new formula
        let earnedPoints = 0;
        let newStreak = currentStreak;

        if (questionType === "mtf") {
            // MTF: Partial scoring based on correct statements
            // Each correct statement earns proportional points
            if (mtfTotalCount > 0) {
                const baseScore = calculateScore(difficulty, timeSpent, currentStreak, true);
                earnedPoints = Math.round(baseScore * (mtfCorrectCount / mtfTotalCount));

                // Streak only increases if ALL correct
                if (isCorrect) {
                    newStreak = Math.min(currentStreak + 1, 4);
                } else if (mtfCorrectCount === 0) {
                    // Reset streak only if ALL wrong
                    newStreak = 0;
                }
                // If partial correct, keep streak as is
            }
        } else if (isCorrect === true) {
            earnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else if (isCorrect === false) {
            newStreak = 0; // Reset streak on incorrect answer
        }
        // If isCorrect is null (SAQ/Spot), don't modify streak yet

        // Save answer
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
            difficulty, // Store difficulty for later grading calculations
            mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : null,
            mtfTotalCount: questionType === "mtf" ? mtfTotalCount : null,
        });

        // Update team score and streak (only for auto-graded types)
        if (isCorrect !== null || (questionType === "mtf" && earnedPoints > 0)) {
            const currentScore = teamData.score || 0;
            await teamRef.update({
                score: currentScore + earnedPoints,
                streak: newStreak,
            });
        }

        // Prepare response message with scoring breakdown
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
            correctAnswer: correctAnswerData, // Send correct answer data for reveal
            pendingGrading: isCorrect === null && questionType !== "mtf",
            // MTF specific
            mtfCorrectCount: questionType === "mtf" ? mtfCorrectCount : undefined,
            mtfTotalCount: questionType === "mtf" ? mtfTotalCount : undefined,
        });
    } catch (error) {
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
