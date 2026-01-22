import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calculateAnswerScore } from "@/lib/scoring";
import { Difficulty, QuestionType } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

// Removed local checkMTFPartial in favor of library function

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamId, questionId, roundId, answer, type, timeSpent } = body;

        if (!teamId || !questionId || !roundId || answer === undefined || !type || timeSpent === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await adminDb.runTransaction(async (transaction) => {
            const answerId = `${teamId}_${questionId}`;
            const answerRef = adminDb.collection("answers").doc(answerId);
            const teamRef = adminDb.collection("teams").doc(teamId);
            const questionRef = adminDb.collection("questions").doc(questionId);
            const roundRef = adminDb.collection("rounds").doc(roundId);

            const [answerDoc, teamDoc, questionDoc, roundDoc] = await Promise.all([
                transaction.get(answerRef),
                transaction.get(teamRef),
                transaction.get(questionRef),
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

            if (teamData.status === "eliminated") {
                throw new Error("ELIMINATED");
            }

            const question = questionDoc.data()!;
            const roundData = roundDoc.data()!;

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
                correctAnswer: scoreResult.correctAnswerData,
                pendingGrading: scoreResult.isCorrect === null && type !== "mtf",
                mtfCorrectCount: scoreResult.mtfStats?.correctCount,
                mtfTotalCount: scoreResult.mtfStats?.totalCount,
            };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        if (error.message === "ALREADY_SUBMITTED") {
            return NextResponse.json({ error: "Answer already received" }, { status: 409 });
        }
        if (error.message === "TIME_EXPIRED") {
            return NextResponse.json({ error: "Time expired for this question" }, { status: 403 });
        }
        if (error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }
        if (error.message === "ELIMINATED") {
            return NextResponse.json({ error: "Team is eliminated" }, { status: 403 });
        }
        console.error("Error submitting answer:", error);
        return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }
}
