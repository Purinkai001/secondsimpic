import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty } from "@/lib/types";

// POST - Grade an answer (for SAQ/Spot types that need manual grading)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { answerId, isCorrect, key } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!answerId || isCorrect === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get the answer document
        const answerRef = adminDb.collection("answers").doc(answerId);
        const answerDoc = await answerRef.get();

        if (!answerDoc.exists) {
            return NextResponse.json({ error: "Answer not found" }, { status: 404 });
        }

        const answerData = answerDoc.data()!;

        // Check if already graded
        if (answerData.isCorrect !== null) {
            return NextResponse.json({ error: "Answer already graded" }, { status: 400 });
        }

        // Get the team
        const teamRef = adminDb.collection("teams").doc(answerData.teamId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const teamData = teamDoc.data()!;
        const currentStreak = teamData.streak || 0;

        // Calculate score if correct
        let earnedPoints = 0;
        let newStreak = currentStreak;
        const difficulty: Difficulty = answerData.difficulty || "easy";
        const timeSpent = answerData.timeSpent || 100;

        if (isCorrect) {
            earnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else {
            newStreak = 0; // Reset streak on incorrect
        }

        // Update the answer
        await answerRef.update({
            isCorrect,
            points: earnedPoints,
        });

        // Update team score and streak
        const currentScore = teamData.score || 0;
        await teamRef.update({
            score: currentScore + earnedPoints,
            streak: newStreak,
        });

        return NextResponse.json({
            success: true,
            isCorrect,
            points: earnedPoints,
            newStreak,
            message: isCorrect
                ? `Marked correct! +${earnedPoints} points (${difficulty}, ${timeSpent.toFixed(1)}s, streak ${newStreak})`
                : "Marked incorrect. Streak reset.",
        });
    } catch (error) {
        console.error("Error grading answer:", error);
        return NextResponse.json({ error: "Failed to grade answer" }, { status: 500 });
    }
}
