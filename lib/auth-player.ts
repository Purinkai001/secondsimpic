import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function verifyPlayer(request: Request) {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        return await adminAuth.verifyIdToken(token);
    } catch (error) {
        console.error("Player verification failed:", error);
        throw new Error("Unauthorized: Invalid token");
    }
}

export function playerUnauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
