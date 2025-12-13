import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

// GET: Fetch all admin data (teams, rounds, questions, answers, challenges)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key !== "admin123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch teams
        const teamsSnap = await adminDb.collection("teams").orderBy("score", "desc").get();
        const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch rounds
        const roundsSnap = await adminDb.collection("rounds").get();
        const rounds = roundsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        // Fetch questions
        const questionsSnap = await adminDb.collection("questions").orderBy("order").get();
        const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch pending answers (needing grading)
        const pendingSnap = await adminDb.collection("answers").where("isCorrect", "==", null).get();
        const pendingAnswers = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch all answers
        const allAnswersSnap = await adminDb.collection("answers").get();
        const allAnswers = allAnswersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch challenges
        const challengesSnap = await adminDb.collection("challenges").orderBy("createdAt", "desc").get();
        const challenges = challengesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({
            success: true,
            teams,
            rounds,
            questions,
            pendingAnswers,
            allAnswers,
            challenges
        });
    } catch (error) {
        console.error("Error fetching admin data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
