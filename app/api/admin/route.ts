import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key !== ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const teamsSnap = await adminDb.collection("teams").orderBy("score", "desc").get();
        const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const roundsSnap = await adminDb.collection("rounds").get();
        const rounds = roundsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        const questionsSnap = await adminDb.collection("questions").orderBy("order").get();
        const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const pendingSnap = await adminDb.collection("answers").where("isCorrect", "==", null).get();
        const pendingAnswers = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allAnswersSnap = await adminDb.collection("answers").get();
        const allAnswers = allAnswersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

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
