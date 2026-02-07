import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth-admin";
import { Question } from "@/lib/types";

// Helper: Re-indexes questions to ensure 1..N order
async function reindexQuestions(
    roundId: string,
    operation: (questions: any[]) => Promise<void> | void
) {
    const questionsRef = adminDb.collection("questions");
    const snapshot = await questionsRef.where("roundId", "==", roundId).get();

    let questions = snapshot.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data()
    })) as any[];

    questions.sort((a, b) => (a.order || 0) - (b.order || 0));

    await operation(questions);

    const batch = adminDb.batch();
    let batchCount = 0;

    questions.forEach((q, index) => {
        const newOrder = index + 1;

        if (q.ref && q.order !== newOrder) {
            batch.update(q.ref, { order: newOrder });
            batchCount++;
        }

        q.order = newOrder;
    });

    if (batchCount > 0) {
        await batch.commit();
    }

    return questions;
}

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
        const { question } = body;

        if (!question || !question.roundId || !question.type || !question.difficulty) {
            return NextResponse.json({ error: "Missing required fields: roundId, type, difficulty" }, { status: 400 });
        }

        const roundNumber = question.roundId.replace("round-", "");
        let finalOrder = 0;
        let questionId = "";

        await reindexQuestions(question.roundId, (questions) => {
            const desiredOrder = question.order || questions.length + 1;
            const insertIndex = Math.min(Math.max(0, desiredOrder - 1), questions.length);

            const maxIdSuffix = questions.reduce((max, q) => {
                const parts = q.id.split('-');
                const num = parseInt(parts[parts.length - 1]);
                return !isNaN(num) && num > max ? num : max;
            }, 0);

            questionId = `q-round-${roundNumber}-${maxIdSuffix + 1}`;

            questions.splice(insertIndex, 0, {
                id: questionId,
                isNew: true
            });
        }).then(finalList => {
            const q = finalList.find(q => q.id === questionId);
            if (q) finalOrder = q.order;
        });

        const questionRef = adminDb.collection("questions").doc(questionId);
        const questionData = {
            id: questionId,
            roundId: question.roundId,
            text: question.text || "",
            type: question.type,
            difficulty: question.difficulty,
            order: finalOrder,
            imageUrl: question.imageUrl || null,
            choices: question.choices || null,
            correctChoiceIndex: question.correctChoiceIndex ?? null,
            correctChoiceIndices: question.correctChoiceIndices || null,
            statements: question.statements || null,
            correctAnswer: question.correctAnswer || null,
            alternateAnswers: question.alternateAnswers || null,
        };

        await questionRef.set(questionData);

        return NextResponse.json({
            success: true,
            question: questionData,
            message: `Question ${questionId} created at order ${finalOrder}`
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

        if (typeof updates.order === 'number') {
            const qSnap = await adminDb.collection("questions").doc(questionId).get();
            if (!qSnap.exists) {
                return NextResponse.json({
                    success: true,
                    message: "Question not found (update ignored)"
                });
            }
            const currentData = qSnap.data();
            const roundId = currentData?.roundId;

            if (roundId) {
                await reindexQuestions(roundId, (questions) => {
                    const currentIndex = questions.findIndex(q => q.id === questionId);
                    if (currentIndex === -1) return;

                    const [movedQ] = questions.splice(currentIndex, 1);

                    const desiredOrder = updates.order;
                    const newIndex = Math.min(Math.max(0, desiredOrder - 1), questions.length);

                    questions.splice(newIndex, 0, movedQ);
                });
            }

            const { order, ...otherUpdates } = updates;
            if (Object.keys(otherUpdates).length > 0) {
                await adminDb.collection("questions").doc(questionId).update(otherUpdates);
            }

        } else {
            try {
                await adminDb.collection("questions").doc(questionId).update(updates);
            } catch (error: any) {
                if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
                    return NextResponse.json({
                        success: true,
                        message: "Question not found (update ignored)"
                    });
                }
                throw error;
            }
        }

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

        const questionRef = adminDb.collection("questions").doc(questionId);
        const questionSnap = await adminDb.collection("questions").doc(questionId).get();

        if (!questionSnap.exists) {
            return NextResponse.json({
                success: true,
                message: "Question already deleted (ignored)"
            });
        }

        const roundId = questionSnap.data()?.roundId;

        if (roundId) {
            await reindexQuestions(roundId, (questions) => {
                const index = questions.findIndex(q => q.id === questionId);
                if (index !== -1) {
                    questions.splice(index, 1);
                }
            });
        }

        await questionRef.delete();

        return NextResponse.json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json(
            { error: "Failed to delete question", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
