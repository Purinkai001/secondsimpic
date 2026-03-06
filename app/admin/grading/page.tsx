"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/admin/hooks/useAdminDashboard";
import { api } from "@/lib/api";
import { ShieldCheck, User, BookOpen, Check, X, Users, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Team, Question, Answer } from "@/lib/types";
import { AdminBadge, AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminPrimitives";

type AnswerWithQuestion = Answer & { question?: Question };
type TeamAnswerGroup = {
    team?: Team;
    answers: AnswerWithQuestion[];
};

export default function GradingPage() {
    const [view, setView] = useState<"pending" | "history">("pending");
    const { pendingAnswers, teams, questions, allAnswers } = useAdminDashboard();

    const displayedAnswers = view === "pending"
        ? pendingAnswers
        : allAnswers.filter((a) => a.isCorrect !== null && a.answer !== undefined);

    const teamGroups = displayedAnswers.reduce((acc: Record<string, TeamAnswerGroup>, answer) => {
        const teamId = answer.teamId;
        if (!acc[teamId]) {
            acc[teamId] = {
                team: teams.find((t) => t.id === teamId),
                answers: [],
            };
        }
        acc[teamId].answers.push({
            ...answer,
            question: questions.find((q) => q.id === answer.questionId),
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
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Assessment Desk"
                title={view === "pending" ? "Grading Queue" : "Grading History"}
                description="Manual assessment hub for subjective answers, reference keys, and decision history."
                status={
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-full border border-white/10 bg-white/[0.05] p-1">
                            <button
                                onClick={() => setView("pending")}
                                className={cn(
                                    "rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.22em] transition-all",
                                    view === "pending" ? "bg-gold text-[#03112b]" : "text-admin-muted hover:text-white"
                                )}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setView("history")}
                                className={cn(
                                    "rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.22em] transition-all",
                                    view === "history" ? "bg-admin-cyan text-[#03112b]" : "text-admin-muted hover:text-white"
                                )}
                            >
                                History
                            </button>
                        </div>
                        <AdminBadge tone="warning">
                            <Users className="h-3 w-3" />
                            {teamIds.length} Teams
                        </AdminBadge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-10">
                <AnimatePresence mode="popLayout">
                    {teamIds.map((teamId, tIdx) => {
                        const group = teamGroups[teamId];
                        return (
                            <motion.div
                                key={teamId}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: tIdx * 0.08 }}
                                className="admin-panel overflow-hidden rounded-[2.75rem]"
                            >
                                <div className="border-b border-white/8 bg-white/[0.04] p-6 md:p-8">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-gold/15 bg-gold/10 text-gold">
                                                <User className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-atsanee text-4xl font-black uppercase italic text-gold">
                                                    {group.team?.name || "Unknown Team"}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <AdminBadge className="px-3 py-1">Group {group.team?.group}</AdminBadge>
                                                    <AdminBadge tone="warning" className="px-3 py-1">{group.answers.length} Items</AdminBadge>
                                                </div>
                                            </div>
                                        </div>
                                        <AdminBadge tone={view === "pending" ? "warning" : "accent"}>
                                            {view === "pending" ? "Awaiting Grade" : "Graded"}
                                        </AdminBadge>
                                    </div>
                                </div>

                                <div className="divide-y divide-white/8">
                                    {group.answers.map((answer, aIdx) => (
                                        <div key={answer.id} className="grid grid-cols-12 gap-6 p-6 md:p-8">
                                            <div className="col-span-12 lg:col-span-8 space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted">
                                                        #{aIdx + 1}
                                                    </span>
                                                    <BookOpen className="h-4 w-4 text-gold/65" />
                                                    <p className="text-base font-medium italic leading-relaxed text-white/72 md:text-lg">
                                                        {answer.question?.text}
                                                    </p>
                                                    {view === "history" && (
                                                        <AdminBadge tone={answer.isCorrect ? "success" : "danger"} className="px-3 py-1">
                                                            {answer.isCorrect ? "Correct" : "Incorrect"}
                                                        </AdminBadge>
                                                    )}
                                                </div>

                                                <div className="grid gap-4 xl:grid-cols-2">
                                                    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <MessageCircle className="h-3 w-3 text-admin-cyan" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                                                Student Answer
                                                            </span>
                                                        </div>
                                                        <p className="text-2xl font-black leading-tight text-admin-cyan md:text-3xl">
                                                            {answer.answer}
                                                        </p>
                                                    </div>

                                                    {answer.question?.correctAnswer && (
                                                        <div className="rounded-[1.75rem] border border-emerald-300/15 bg-emerald-300/8 p-5">
                                                            <div className="mb-3 flex items-center gap-2">
                                                                <ShieldCheck className="h-3 w-3 text-emerald-300" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/75">
                                                                    Reference Key
                                                                </span>
                                                            </div>
                                                            <p className="text-2xl font-black italic leading-tight text-emerald-200/85 md:text-3xl">
                                                                {answer.question.correctAnswer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-12 flex items-stretch justify-end gap-3 lg:col-span-4">
                                                <button
                                                    onClick={() => gradeAnswer(answer.id, false)}
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-[1.75rem] border border-rose-300/20 bg-rose-300/10 px-4 py-5 text-rose-100 transition-all hover:bg-rose-300/18 lg:flex-col"
                                                >
                                                    <X className="h-7 w-7" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Reject</span>
                                                </button>
                                                <button
                                                    onClick={() => gradeAnswer(answer.id, true)}
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-5 text-emerald-100 transition-all hover:bg-emerald-300/18 lg:flex-col"
                                                >
                                                    <Check className="h-7 w-7" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Approve</span>
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
                    <AdminEmptyState
                        icon={ShieldCheck}
                        title={view === "pending" ? "Queue Clear" : "No History"}
                        description={view === "pending" ? "All manual grading items have been processed." : "No graded answers are available yet."}
                    />
                )}
            </div>
        </div>
    );
}
