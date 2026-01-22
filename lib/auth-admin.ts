
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("[AuthDebug] Missing or invalid Authorization header");
        throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check whitelist
        // Filter out empty strings from split if any
        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(e => e);
        const userEmail = decodedToken.email;



        if (!userEmail || !adminEmails.includes(userEmail)) {
            console.warn(`[AuthDebug] Unauthorized access attempt by: ${userEmail}. Not in whitelist.`);
            throw new Error("Unauthorized: Email not whitelisted");
        }

        return decodedToken;
    } catch (error) {
        console.error("Admin verification failed:", error);
        throw new Error("Unauthorized: Invalid token or insufficient permissions");
    }
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
