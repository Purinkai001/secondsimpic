import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

// POST: Reset all team scores
export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const teamsSnapshot = await adminDb.collection("teams").get();

        if (teamsSnapshot.empty) {
            return NextResponse.json({ message: "No teams to reset" });
        }

        const batch = adminDb.batch();
        teamsSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                score: 0,
                streak: 0,
            });
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Reset scores for ${teamsSnapshot.size} teams`
        });
    } catch (error) {
        console.error("Error resetting scores:", error);
        return NextResponse.json({ error: "Failed to reset scores" }, { status: 500 });
    }
}
