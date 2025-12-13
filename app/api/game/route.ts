import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, key } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (action === "initGame") {
            // Reset all rounds
            const batch = adminDb.batch();

            for (let i = 1; i <= 7; i++) {
                const rRef = adminDb.collection("rounds").doc(`round-${i}`);
                batch.set(rRef, {
                    id: `round-${i}`,
                    status: "waiting",
                    startTime: null,
                    currentQuestionIndex: 0,
                    questionTimer: 10
                }, { merge: true });
            }

            await batch.commit();

            // Delete all answers
            const answersSnap = await adminDb.collection("answers").get();
            const deleteBatch = adminDb.batch();
            answersSnap.docs.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();

            // Reset all team scores
            const teamsSnap = await adminDb.collection("teams").get();
            const teamBatch = adminDb.batch();
            teamsSnap.docs.forEach(doc => {
                teamBatch.update(doc.ref, { score: 0, status: "active" });
            });
            await teamBatch.commit();

            return NextResponse.json({
                success: true,
                message: `Game reset! Cleared ${answersSnap.size} answers and reset ${teamsSnap.size} team scores.`
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Error in game action:", error);
        return NextResponse.json({ error: "Failed to execute action" }, { status: 500 });
    }
}
