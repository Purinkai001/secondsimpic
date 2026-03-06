import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyPlayer, playerUnauthorizedResponse } from "@/lib/auth-player";
import { GROUPS, MAX_TEAMS_PER_GROUP, Team } from "@/lib/types";

function normalizeTeamName(name: string) {
    return name.trim().toLocaleLowerCase();
}

function pickGroup(teams: Team[], maxTeamsPerGroup: number) {
    const groupCounts = GROUPS.reduce<Record<number, number>>((acc, group) => {
        acc[group] = 0;
        return acc;
    }, {});

    teams.forEach((team) => {
        if (GROUPS.includes(team.group)) {
            groupCounts[team.group] += 1;
        }
    });

    const availableGroups = GROUPS.filter((group) => groupCounts[group] < maxTeamsPerGroup);
    if (availableGroups.length > 0) {
        return availableGroups[Math.floor(Math.random() * availableGroups.length)];
    }

    return GROUPS.slice().sort((a, b) => groupCounts[a] - groupCounts[b])[0];
}

export async function POST(request: Request) {
    let decodedToken;

    try {
        decodedToken = await verifyPlayer(request);
    } catch {
        return playerUnauthorizedResponse();
    }

    try {
        const body = await request.json();
        const teamName = String(body.teamName || "").trim();
        const normalizedTeamName = normalizeTeamName(teamName);

        if (!teamName) {
            return NextResponse.json({ error: "Team name is required." }, { status: 400 });
        }

        if (teamName.length > 50) {
            return NextResponse.json({ error: "Team name is too long." }, { status: 400 });
        }

        const configSnap = await adminDb.collection("config").doc("gameConfig").get();
        const maxTeamsPerGroup = Number(configSnap.data()?.maxTeamsPerGroup) || MAX_TEAMS_PER_GROUP;
        const totalCapacity = maxTeamsPerGroup * GROUPS.length;

        const result = await adminDb.runTransaction(async (transaction) => {
            const allTeamsSnap = await transaction.get(adminDb.collection("teams"));
            const existingTeam = allTeamsSnap.docs.find((doc) => {
                const teamData = doc.data() as Team;
                return normalizeTeamName(teamData.name) === normalizedTeamName;
            });

            if (existingTeam) {
                const teamData = existingTeam.data() as Team;

                if (teamData.status === "eliminated") {
                    throw new Error("ELIMINATED");
                }

                transaction.update(existingTeam.ref, { ownerUid: decodedToken.uid });

                return {
                    teamId: existingTeam.id,
                    name: teamData.name,
                    group: teamData.group,
                    status: teamData.status,
                };
            }

            if (allTeamsSnap.size >= totalCapacity) {
                throw new Error("FULL");
            }

            const allTeams = allTeamsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
            const group = pickGroup(allTeams, maxTeamsPerGroup);
            const teamRef = adminDb.collection("teams").doc();

            transaction.set(teamRef, {
                name: teamName,
                group,
                score: 0,
                status: "active",
                isBot: false,
                challengesRemaining: 2,
                streak: 0,
                createdAt: Date.now(),
                ownerUid: decodedToken.uid,
            });

            return {
                teamId: teamRef.id,
                name: teamName,
                group,
                status: "active",
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "ELIMINATED") {
            return NextResponse.json({ error: "This team has been eliminated." }, { status: 403 });
        }

        if (error instanceof Error && error.message === "FULL") {
            return NextResponse.json({ error: "All rooms are full." }, { status: 409 });
        }

        console.error("Error joining team:", error);
        return NextResponse.json({ error: "Failed to join team." }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    let decodedToken;

    try {
        decodedToken = await verifyPlayer(request);
    } catch {
        return playerUnauthorizedResponse();
    }

    try {
        const body = await request.json();
        const teamId = String(body.teamId || "").trim();
        const newName = String(body.newName || "").trim();
        const normalizedNewName = normalizeTeamName(newName);

        if (!teamId || !newName) {
            return NextResponse.json({ error: "teamId and newName are required." }, { status: 400 });
        }

        if (newName.length > 50) {
            return NextResponse.json({ error: "Team name is too long." }, { status: 400 });
        }

        const result = await adminDb.runTransaction(async (transaction) => {
            const teamRef = adminDb.collection("teams").doc(teamId);
            const [teamSnap, allTeamsSnap] = await Promise.all([
                transaction.get(teamRef),
                transaction.get(adminDb.collection("teams")),
            ]);

            if (!teamSnap.exists) {
                throw new Error("NOT_FOUND");
            }

            const teamData = teamSnap.data() as Team;
            const ownerUid = teamData.ownerUid;
            if (ownerUid && ownerUid !== decodedToken.uid) {
                throw new Error("FORBIDDEN");
            }

            if (!ownerUid) {
                transaction.update(teamRef, { ownerUid: decodedToken.uid });
            }

            const duplicateTeam = allTeamsSnap.docs.find((doc) => {
                if (doc.id === teamId) {
                    return false;
                }

                const otherTeam = doc.data() as Team;
                return normalizeTeamName(otherTeam.name) === normalizedNewName;
            });

            if (duplicateTeam) {
                throw new Error("NAME_TAKEN");
            }

            transaction.update(teamRef, { name: newName, ownerUid: decodedToken.uid });

            return { success: true, name: newName };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Team not found." }, { status: 404 });
        }

        if (error instanceof Error && error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Team is not owned by current player." }, { status: 403 });
        }

        if (error instanceof Error && error.message === "NAME_TAKEN") {
            return NextResponse.json({ error: "That team name is already in use." }, { status: 409 });
        }

        console.error("Error renaming team:", error);
        return NextResponse.json({ error: "Failed to rename team." }, { status: 500 });
    }
}
