import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore, checkSAQAnswer, checkMTFAnswer } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";

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

        switch (questionType) {
            case "mcq":
                if (question.correctChoiceIndex !== undefined) {
                    isCorrect = answer === question.correctChoiceIndex;
                }
                break;

            case "mtf":
                if (question.statements && Array.isArray(answer)) {
                    const correctAnswers = question.statements.map((s: { isTrue: boolean }) => s.isTrue);
                    isCorrect = checkMTFAnswer(answer, correctAnswers);
                }
                break;

            case "saq":
            case "spot":
                if (question.correctAnswer) {
                    isCorrect = checkSAQAnswer(String(answer), question.correctAnswer);
                }
                break;

            default:
                isCorrect = null; // Unknown type, manual grading needed
        }

        // Calculate score using new formula
        let earnedPoints = 0;
        let newStreak = currentStreak;

        if (isCorrect === true) {
            earnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4); // Cap streak at 4 for factor purposes
        } else if (isCorrect === false) {
            newStreak = 0; // Reset streak on incorrect answer
        }

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
        });

        // Update team score and streak
        if (isCorrect !== null) {
            const currentScore = teamData.score || 0;
            await teamRef.update({
                score: currentScore + earnedPoints,
                streak: newStreak,
            });
        }

        // Prepare response message with scoring breakdown
        let message = "";
        if (isCorrect === true) {
            message = `Correct! +${earnedPoints} points (${difficulty} difficulty, ${timeSpent.toFixed(1)}s, streak: ${newStreak})`;
        } else if (isCorrect === false) {
            message = "Incorrect. Streak reset.";
        } else {
            message = "Answer submitted for review";
        }

        return NextResponse.json({
            success: true,
            isCorrect,
            points: earnedPoints,
            streak: newStreak,
            message,
        });
    } catch (error) {
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}

