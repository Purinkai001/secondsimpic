import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

// POST: Create a new challenge (from team)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, teamName, questionId, questionText, roundId } = body;

        if (!teamId || !teamName || !questionId || !questionText || !roundId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const teamRef = adminDb.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const teamData = teamDoc.data()!;
        const challengesRemaining = teamData.challengesRemaining ?? 2;

        if (challengesRemaining <= 0) {
            return NextResponse.json({
                error: "No challenges remaining."
            }, { status: 400 });
        }

        const challengeRef = adminDb.collection("challenges").doc();
        await challengeRef.set({
            id: challengeRef.id,
            teamId,
            teamName,
            questionId,
            questionText,
            roundId,
            createdAt: Date.now(),
            dismissed: false
        });

        await teamRef.update({
            challengesRemaining: challengesRemaining - 1
        });

        return NextResponse.json({
            success: true,
            challengeId: challengeRef.id,
            challengesRemaining: challengesRemaining - 1,
            message: `Challenge submitted! You have ${challengesRemaining - 1} remains.`
        });
    } catch (error) {
        console.error("Error creating challenge:", error);
        return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
    }
}

// GET: Fetch all pending challenges (for admin)
export async function GET() {
    try {
        const challengesSnap = await adminDb.collection("challenges")
            .where("dismissed", "==", false)
            .orderBy("createdAt", "desc")
            .get();

        const challenges = challengesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            challenges
        });
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
    }
}

// PATCH: Dismiss a challenge (admin action)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { challengeId, key } = body;

        if (key !== ADMIN_KEY) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!challengeId) {
            return NextResponse.json({ error: "challengeId required" }, { status: 400 });
        }

        const challengeRef = adminDb.collection("challenges").doc(challengeId);
        await challengeRef.update({ dismissed: true });

        return NextResponse.json({
            success: true,
            message: "Challenge dismissed"
        });
    } catch (error) {
        console.error("Error dismissing challenge:", error);
        return NextResponse.json({ error: "Failed to dismiss challenge" }, { status: 500 });
    }
}
