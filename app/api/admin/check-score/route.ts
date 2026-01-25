import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

export type TeamTie = {
    id: string;
    name: string;
    score: number;
};

export type DivisionTie = {
    division: number;
    score: number;
    teams: TeamTie[];
};

export async function findTiedTeams(): Promise<{ ties: DivisionTie[]; allTiedTeamIds: string[] }> {
    const teamsSnap = await adminDb.collection("teams").get();
    const teams = teamsSnap.docs
        .filter(d => d.data().status === "active")
        .map(d => ({
            id: d.id,
            name: d.data().name as string,
            score: d.data().score as number,
            group: d.data().group as number
        }));

    const ties: DivisionTie[] = [];
    const allTiedTeamIds: string[] = [];

    for (let division = 1; division <= 5; division++) {
        const divisionTeams = teams.filter(t => t.group === division);
        const scoreGroups: Record<number, TeamTie[]> = {};

        divisionTeams.forEach(t => {
            if (!scoreGroups[t.score]) scoreGroups[t.score] = [];
            scoreGroups[t.score].push({ id: t.id, name: t.name, score: t.score });
        });

        Object.entries(scoreGroups).forEach(([scoreStr, teamsWithScore]) => {
            if (teamsWithScore.length > 1) {
                ties.push({
                    division,
                    score: Number(scoreStr),
                    teams: teamsWithScore
                });
                teamsWithScore.forEach(t => allTiedTeamIds.push(t.id));
            }
        });
    }

    return { ties, allTiedTeamIds };
}

export async function GET(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const { ties } = await findTiedTeams();

        return NextResponse.json({
            success: true,
            hasTies: ties.length > 0,
            count: ties.length,
            ties
        });
    } catch (error) {
        console.error("Error checking scores:", error);
        return NextResponse.json({ error: "Failed to check scores" }, { status: 500 });
    }
}
