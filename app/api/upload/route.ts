import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        // key removed

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
            }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `questions/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Firebase Storage
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file public
        await fileRef.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
            message: "Image uploaded successfully"
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}
