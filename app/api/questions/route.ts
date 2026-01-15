import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";

// GET: Fetch all questions
export async function GET(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    try {
        let questionsSnap;

        if (roundId) {
            questionsSnap = await adminDb.collection("questions")
                .where("roundId", "==", roundId)
                .get();
        } else {
            questionsSnap = await adminDb.collection("questions").get();
        }

        const questions = questionsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        return NextResponse.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

// POST: Create a new question
export async function POST(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { question } = body; // Removed 'key'

        if (!question || !question.roundId || !question.type || !question.difficulty) {
            return NextResponse.json({ error: "Missing required fields: roundId, type, difficulty" }, { status: 400 });
        }

        const existingQs = await adminDb.collection("questions")
            .where("roundId", "==", question.roundId)
            .get();
        const nextOrder = question.order || existingQs.size + 1;
        const roundNumber = question.roundId.replace("round-", "");
        const questionId = `q-round-${roundNumber}-${nextOrder}`;

        const existingDoc = await adminDb.collection("questions").doc(questionId).get();
        if (existingDoc.exists) {
            return NextResponse.json({
                error: `Question ${questionId} already exists.`
            }, { status: 400 });
        }

        const questionRef = adminDb.collection("questions").doc(questionId);
        const questionData = {
            id: questionId,
            roundId: question.roundId,
            text: question.text || "",
            type: question.type,
            difficulty: question.difficulty,
            order: nextOrder,
            imageUrl: question.imageUrl || null,
            choices: question.choices || null,
            correctChoiceIndex: question.correctChoiceIndex ?? null,
            statements: question.statements || null,
            correctAnswer: question.correctAnswer || null,
        };

        await questionRef.set(questionData);

        return NextResponse.json({
            success: true,
            question: questionData,
            message: `Question ${questionId} created successfully`
        });
    } catch (error) {
        console.error("Error creating question:", error);
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }
}

// PUT: Update an existing question
export async function PUT(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { questionId, updates } = body;

        if (!questionId || !updates) {
            return NextResponse.json({ error: "questionId and updates required" }, { status: 400 });
        }

        await adminDb.collection("questions").doc(questionId).update(updates);

        return NextResponse.json({
            success: true,
            message: "Question updated successfully"
        });
    } catch (error) {
        console.error("Error updating question:", error);
        return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }
}

// DELETE: Delete a question
export async function DELETE(request: Request) {
    try {
        await verifyAdmin(request);
    } catch (e) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { questionId } = body;

        if (!questionId) {
            return NextResponse.json({ error: "questionId required" }, { status: 400 });
        }

        await adminDb.collection("questions").doc(questionId).delete();

        return NextResponse.json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    }
}
