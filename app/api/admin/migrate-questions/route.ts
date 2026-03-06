import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { buildPublicQuestionData, buildQuestionKeyData, mergeQuestionWithKey } from "@/lib/question-data";

export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch {
        return unauthorizedResponse();
    }

    try {
        const questionsSnap = await adminDb.collection("questions").get();
        const keyRefs = questionsSnap.docs.map((doc) => adminDb.collection("questionKeys").doc(doc.id));
        const keySnaps = await Promise.all(keyRefs.map((ref) => ref.get()));

        let migrated = 0;
        const batch = adminDb.batch();

        questionsSnap.docs.forEach((doc, index) => {
            const keySnap = keySnaps[index];
            const fullQuestion = mergeQuestionWithKey(
                { id: doc.id, ...doc.data() },
                keySnap.exists ? keySnap.data() : null
            );

            batch.set(doc.ref, buildPublicQuestionData(fullQuestion));
            batch.set(keyRefs[index], buildQuestionKeyData(fullQuestion));
            migrated += 1;
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            migrated,
        });
    } catch (error) {
        console.error("Error migrating questions:", error);
        return NextResponse.json({ error: "Failed to migrate questions" }, { status: 500 });
    }
}
