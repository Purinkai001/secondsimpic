import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_QUESTION_TIMER } from "@/lib/types";

// Shuffle array randomly (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, key, roundNum } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ===== INIT GAME =====
        if (action === "initGame") {
            // Reset all rounds (5 rounds total)
            const batch = adminDb.batch();

            for (let i = 1; i <= 5; i++) {
                const rRef = adminDb.collection("rounds").doc(`round-${i}`);
                batch.set(rRef, {
                    id: `round-${i}`,
                    status: "waiting",
                    startTime: null,
                    currentQuestionIndex: 0,
                    questionTimer: DEFAULT_QUESTION_TIMER // 100 seconds
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

            // Delete all challenges
            const challengesSnap = await adminDb.collection("challenges").get();
            const challengeDeleteBatch = adminDb.batch();
            challengesSnap.docs.forEach(doc => {
                challengeDeleteBatch.delete(doc.ref);
            });
            await challengeDeleteBatch.commit();

            // Reset all team scores, status, challenges, and streak
            const teamsSnap = await adminDb.collection("teams").get();
            const teamBatch = adminDb.batch();
            teamsSnap.docs.forEach(doc => {
                teamBatch.update(doc.ref, {
                    score: 0,
                    status: "active",
                    challengesRemaining: 2, // 2 challenges per team
                    streak: 0
                });
            });
            await teamBatch.commit();

            return NextResponse.json({
                success: true,
                message: `Game reset! Cleared ${answersSnap.size} answers, ${challengesSnap.size} challenges, and reset ${teamsSnap.size} teams.`
            });
        }

        // ===== SHUFFLE TEAMS =====
        // Randomly assign all teams to divisions (1-5), 6 teams per division
        if (action === "shuffleTeams") {
            const teamsSnap = await adminDb.collection("teams").get();
            const teams = teamsSnap.docs;

            if (teams.length !== 30) {
                return NextResponse.json({
                    error: `Need exactly 30 teams to shuffle. Currently have ${teams.length} teams.`
                }, { status: 400 });
            }

            // Shuffle and assign to divisions
            const shuffled = shuffleArray(teams);
            const batch = adminDb.batch();

            shuffled.forEach((doc, index) => {
                const division = (index % 5) + 1; // 1, 2, 3, 4, 5, 1, 2, 3, 4, 5...
                batch.update(doc.ref, {
                    group: division,
                    score: 0,
                    status: "active",
                    challengesRemaining: 2,
                    streak: 0
                });
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: "30 teams shuffled randomly into 5 divisions (6 teams each)."
            });
        }

        // ===== RESET SCORES FOR TURN 3 =====
        if (action === "resetScoresForTurn3") {
            const teamsSnap = await adminDb.collection("teams").get();
            const batch = adminDb.batch();

            teamsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.status === "active") {
                    batch.update(doc.ref, { score: 0, streak: 0 });
                }
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Reset scores for ${teamsSnap.size} active teams at start of Turn 3.`
            });
        }

        // ===== REARRANGE DIVISIONS BY SCORE =====
        // After Turn 3 elimination, rearrange remaining teams into divisions by score ranking
        if (action === "rearrangeDivisions") {
            const teamsSnap = await adminDb.collection("teams").get();
            const activeTeams = teamsSnap.docs
                .filter(d => d.data().status === "active")
                .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
                .sort((a: any, b: any) => b.score - a.score); // Highest score first

            const batch = adminDb.batch();
            const teamsPerDivision = Math.ceil(activeTeams.length / 5);

            activeTeams.forEach((team: any, index) => {
                const division = Math.floor(index / teamsPerDivision) + 1;
                batch.update(team.ref, { group: Math.min(division, 5) });
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Rearranged ${activeTeams.length} teams into divisions by score ranking.`
            });
        }

        // ===== ELIMINATION =====
        // Round 3: Eliminate bottom 3 per division (keep top 3)
        // Round 5: Eliminate bottom 2 per division (keep top 1)
        if (action === "runElimination") {
            if (!roundNum) {
                return NextResponse.json({ error: "roundNum required" }, { status: 400 });
            }

            let eliminateCount = 0;
            if (roundNum === 3) {
                eliminateCount = 3; // Eliminate 3, keep 3
            } else if (roundNum === 5) {
                eliminateCount = 2; // Eliminate 2, keep 1
            } else {
                return NextResponse.json({
                    error: `Elimination only at Round 3 or 5. Got Round ${roundNum}.`
                }, { status: 400 });
            }

            const teamsSnap = await adminDb.collection("teams").get();
            const teams = teamsSnap.docs.map(d => ({
                id: d.id,
                ref: d.ref,
                ...d.data()
            } as { id: string; ref: FirebaseFirestore.DocumentReference; group: number; status: string; score: number }));

            const batch = adminDb.batch();
            let totalEliminated = 0;

            // Process each division
            for (let division = 1; division <= 5; division++) {
                const divisionTeams = teams
                    .filter(t => t.group === division && t.status === "active")
                    .sort((a, b) => a.score - b.score); // Lowest first

                // Eliminate bottom N teams
                const toEliminate = divisionTeams.slice(0, eliminateCount);
                toEliminate.forEach((t: any) => {
                    batch.update(t.ref, { status: "eliminated" });
                    totalEliminated++;
                });
            }

            await batch.commit();

            const keepCount = roundNum === 3 ? 3 : 1;
            return NextResponse.json({
                success: true,
                message: `Round ${roundNum} elimination complete! Eliminated ${totalEliminated} teams (${eliminateCount} per division). ${keepCount * 5} teams remain.`
            });
        }

        // ===== CHECK FOR TIES (Sudden Death trigger) =====
        if (action === "checkTies") {
            const teamsSnap = await adminDb.collection("teams").get();
            const teams = teamsSnap.docs
                .filter(d => d.data().status === "active")
                .map(d => ({ id: d.id, ...d.data() } as { id: string; group: number; score: number; name: string }));

            const ties: { division: number; teams: { id: string; name: string; score: number }[] }[] = [];

            // Check each division for ties
            for (let division = 1; division <= 5; division++) {
                const divisionTeams = teams.filter(t => t.group === division);
                const scoreGroups: { [score: number]: typeof divisionTeams } = {};

                divisionTeams.forEach(t => {
                    if (!scoreGroups[t.score]) scoreGroups[t.score] = [];
                    scoreGroups[t.score].push(t);
                });

                // Find scores with multiple teams
                Object.entries(scoreGroups).forEach(([score, teamsWithScore]) => {
                    if (teamsWithScore.length > 1) {
                        ties.push({
                            division,
                            teams: teamsWithScore.map(t => ({ id: t.id, name: t.name, score: t.score }))
                        });
                    }
                });
            }

            return NextResponse.json({
                success: true,
                hasTies: ties.length > 0,
                ties
            });
        }

        // ===== SIMULATE BOT SCORES =====
        // Give bots random scores for testing purposes
        if (action === "simulateBotScores") {
            const teamsSnap = await adminDb.collection("teams").get();
            const batch = adminDb.batch();
            let botsUpdated = 0;

            teamsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.isBot && data.status === "active") {
                    // Generate random score between 500 and 5000
                    const randomScore = Math.floor(Math.random() * 4500) + 500;
                    // Random streak between 0 and 4
                    const randomStreak = Math.floor(Math.random() * 5);
                    batch.update(doc.ref, {
                        score: randomScore,
                        streak: randomStreak
                    });
                    botsUpdated++;
                }
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Simulated scores for ${botsUpdated} bots.`
            });
        }

        // ===== PAUSE FOR GRADING =====
        // Pause the round timer while waiting for SAQ/Spot grading
        if (action === "pauseForGrading") {
            const { roundId } = body;
            if (!roundId) {
                return NextResponse.json({ error: "roundId required" }, { status: 400 });
            }

            const roundRef = adminDb.collection("rounds").doc(roundId);
            const roundDoc = await roundRef.get();

            if (!roundDoc.exists) {
                return NextResponse.json({ error: "Round not found" }, { status: 404 });
            }

            const roundData = roundDoc.data()!;
            if (roundData.pausedAt) {
                return NextResponse.json({
                    success: true,
                    message: "Already paused",
                    alreadyPaused: true
                });
            }

            await roundRef.update({
                pausedAt: Date.now(),
            });

            return NextResponse.json({
                success: true,
                message: "Round paused for grading"
            });
        }

        // ===== RESUME FROM GRADING =====
        // Resume the round timer after SAQ/Spot grading is complete
        if (action === "resumeFromGrading") {
            const { roundId } = body;
            if (!roundId) {
                return NextResponse.json({ error: "roundId required" }, { status: 400 });
            }

            const roundRef = adminDb.collection("rounds").doc(roundId);
            const roundDoc = await roundRef.get();

            if (!roundDoc.exists) {
                return NextResponse.json({ error: "Round not found" }, { status: 404 });
            }

            const roundData = roundDoc.data()!;
            if (!roundData.pausedAt) {
                return NextResponse.json({
                    success: true,
                    message: "Not paused",
                    wasNotPaused: true
                });
            }

            // Calculate how long we were paused
            const pauseDuration = Date.now() - roundData.pausedAt;
            const existingPauseDuration = roundData.totalPauseDuration || 0;

            await roundRef.update({
                pausedAt: null,
                totalPauseDuration: existingPauseDuration + pauseDuration,
            });

            return NextResponse.json({
                success: true,
                message: `Round resumed. Pause duration: ${Math.round(pauseDuration / 1000)}s`,
                pauseDuration
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Error in game action:", error);
        return NextResponse.json({ error: "Failed to execute action" }, { status: 500 });
    }
}

