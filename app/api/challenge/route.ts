import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { verifyPlayer, playerUnauthorizedResponse } from "@/lib/auth-player";

// POST: Create a new challenge (from team) - PUBLIC (No Admin Auth required)
export async function POST(request: Request) {
    let decodedToken;

    try {
        decodedToken = await verifyPlayer(request);
    } catch {
        return playerUnauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { teamId, questionId, questionText, roundId } = body;

        if (!teamId || !questionId || !questionText || !roundId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await adminDb.runTransaction(async (transaction) => {
            const teamRef = adminDb.collection("teams").doc(teamId);
            const questionRef = adminDb.collection("questions").doc(questionId);
            const [teamDoc, questionDoc] = await Promise.all([
                transaction.get(teamRef),
                transaction.get(questionRef)
            ]);

            if (!teamDoc.exists || !questionDoc.exists || questionDoc.data()?.roundId !== roundId) {
                throw new Error("NOT_FOUND");
            }

            const teamData = teamDoc.data()!;
            if (teamData.status === "eliminated") {
                throw new Error("ELIMINATED");
            }

            if (teamData.ownerUid && teamData.ownerUid !== decodedToken.uid) {
                throw new Error("FORBIDDEN");
            }

            if (!teamData.ownerUid) {
                transaction.update(teamRef, { ownerUid: decodedToken.uid });
                teamData.ownerUid = decodedToken.uid;
            }

            const challengesRemaining = teamData.challengesRemaining ?? 2;
            if (challengesRemaining <= 0) {
                throw new Error("NO_CHALLENGES");
            }

            const challengeRef = adminDb.collection("challenges").doc();
            transaction.set(challengeRef, {
                id: challengeRef.id,
                teamId,
                teamName: teamData.name,
                questionId,
                questionText,
                roundId,
                createdAt: Date.now(),
                dismissed: false
            });

            transaction.update(teamRef, {
                challengesRemaining: challengesRemaining - 1
            });

            return {
                success: true,
                challengeId: challengeRef.id,
                challengesRemaining: challengesRemaining - 1,
                message: `Challenge submitted! You have ${challengesRemaining - 1} remains.`
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        if (error instanceof Error && error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Team is not owned by current player" }, { status: 403 });
        }

        if (error instanceof Error && error.message === "ELIMINATED") {
            return NextResponse.json({ error: "Team is eliminated" }, { status: 403 });
        }

        if (error instanceof Error && error.message === "NO_CHALLENGES") {
            return NextResponse.json({ error: "No challenges remaining." }, { status: 400 });
        }

        console.error("Error creating challenge:", error);
        return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
    }
}

// GET: Fetch all pending challenges (for admin)
// NOTE: Frontend uses Firestore snapshot, so this might be unused, but securing it anyway or removing.
// Keeping it but securing if it's used.
export async function GET(request: Request) {
    // Optional: Secure if this is admin only
    // Given the previous code didn't check key, but likely intended for admin.
    // Let's secure it.
    try {
        await verifyAdmin(request);
    } catch {
        // If it was public before, maybe it needed to be? But challenges list is definitely admin data.
        return unauthorizedResponse();
    }

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
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { challengeId } = body;

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
