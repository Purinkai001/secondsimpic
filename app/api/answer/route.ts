import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateAnswerScore } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";
import { verifyPlayer, playerUnauthorizedResponse } from "@/lib/auth-player";
import { mergeQuestionWithKey } from "@/lib/question-data";

type AnswerableQuestion = {
    type?: QuestionType;
    statements?: Array<{ text: string; isTrue?: boolean }>;
    difficulty?: Difficulty;
    order?: number;
    roundId?: string;
    imageUrl?: string | null;
    text?: string;
};

function isValidAnswerPayload(question: AnswerableQuestion, type: QuestionType, answer: unknown) {
    if (type !== question.type) {
        return false;
    }

    if (type === "mcq") {
        return typeof answer === "number" && Number.isInteger(answer);
    }

    if (type === "mtf") {
        return Array.isArray(answer)
            && answer.length === (question.statements?.length || 0)
            && answer.every((value) => value === null || typeof value === "boolean");
    }

    if (type === "saq" || type === "spot") {
        return typeof answer === "string";
    }

    return false;
}

export async function POST(request: Request) {
    let decodedToken;

    try {
        decodedToken = await verifyPlayer(request);
    } catch {
        return playerUnauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { teamId, questionId, roundId, answer, type, timeSpent } = body;

        if (!teamId || !questionId || !roundId || answer === undefined || !type || timeSpent === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (typeof timeSpent !== "number" || !Number.isFinite(timeSpent)) {
            return NextResponse.json({ error: "timeSpent must be a number" }, { status: 400 });
        }

        const result = await adminDb.runTransaction(async (transaction) => {
            const answerId = `${teamId}_${questionId}`;
            const answerRef = adminDb.collection("answers").doc(answerId);
            const teamRef = adminDb.collection("teams").doc(teamId);
            const questionRef = adminDb.collection("questions").doc(questionId);
            const questionKeyRef = adminDb.collection("questionKeys").doc(questionId);
            const roundRef = adminDb.collection("rounds").doc(roundId);

            const [answerDoc, teamDoc, questionDoc, questionKeyDoc, roundDoc] = await Promise.all([
                transaction.get(answerRef),
                transaction.get(teamRef),
                transaction.get(questionRef),
                transaction.get(questionKeyRef),
                transaction.get(roundRef)
            ]);

            // 1. Prevent Double Submission or Replay
            if (answerDoc.exists) {
                throw new Error("ALREADY_SUBMITTED");
            }

            if (!teamDoc.exists || !questionDoc.exists || !roundDoc.exists) {
                throw new Error("NOT_FOUND");
            }

            const teamData = teamDoc.data()!;

            if (teamData.ownerUid && teamData.ownerUid !== decodedToken.uid) {
                throw new Error("FORBIDDEN");
            }

            if (!teamData.ownerUid) {
                transaction.update(teamRef, { ownerUid: decodedToken.uid });
                teamData.ownerUid = decodedToken.uid;
            }

            if (teamData.status === "eliminated") {
                throw new Error("ELIMINATED");
            }

            const question = mergeQuestionWithKey(
                { id: questionDoc.id, ...questionDoc.data() },
                questionKeyDoc.exists ? questionKeyDoc.data() : null
            ) as AnswerableQuestion;
            const roundData = roundDoc.data()!;

            if (roundData.status !== "active" || roundData.showResults || roundData.pausedAt) {
                throw new Error("ROUND_CLOSED");
            }

            if (question.roundId !== roundId) {
                throw new Error("QUESTION_MISMATCH");
            }

            const currentQuestionOrder = (roundData.currentQuestionIndex || 0) + 1;
            if ((question.order || 0) !== currentQuestionOrder) {
                throw new Error("QUESTION_NOT_ACTIVE");
            }

            if (!isValidAnswerPayload(question, type as QuestionType, answer)) {
                throw new Error("INVALID_ANSWER");
            }

            // 2. Validate Time (Grace period 5s)
            const GRACE_PERIOD_MS = 10000;
            const now = Date.now();
            const startTime = roundData.startTime;
            const timerSec = roundData.questionTimer || 30;

            let effectiveTimeSpent = timeSpent;

            if (startTime) {
                const pauseDur = roundData.totalPauseDuration || 0;

                // Strict Server-Side Time Validation
                // Calculate how much time has legally passed on server
                const serverElapsed = (now - startTime - pauseDur) / 1000;

                // Prevent "Zero-Second" cheats: 
                // If server knows 50s have passed, user cannot claim 1s.
                // We allow a 2s buffer for network latency/clock drift.
                const minExpectedTime = Math.max(0, serverElapsed - 2);
                effectiveTimeSpent = Math.max(timeSpent, minExpectedTime);

                const maxEndTime = startTime + (timerSec * 1000) + pauseDur + GRACE_PERIOD_MS;
                if (now > maxEndTime) {
                    throw new Error("TIME_EXPIRED");
                }
            }

            const difficulty: Difficulty = question.difficulty || "easy";
            const currentStreak = teamData.streak || 0;

            // 3. Centralized Scoring Logic
            const scoreResult = calculateAnswerScore(
                question,
                answer,
                type,
                difficulty,
                effectiveTimeSpent,
                currentStreak
            );

            // Write Answer
            transaction.set(answerRef, {
                teamId,
                questionId,
                roundId,
                answer,
                type: type as QuestionType,
                submittedAt: now,
                timeSpent: effectiveTimeSpent,
                isCorrect: scoreResult.isCorrect,
                points: scoreResult.points,
                difficulty,
                imageUrl: question.imageUrl || null,
                questionText: question.text || "",
                mtfCorrectCount: scoreResult.mtfStats?.correctCount ?? null,
                mtfTotalCount: scoreResult.mtfStats?.totalCount ?? null,
            });

            // Update Team Score (Atomic)
            if (scoreResult.points !== 0 || scoreResult.newStreak !== currentStreak) {
                transaction.update(teamRef, {
                    score: FieldValue.increment(scoreResult.points),
                    streak: scoreResult.newStreak
                });
            }

            // Build Message
            let message = "";
            if (type === "mtf") {
                const { correctCount, totalCount } = scoreResult.mtfStats || { correctCount: 0, totalCount: 0 };
                if (scoreResult.isCorrect) message = `${correctCount}/${totalCount} correct! +${scoreResult.points} points`;
                else message = `${correctCount}/${totalCount} correct. No partial points.`;
            } else if (scoreResult.isCorrect === true) {
                message = `Correct! +${scoreResult.points} points (${difficulty}, ${effectiveTimeSpent.toFixed(1)}s, streak: ${scoreResult.newStreak})`;
            } else if (scoreResult.isCorrect === false) {
                message = "Incorrect. Streak reset.";
            } else {
                message = "Answer submitted. Waiting for admin to grade.";
            }

            return {
                success: true,
                isCorrect: scoreResult.isCorrect,
                points: scoreResult.points,
                streak: scoreResult.newStreak,
                message,
                pendingGrading: scoreResult.isCorrect === null && type !== "mtf",
                mtfCorrectCount: scoreResult.mtfStats?.correctCount,
                mtfTotalCount: scoreResult.mtfStats?.totalCount,
                imageUrl: question.imageUrl || null,
                questionText: question.text || "",
            };
        });

        return NextResponse.json(result);

    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "ALREADY_SUBMITTED") {
            return NextResponse.json({ error: "Answer already received" }, { status: 409 });
        }
        if (message === "TIME_EXPIRED") {
            return NextResponse.json({ error: "Time expired for this question" }, { status: 403 });
        }
        if (message === "FORBIDDEN") {
            return NextResponse.json({ error: "Team is not owned by current player" }, { status: 403 });
        }
        if (message === "NOT_FOUND") {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        if (message === "ELIMINATED") {
            return NextResponse.json({ error: "Team is eliminated" }, { status: 403 });
        }
        if (message === "ROUND_CLOSED") {
            return NextResponse.json({ error: "This round is not accepting answers" }, { status: 403 });
        }
        if (message === "QUESTION_MISMATCH" || message === "QUESTION_NOT_ACTIVE") {
            return NextResponse.json({ error: "This question is not currently active" }, { status: 409 });
        }
        if (message === "INVALID_ANSWER") {
            return NextResponse.json({ error: "Invalid answer payload" }, { status: 400 });
        }
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
