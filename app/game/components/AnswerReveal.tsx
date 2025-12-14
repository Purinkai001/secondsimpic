"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Flame, Flag, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, Question } from "@/lib/types";
import { SubmissionResult, CorrectAnswerData } from "../types";

interface AnswerRevealProps {
    question: Question;
    result: SubmissionResult | null;
    countdown: number;
    team: Team | null;
    userMcqAnswer: number | null;
    userMtfAnswers: boolean[];
    onChallenge: () => void;
}

export function AnswerReveal({
    question,
    result,
    countdown,
    team,
    userMcqAnswer,
    userMtfAnswers,
    onChallenge
}: AnswerRevealProps) {
    const isPending = result?.pendingGrading;
    const isMTF = question.type === "mtf";

    // For MTF, show partial scoring
    const mtfCorrectCount = result?.mtfCorrectCount || 0;
    const mtfTotalCount = result?.mtfTotalCount || 0;

    return (
        <div className="p-8">
            {/* Question recap */}
            <p className="text-gray-400 text-sm mb-2">Question:</p>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-white/80">
                {question.text || "(Image question)"}
            </h2>

            {/* Result display */}
            <div className={cn(
                "rounded-xl p-8 text-center border-2",
                isPending
                    ? "bg-yellow-500/10 border-yellow-500"
                    : isMTF
                        ? "bg-purple-500/10 border-purple-500"
                        : result?.isCorrect === true
                            ? "bg-green-500/10 border-green-500"
                            : "bg-red-500/10 border-red-500"
            )}>
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                    isPending
                        ? "bg-yellow-500"
                        : isMTF
                            ? "bg-purple-500"
                            : result?.isCorrect === true
                                ? "bg-green-500"
                                : "bg-red-500"
                )}>
                    {isPending
                        ? <Loader2 className="w-10 h-10 text-white animate-spin" />
                        : isMTF
                            ? <span className="text-2xl font-bold text-white">{mtfCorrectCount}/{mtfTotalCount}</span>
                            : result?.isCorrect === true
                                ? <CheckCircle2 className="w-10 h-10 text-white" />
                                : <XCircle className="w-10 h-10 text-white" />
                    }
                </div>

                <h3 className={cn(
                    "text-3xl font-bold mb-2",
                    isPending
                        ? "text-yellow-400"
                        : isMTF
                            ? "text-purple-400"
                            : result?.isCorrect === true ? "text-green-400" : "text-red-400"
                )}>
                    {isPending
                        ? "Pending Grading"
                        : isMTF
                            ? `${mtfCorrectCount}/${mtfTotalCount} Correct`
                            : result?.isCorrect === true ? "Correct!" : "Incorrect"}
                </h3>

                {result?.points ? (
                    <p className="text-green-300 font-bold text-3xl mb-2">+{result.points} points</p>
                ) : null}

                {/* Streak display (only for auto-graded) */}
                {!isPending && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Flame className={cn(
                            "w-6 h-6",
                            (result?.streak || 0) > 0 ? "text-orange-400" : "text-gray-500"
                        )} />
                        <span className={cn(
                            "text-lg font-bold",
                            (result?.streak || 0) > 0 ? "text-orange-400" : "text-gray-500"
                        )}>
                            Streak: {result?.streak || 0}
                        </span>
                    </div>
                )}

                {result?.message && (
                    <p className="text-white/60 text-sm mt-4">{result.message}</p>
                )}

                {/* Challenge button for incorrect answers (not for pending or MTF) */}
                {result?.isCorrect === false && !isPending && !isMTF && (team?.challengesRemaining ?? 0) > 0 && (
                    <button
                        onClick={onChallenge}
                        className="mt-6 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-6 py-3 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Flag className="w-5 h-5" /> Challenge ({team?.challengesRemaining} left)
                    </button>
                )}
            </div>

            {/* Show correct answers for MCQ/MTF */}
            {renderCorrectAnswer(question, result?.correctAnswer, userMcqAnswer, userMtfAnswers)}
        </div>
    );
}

function renderCorrectAnswer(
    question: Question,
    correctData: CorrectAnswerData | undefined,
    userMcqAnswer: number | null,
    userMtfAnswers: boolean[]
) {
    if (!correctData) return null;

    // For SAQ/Spot - show pending grading message
    if (correctData.pendingGrading) {
        return (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Waiting for Admin Grading</span>
                </div>
                <p className="text-yellow-400/60 text-sm text-center">
                    Your answer has been submitted. The game will continue once grading is complete.
                </p>
            </div>
        );
    }

    switch (correctData.type) {
        case "mcq":
            if (correctData.correctChoiceIndex === undefined || !correctData.choices) return null;
            const correctIdx = correctData.correctChoiceIndex;
            return (
                <div className="mt-6 space-y-3">
                    <p className="text-white/60 text-sm font-semibold">Correct Answer:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {correctData.choices.map((choice, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-4 rounded-xl border-2 flex items-center gap-3",
                                    idx === correctIdx
                                        ? "border-green-500 bg-green-500/10"
                                        : userMcqAnswer === idx && idx !== correctIdx
                                            ? "border-red-500 bg-red-500/10"
                                            : "border-white/10 bg-white/5 opacity-50"
                                )}
                            >
                                <span className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                    idx === correctIdx
                                        ? "bg-green-500 text-white"
                                        : userMcqAnswer === idx && idx !== correctIdx
                                            ? "bg-red-500 text-white"
                                            : "bg-white/10 text-slate-400"
                                )}>
                                    {idx === correctIdx ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                                </span>
                                <span className={cn(
                                    "font-medium",
                                    idx === correctIdx ? "text-green-400" : "text-white/60"
                                )}>
                                    {choice.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case "mtf":
            if (!correctData.statements) return null;
            return (
                <div className="mt-6 space-y-3">
                    <p className="text-white/60 text-sm font-semibold">Answer Breakdown:</p>
                    <div className="space-y-2">
                        {correctData.statements.map((statement, idx) => {
                            const userAnswer = userMtfAnswers[idx];
                            const isUserCorrect = userAnswer === statement.isTrue;
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-4 rounded-xl border flex items-center justify-between gap-4",
                                        isUserCorrect
                                            ? "border-green-500/30 bg-green-500/10"
                                            : "border-red-500/30 bg-red-500/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0",
                                            isUserCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                        )}>
                                            {isUserCorrect ? "✓" : "✗"}
                                        </span>
                                        <span className="text-white/80 truncate">{statement.text}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Your answer */}
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold",
                                            userAnswer === true
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-red-500/20 text-red-400"
                                        )}>
                                            You: {userAnswer ? "T" : "F"}
                                        </span>
                                        {/* Correct answer */}
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold",
                                            statement.isTrue
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                        )}>
                                            Ans: {statement.isTrue ? "T" : "F"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );

        default:
            return null;
    }
}
