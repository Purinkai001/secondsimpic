"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { api } from "@/lib/api";
import { CheckSquare, ShieldCheck, User, BookOpen, Check, X, Users, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Team, Question, Answer } from "@/lib/types";

// Type for answer with question data
type AnswerWithQuestion = Answer & { question?: Question };

// Type for team group
type TeamAnswerGroup = {
    team?: Team;
    answers: AnswerWithQuestion[];
};

export default function GradingPage() {
    // State for viewing history
    const [view, setView] = useState<"pending" | "history">("pending");

    // Get all data from the main hook
    const { pendingAnswers, teams, questions, allAnswers } = useAdminDashboard();

    const displayedAnswers = view === "pending"
        ? pendingAnswers
        : allAnswers.filter((a) => a.isCorrect !== null && a.answer !== undefined); // Show anything with a made decision

    // Grouping by team
    const teamGroups = displayedAnswers.reduce((acc: Record<string, TeamAnswerGroup>, answer) => {
        const teamId = answer.teamId;
        if (!acc[teamId]) {
            acc[teamId] = {
                team: teams.find(t => t.id === teamId),
                answers: []
            };
        }
        acc[teamId].answers.push({
            ...answer,
            question: questions.find(q => q.id === answer.questionId)
        });
        return acc;
    }, {});

    const teamIds = Object.keys(teamGroups);

    const gradeAnswer = async (answerId: string, correct: boolean) => {
        try {
            await api.gradeAnswer(answerId, correct);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Grading failed");
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-foreground via-foreground to-amber-500 bg-clip-text text-transparent tracking-tight">
                        {view === "pending" ? "GRADING QUEUE" : "GRADING HISTORY"}
                    </h1>
                    <p className="text-muted mt-2 text-lg font-medium">Manual assessment hub for medical reasoning</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex bg-surface-bg rounded-2xl p-1 border border-surface-border transition-colors duration-300">
                        <button
                            onClick={() => setView("pending")}
                            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", view === "pending" ? "bg-amber-500 text-black" : "text-muted hover:text-foreground")}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", view === "history" ? "bg-accent-blue text-white" : "text-muted hover:text-foreground")}
                        >
                            History
                        </button>
                    </div>

                    <div className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                        <Users className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                        <div>
                            <p className="text-2xl font-black leading-none text-foreground">{teamIds.length}</p>
                            <p className="text-[10px] font-black uppercase text-amber-600/50 dark:text-amber-500/50 mt-1">Teams</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                <AnimatePresence mode="popLayout">
                    {teamIds.map((teamId, tIdx) => {
                        const group = teamGroups[teamId];
                        return (
                            <motion.div
                                key={teamId}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: tIdx * 0.1 }}
                                className="bg-surface-bg border border-surface-border rounded-[3rem] overflow-hidden"
                            >
                                <div className="p-8 bg-surface-bg/50 border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl flex items-center justify-center">
                                            <User className="w-7 h-7 text-white dark:text-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-foreground uppercase italic">{group.team?.name || "Unknown Team"}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Group {group.team?.group}</span>
                                                <div className="w-1 h-1 bg-surface-border rounded-full" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">{group.answers.length} Items</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="px-4 py-2 bg-surface-bg/50 rounded-xl text-xs font-bold text-muted border border-surface-border">
                                            {view === "pending" ? "Awaiting Grade" : "Graded"}
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-surface-border">
                                    {group.answers.map((answer, aIdx) => (
                                        <div key={answer.id} className="p-8 grid grid-cols-12 gap-8 items-center hover:bg-surface-bg/20 transition-all">
                                            <div className="col-span-12 lg:col-span-7 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-muted/40 bg-surface-bg px-2 py-1 rounded border border-surface-border">#{aIdx + 1}</span>
                                                    <BookOpen className="w-4 h-4 text-muted/40" />
                                                    <p className="text-lg font-medium text-foreground/60 italic leading-relaxed">
                                                        {answer.question?.text}
                                                    </p>
                                                    {view === "history" && (
                                                        <span className={cn("text-xs font-bold px-2 py-1 rounded border", answer.isCorrect ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-500" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500")}>
                                                            {answer.isCorrect ? "CORRECT" : "INCORRECT"}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="bg-surface-bg border border-surface-border rounded-2xl p-4 md:p-6 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MessageCircle className="w-3 h-3 text-muted/40 shrink-0" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted/40 whitespace-nowrap">Student Answer</span>
                                                        </div>
                                                        <p className="text-xl md:text-3xl font-black text-accent-blue tracking-tight leading-tight break-words whitespace-pre-wrap">
                                                            {answer.answer}
                                                        </p>
                                                    </div>

                                                    {answer.question?.correctAnswer && (
                                                        <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/10 dark:border-green-500/20 rounded-2xl p-4 md:p-6 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <ShieldCheck className="w-3 h-3 text-green-600/30 dark:text-green-500/30 shrink-0" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-600/30 dark:text-green-500/30 whitespace-nowrap">Reference Key</span>
                                                            </div>
                                                            <p className="text-xl md:text-3xl font-black text-green-600 dark:text-green-400 tracking-tight leading-tight italic opacity-70 break-words whitespace-pre-wrap">
                                                                {answer.question.correctAnswer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-12 lg:col-span-5 flex flex-row items-stretch justify-end gap-3 md:gap-4 h-full">
                                                <button
                                                    onClick={() => gradeAnswer(answer.id, false)}
                                                    className="flex-1 lg:flex-none h-14 md:h-20 px-4 md:px-10 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-500 hover:text-white rounded-2xl md:rounded-3xl border border-red-500/20 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 shadow-lg shadow-red-500/5 shrink-0"
                                                >
                                                    <X className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block">Reject</span>
                                                </button>

                                                <button
                                                    onClick={() => gradeAnswer(answer.id, true)}
                                                    className="flex-1 lg:flex-none h-14 md:h-20 px-4 md:px-10 bg-green-500/10 hover:bg-green-500 text-green-600 dark:text-green-500 hover:text-white rounded-2xl md:rounded-3xl border border-green-500/20 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 shadow-lg shadow-green-500/5 shrink-0"
                                                >
                                                    <Check className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block">Approve</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {teamIds.length === 0 && (
                    <div className="py-60 text-center bg-surface-bg border-4 border-dashed border-surface-border rounded-[4rem]">
                        <ShieldCheck className="w-24 h-24 text-green-500/10 mx-auto mb-8" />
                        <p className="text-4xl font-black text-muted/20 italic uppercase tracking-wider">{view === "pending" ? "Queue Clear" : "No History"}</p>
                        <p className="text-muted/10 mt-2 font-medium">{view === "pending" ? "All manual grading points have been processed" : "No graded answers found"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
