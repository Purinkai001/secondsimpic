import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET: Fetch all questions
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const roundId = searchParams.get("roundId"); // Optional filter

    if (key !== "admin123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let questionsSnap;

        if (roundId) {
            // Fetch by roundId only, sort in code to avoid composite index requirement
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
        const body = await request.json();
        const { key, question } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!question || !question.roundId || !question.type || !question.difficulty) {
            return NextResponse.json({ error: "Missing required fields: roundId, type, difficulty" }, { status: 400 });
        }

        // Get the next order number for this round
        const existingQs = await adminDb.collection("questions")
            .where("roundId", "==", question.roundId)
            .get();
        const nextOrder = question.order || existingQs.size + 1;

        // Extract round number from roundId (e.g., "round-1" -> "1")
        const roundNumber = question.roundId.replace("round-", "");

        // Generate predictable ID: q-round-{roundNum}-{order}
        const questionId = `q-round-${roundNumber}-${nextOrder}`;

        // Check if this ID already exists
        const existingDoc = await adminDb.collection("questions").doc(questionId).get();
        if (existingDoc.exists) {
            return NextResponse.json({
                error: `Question ${questionId} already exists. Delete it first or use a different order.`
            }, { status: 400 });
        }

        // Create the question with predictable ID
        const questionRef = adminDb.collection("questions").doc(questionId);
        const questionData = {
            id: questionId,
            roundId: question.roundId,
            text: question.text || "",
            type: question.type,
            difficulty: question.difficulty,
            order: nextOrder,
            imageUrl: question.imageUrl || null,
            // For MCQ
            choices: question.choices || null,
            correctChoiceIndex: question.correctChoiceIndex ?? null,
            // For MTF
            statements: question.statements || null,
            // For SAQ/Spot
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
        const body = await request.json();
        const { key, questionId, updates } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        const body = await request.json();
        const { key, questionId } = body;

        if (key !== "admin123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
