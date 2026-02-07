import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty } from "@/lib/types";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { answerId, isCorrect } = body;

        if (!answerId || isCorrect === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const answerRef = adminDb.collection("answers").doc(answerId);
        const answerDoc = await answerRef.get();

        if (!answerDoc.exists) {
            return NextResponse.json({ error: "Answer not found" }, { status: 404 });
        }

        const answerData = answerDoc.data()!;

        const oldPoints = answerData.points || 0;

        const teamRef = adminDb.collection("teams").doc(answerData.teamId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const teamData = teamDoc.data()!;
        const currentStreak = teamData.streak || 0;

        let newEarnedPoints = 0;
        let newStreak = currentStreak;
        const difficulty: Difficulty = answerData.difficulty || "easy";
        const timeSpent = answerData.timeSpent || 100;

        if (isCorrect) {
            newEarnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else {
            newStreak = 0;
        }

        let pointsDelta = 0;

        if (answerData.isCorrect !== null && answerData.isCorrect !== undefined) {
            pointsDelta = newEarnedPoints - oldPoints;
        } else {
            pointsDelta = newEarnedPoints;
        }

        await answerRef.update({
            isCorrect,
            points: newEarnedPoints,
            pendingGrading: false,
        });

        await teamRef.update({
            score: FieldValue.increment(pointsDelta),
            streak: newStreak,
        });

        return NextResponse.json({
            success: true,
            isCorrect,
            points: newEarnedPoints,
            newStreak,
            message: isCorrect
                ? `Updated: Correct! ${pointsDelta >= 0 ? '+' : ''}${pointsDelta} adjustment.`
                : `Updated: Incorrect. Streak reset. ${pointsDelta} adjustment.`,
        });
    } catch (error) {
        console.error("Error grading answer:", error);
        return NextResponse.json({ error: "Failed to grade answer" }, { status: 500 });
    }
}
