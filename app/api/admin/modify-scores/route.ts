import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

type ModifyMode = "set" | "add" | "subtract";

function roundToTwo(value: number) {
    return Number(value.toFixed(2));
}

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { teamIds, mode, value } = body as {
            teamIds: string[];
            mode: ModifyMode;
            value: number;
        };

        if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
            return NextResponse.json({ error: "teamIds array required" }, { status: 400 });
        }

        if (!mode || !["set", "add", "subtract"].includes(mode)) {
            return NextResponse.json({ error: "mode must be 'set', 'add', or 'subtract'" }, { status: 400 });
        }

        if (typeof value !== "number") {
            return NextResponse.json({ error: "value must be a number" }, { status: 400 });
        }

        const batch = adminDb.batch();
        const updates: { id: string; name: string; oldScore: number; newScore: number }[] = [];

        for (const teamId of teamIds) {
            const teamRef = adminDb.collection("teams").doc(teamId);
            const teamDoc = await teamRef.get();

            if (!teamDoc.exists) continue;

            const data = teamDoc.data()!;
            const oldScore = data.score || 0;
            const carryInScore = data.carryInScore || 0;
            let newScore: number;

            switch (mode) {
                case "set":
                    newScore = value;
                    break;
                case "add":
                    newScore = oldScore + value;
                    break;
                case "subtract":
                    newScore = oldScore - value;
                    break;
            }

            newScore = roundToTwo(Math.max(0, newScore));
            const newTurnGain = roundToTwo(newScore - carryInScore);

            batch.update(teamRef, {
                score: newScore,
                turnGain: newTurnGain,
            });
            updates.push({ id: teamId, name: data.name, oldScore, newScore });
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Modified scores for ${updates.length} teams`,
            updates
        });
    } catch (error) {
        console.error("Error modifying scores:", error);
        return NextResponse.json({ error: "Failed to modify scores" }, { status: 500 });
    }
}
