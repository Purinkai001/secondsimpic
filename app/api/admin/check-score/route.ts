import { NextResponse } from "next/server";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { findTiedTeams, type TeamTie, type DivisionTie } from "@/lib/admin/services/checkScore";

export type { TeamTie, DivisionTie };
export { findTiedTeams };

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
