import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// POST: Kick a specific team or all teams
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, kickAll } = body;

        if (kickAll) {
            // Delete all teams and their answers
            const teamsSnapshot = await adminDb.collection("teams").get();
            const answersSnapshot = await adminDb.collection("answers").get();

            const batch = adminDb.batch();

            teamsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            answersSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Kicked ${teamsSnapshot.size} teams and cleared ${answersSnapshot.size} answers`
            });
        } else if (teamId) {
            // Delete a specific team and their answers
            const teamRef = adminDb.collection("teams").doc(teamId);
            const teamDoc = await teamRef.get();

            if (!teamDoc.exists) {
                return NextResponse.json({ error: "Team not found" }, { status: 404 });
            }

            // Delete team's answers
            const answersSnapshot = await adminDb.collection("answers")
                .where("teamId", "==", teamId)
                .get();

            const batch = adminDb.batch();
            batch.delete(teamRef);
            answersSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Kicked team and cleared ${answersSnapshot.size} answers`
            });
        } else {
            return NextResponse.json({ error: "Must specify teamId or kickAll" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error kicking players:", error);
        return NextResponse.json({ error: "Failed to kick players" }, { status: 500 });
    }
}
