import { NextResponse } from "next/server";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

export async function GET(request: Request) {
    try {
        const decodedToken = await verifyAdmin(request);
        return NextResponse.json({
            success: true,
            email: decodedToken.email || null,
        });
    } catch {
        return unauthorizedResponse();
    }
}
