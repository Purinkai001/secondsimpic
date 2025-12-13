import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, questionId, roundId, answer, type, group } = body;

        if (!teamId || !questionId || !roundId || answer === undefined || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const POINTS = 10;
        let isCorrect: boolean | null = null;
        let earnedPoints = 0;

        // Get question to check correct answer for MCQ
        if (type === "mcq") {
            const questionDoc = await adminDb.collection("questions").doc(questionId).get();
            if (questionDoc.exists) {
                const question = questionDoc.data();
                if (question?.correctChoiceIndex !== undefined) {
                    isCorrect = answer === question.correctChoiceIndex;
                    earnedPoints = isCorrect ? POINTS : 0;
                }
            }
        }
        // Essay answers remain null (manual grading)

        // Save answer
        const answerId = `${teamId}_${questionId}`;
        await adminDb.collection("answers").doc(answerId).set({
            teamId,
            group,
            questionId,
            roundId,
            answer,
            type,
            submittedAt: Date.now(),
            isCorrect,
            points: earnedPoints,
        });

        // Update team score if MCQ is correct
        if (isCorrect && earnedPoints > 0) {
            const teamRef = adminDb.collection("teams").doc(teamId);
            const teamDoc = await teamRef.get();
            if (teamDoc.exists) {
                const currentScore = teamDoc.data()?.score || 0;
                await teamRef.update({ score: currentScore + earnedPoints });
            }
        }

        return NextResponse.json({
            success: true,
            isCorrect,
            points: earnedPoints,
            message: isCorrect ? "Correct! +10 points" : (isCorrect === false ? "Incorrect" : "Answer submitted for review")
        });
    } catch (error) {
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
