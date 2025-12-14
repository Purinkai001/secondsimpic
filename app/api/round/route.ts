import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET: Minimal round data for game clients
// Only fetches active round and its questions
export async function GET() {
    try {
        // Get active round
        const roundsSnap = await adminDb.collection("rounds")
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (roundsSnap.empty) {
            return NextResponse.json({
                success: true,
                hasActiveRound: false,
            });
        }

        const roundDoc = roundsSnap.docs[0];
        const round = {
            id: roundDoc.id,
            ...roundDoc.data()
        };

        // Get questions for this round
        const questionsSnap = await adminDb.collection("questions")
            .where("roundId", "==", round.id)
            .get();

        // Only send essential question fields
        const questions = questionsSnap.docs
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    type: data.type,
                    difficulty: data.difficulty,
                    order: data.order || 0,
                    text: data.text,
                    imageUrl: data.imageUrl,
                    choices: data.choices,
                    statements: data.statements,
                    correctChoiceIndex: data.correctChoiceIndex,
                    correctAnswer: data.correctAnswer,
                    roundId: data.roundId,
                };
            })
            .sort((a, b) => a.order - b.order);

        return NextResponse.json({
            success: true,
            hasActiveRound: true,
            round,
            questions,
        });
    } catch (error) {
        console.error("Error fetching round data:", error);
        return NextResponse.json({ error: "Failed to fetch round data" }, { status: 500 });
    }
}
