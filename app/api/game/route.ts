import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_QUESTION_TIMER } from "@/lib/types";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

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

        if (key !== ADMIN_KEY) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ===== INIT GAME =====
        if (action === "simulateTies") {
            const teamsSnap = await adminDb.collection("teams").where("status", "==", "active").orderBy("score", "desc").limit(3).get();
            if (teamsSnap.size < 2) return NextResponse.json({ error: "Not enough active teams" }, { status: 400 });

            const highestScore = teamsSnap.docs[0].data().score;
            const batch = adminDb.batch();
            teamsSnap.docs.forEach(doc => {
                batch.update(doc.ref, { score: highestScore });
            });
            await batch.commit();
            return NextResponse.json({ success: true, message: "Top teams tied." });
        }

        if (action === "triggerSuddenDeath") {
            const configSnap = await adminDb.collection("config").doc("gameConfig").get();
            const configTimer = configSnap.exists ? configSnap.data()?.questionTimer : DEFAULT_QUESTION_TIMER;

            const sdRoundRef = adminDb.collection("rounds").doc("round-sd");
            await sdRoundRef.set({
                id: "round-sd",
                status: "active",
                startTime: Date.now(),
                currentQuestionIndex: 0,
                questionTimer: configTimer || DEFAULT_QUESTION_TIMER,
                isSuddenDeath: true
            }, { merge: true });

            return NextResponse.json({ success: true, message: "Sudden Death Activated." });
        }

        if (action === "initGame") {
            const configSnap = await adminDb.collection("config").doc("gameConfig").get();
            const configTimer = configSnap.exists ? configSnap.data()?.questionTimer : DEFAULT_QUESTION_TIMER;
            const batch = adminDb.batch();

            for (let i = 1; i <= 5; i++) {
                const rRef = adminDb.collection("rounds").doc(`round-${i}`);
                batch.set(rRef, {
                    id: `round-${i}`,
                    status: "waiting",
                    startTime: null,
                    currentQuestionIndex: 0,
                    questionTimer: configTimer || DEFAULT_QUESTION_TIMER,
                    showResults: false,
                    pausedAt: null,
                    totalPauseDuration: 0
                }, { merge: true });
            }

            // Also reset Sudden Death
            const sdRef = adminDb.collection("rounds").doc("round-sd");
            batch.set(sdRef, {
                id: "round-sd",
                status: "waiting",
                startTime: null,
                currentQuestionIndex: 0,
                questionTimer: configTimer || DEFAULT_QUESTION_TIMER,
                showResults: false,
                pausedAt: null,
                totalPauseDuration: 0
            }, { merge: true });

            await batch.commit();

            const answersSnap = await adminDb.collection("answers").get();
            const deleteBatch = adminDb.batch();
            answersSnap.docs.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();

            const challengesSnap = await adminDb.collection("challenges").get();
            const challengeDeleteBatch = adminDb.batch();
            challengesSnap.docs.forEach(doc => {
                challengeDeleteBatch.delete(doc.ref);
            });
            await challengeDeleteBatch.commit();

            const teamsSnap = await adminDb.collection("teams").get();
            const teamBatch = adminDb.batch();
            teamsSnap.docs.forEach(doc => {
                teamBatch.update(doc.ref, {
                    score: 0,
                    status: "active",
                    challengesRemaining: 2,
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
        if (action === "shuffleTeams") {
            const teamsSnap = await adminDb.collection("teams").get();
            const teams = teamsSnap.docs;

            if (teams.length !== 30) {
                return NextResponse.json({
                    error: `Need exactly 30 teams to shuffle. Currently have ${teams.length} teams.`
                }, { status: 400 });
            }

            const shuffled = shuffleArray(teams);
            const batch = adminDb.batch();

            shuffled.forEach((doc, index) => {
                const division = (index % 5) + 1;
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
        if (action === "rearrangeDivisions") {
            const teamsSnap = await adminDb.collection("teams").get();
            const activeTeams = teamsSnap.docs
                .filter(d => d.data().status === "active")
                .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
                .sort((a: any, b: any) => b.score - a.score);

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
        if (action === "runElimination") {
            if (!roundNum) {
                return NextResponse.json({ error: "roundNum required" }, { status: 400 });
            }

            let eliminateCount = 0;
            if (roundNum === 3) {
                eliminateCount = 3;
            } else if (roundNum === 5) {
                eliminateCount = 2;
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
            } as any));

            const batch = adminDb.batch();
            let totalEliminated = 0;

            for (let division = 1; division <= 5; division++) {
                const divisionTeams = teams
                    .filter((t: any) => t.group === division && t.status === "active")
                    .sort((a: any, b: any) => a.score - b.score);

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

        // ===== CHECK FOR TIES =====
        if (action === "checkTies") {
            const teamsSnap = await adminDb.collection("teams").get();
            const teams = teamsSnap.docs
                .filter(d => d.data().status === "active")
                .map(d => ({ id: d.id, ...d.data() } as any));

            const ties: any[] = [];

            for (let division = 1; division <= 5; division++) {
                const divisionTeams = teams.filter((t: any) => t.group === division);
                const scoreGroups: Record<number, any[]> = {};

                divisionTeams.forEach((t: any) => {
                    if (!scoreGroups[t.score]) scoreGroups[t.score] = [];
                    scoreGroups[t.score].push(t);
                });

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
        if (action === "simulateBotScores") {
            const { difficulty = "easy" } = body; // Pass difficulty from admin if possible
            const teamsSnap = await adminDb.collection("teams").get();
            const batch = adminDb.batch();
            let botsUpdated = 0;

            const basePoints = difficulty === "hard" ? 300 : difficulty === "medium" ? 200 : 100;

            teamsSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.isBot && data.status === "active") {
                    // 60% chance to be correct
                    const isCorrect = Math.random() < 0.6;

                    let newScore = data.score || 0;
                    let newStreak = data.streak || 0;

                    if (isCorrect) {
                        newStreak += 1;
                        // Bonus calculation (same as player: base + streak * 50)
                        const streakBonus = Math.min(newStreak, 5) * 50;
                        const points = basePoints + streakBonus;
                        newScore += points;
                    } else {
                        newStreak = 0;
                        // No points lost, just streak reset
                    }

                    batch.update(doc.ref, {
                        score: newScore,
                        streak: newStreak
                    });
                    botsUpdated++;
                }
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Simulated realistic turn for ${botsUpdated} bots.`
            });
        }

        // ===== PAUSE FOR GRADING =====
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
