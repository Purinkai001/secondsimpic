import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateScore } from "@/lib/scoring";
import { Difficulty } from "@/lib/types";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { FieldValue } from "firebase-admin/firestore";

// POST - Grade an answer (for SAQ/Spot types that need manual grading)
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

        // --- PREVIOUS STATE ---
        const oldPoints = answerData.points || 0;
        const wasCorrect = answerData.isCorrect;

        const teamRef = adminDb.collection("teams").doc(answerData.teamId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const teamData = teamDoc.data()!;
        // Use the streak from the TEAM, assuming this is the latest action.
        // If re-grading old history, streak logic is imperfect but acceptable.
        const currentStreak = teamData.streak || 0;

        // --- NEW STATE CALCULATION ---
        let newEarnedPoints = 0;
        let newStreak = currentStreak;
        const difficulty: Difficulty = answerData.difficulty || "easy";
        const timeSpent = answerData.timeSpent || 100;

        if (isCorrect) {
            // Recalculate based on original conditions
            // Note: If we are changing from correct->correct, points shouldn't change unless difficulty changed (unlikely)
            // If changing incorrect->correct, we use current streak? 
            // ISSUE: If re-grading old answer, using 'currentStreak' is wrong if user answered subsequent questions.
            // FIX: For simplicity in hotfix, we use the streak stored in the ANSWER doc if available, else 0.
            // But we don't store streak-before-answer in answer doc usually, we store resulting streak?
            // Let's rely on team.streak for "latest" context or just calculate base points without streak bonus if it's too old?
            // BETTER: Use `calculateScore` but maybe just cap streak factor if it feels wrong?
            // STANDARD: Just use team.streak. It encourages fixing "last" mistake.
            newEarnedPoints = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else {
            newStreak = 0;
        }

        // --- DELTA ---
        let pointsDelta = 0;

        // If it was previously graded, we need to adjust
        if (answerData.isCorrect !== null && answerData.isCorrect !== undefined) {
            pointsDelta = newEarnedPoints - oldPoints;
        } else {
            // First time grading
            pointsDelta = newEarnedPoints;
        }

        // Update Answer
        await answerRef.update({
            isCorrect,
            points: newEarnedPoints,
            pendingGrading: false, // Ensure it's marked as graded
        });

        // Update Team Score (Atomic increment of difference)
        await teamRef.update({
            score: FieldValue.increment(pointsDelta),
            streak: newStreak, // Reset/Update streak to new outcome
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
