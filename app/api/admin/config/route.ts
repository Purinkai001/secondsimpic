import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

export async function PATCH(request: Request) {
    try {
        await verifyAdmin(request);
    } catch {
        return unauthorizedResponse();
    }

    try {
        const updates = await request.json();
        const allowedFields = ["questionTimer", "allowRejoin", "maxTeamsPerGroup"];
        const sanitizedUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key]) => allowedFields.includes(key))
        );

        if (Object.keys(sanitizedUpdates).length === 0) {
            return NextResponse.json({ error: "No valid config fields provided" }, { status: 400 });
        }

        await adminDb.collection("config").doc("gameConfig").set(sanitizedUpdates, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating config:", error);
        return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
    }
}
