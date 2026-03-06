"use client";

import { useAdminDashboard } from "@/lib/admin/hooks/useAdminDashboard";
import { History, Search, Filter, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBadge, AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminPrimitives";

export default function HistoryPage() {
    const { allAnswers, teams, questions } = useAdminDashboard();
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAnswers = useMemo(() => {
        return allAnswers
            .filter((a) => selectedTeamId === "all" || a.teamId === selectedTeamId)
            .filter((a) => {
                const team = teams.find((t) => t.id === a.teamId);
                const question = questions.find((q) => q.id === a.questionId);
                const searchStr = `${team?.name} ${question?.text} ${a.answer}`.toLowerCase();
                return searchStr.includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => b.submittedAt - a.submittedAt);
    }, [allAnswers, selectedTeamId, searchQuery, teams, questions]);

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Archive Feed"
                title="Answer Log"
                description="Searchable answer history across teams, prompts, submission timing, and scoring outcomes."
                status={<AdminBadge>{filteredAnswers.length} Visible Entries</AdminBadge>}
                actions={
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative min-w-[260px]">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search logs..."
                                className="admin-input w-full rounded-full py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-admin-muted/65"
                            />
                        </div>
                        <div className="relative min-w-[220px]">
                            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="admin-input w-full appearance-none rounded-full py-3 pl-11 pr-4 text-sm font-semibold"
                            >
                                <option value="all" className="bg-background text-foreground">All Teams</option>
                                {teams.sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
                                    <option key={t.id} value={t.id} className="bg-background text-foreground">{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredAnswers.map((answer, idx) => {
                        const team = teams.find((t) => t.id === answer.teamId);
                        const question = questions.find((q) => q.id === answer.questionId);

                        return (
                            <motion.div
                                key={answer.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.6) }}
                                className={cn(
                                    "admin-panel relative overflow-hidden rounded-[2.5rem] p-6 md:p-8",
                                    answer.isCorrect === true ? "border-emerald-300/18" :
                                        answer.isCorrect === false ? "border-rose-300/18" : "border-amber-300/18"
                                )}
                            >
                                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-white/8 bg-white/[0.03]" />

                                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex h-16 w-16 items-center justify-center rounded-[1.4rem] border text-2xl font-black",
                                            answer.isCorrect === true ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" :
                                                answer.isCorrect === false ? "border-rose-300/20 bg-rose-300/10 text-rose-100" :
                                                    "border-amber-300/20 bg-amber-300/10 text-amber-100"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-atsanee text-4xl font-black uppercase italic text-gold">
                                                {team?.name || "Unknown Team"}
                                            </p>
                                            <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-admin-muted">
                                                {new Date(answer.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-gold/70" />
                                            <p className="text-lg font-medium italic leading-relaxed text-white/78">
                                                {question?.text || "Question data missing..."}
                                            </p>
                                        </div>

                                        <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
                                            <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                                Team Submission
                                            </span>
                                            <p className="break-all text-3xl font-black tracking-tight text-white md:text-4xl">
                                                {Array.isArray(answer.answer) ? answer.answer.map((v) => v ? "T" : "F").join(", ") : answer.answer.toString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 xl:min-w-[180px] xl:text-right">
                                        <AdminBadge
                                            tone={answer.isCorrect === true ? "success" : answer.isCorrect === false ? "danger" : "warning"}
                                            className="px-3 py-1"
                                        >
                                            {answer.isCorrect === true ? "Correct" : answer.isCorrect === false ? "Incorrect" : "Pending"}
                                        </AdminBadge>
                                        <p className="font-atsanee text-4xl font-black italic text-gold">
                                            {answer.points} <span className="text-xs font-black not-italic uppercase tracking-[0.22em] text-admin-muted">PTS</span>
                                        </p>
                                        <p className="text-xs font-black uppercase tracking-[0.24em] text-admin-muted">
                                            {answer.timeSpent.toFixed(1)}s taken
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredAnswers.length === 0 && (
                    <AdminEmptyState
                        icon={History}
                        title="No Logs Found"
                        description="There are no answers matching the current search and filter combination."
                    />
                )}
            </div>
        </div>
    );
}
