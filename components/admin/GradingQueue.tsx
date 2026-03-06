import { Gavel, Check, X, MessageSquare } from "lucide-react";
import { Answer, Team } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBadge, AdminEmptyState, AdminPanel } from "./AdminPrimitives";

interface GradingQueueProps {
    pendingAnswers: Answer[];
    teams: Team[];
    onGrade: (answer: Answer, correct: boolean) => void;
}

export function GradingQueue({ pendingAnswers, teams, onGrade }: GradingQueueProps) {
    return (
        <AdminPanel
            title="Grading Queue"
            description="Pending free-response items waiting for manual assessment."
            icon={Gavel}
            actions={pendingAnswers.length > 0 ? <AdminBadge tone="warning">{pendingAnswers.length}</AdminBadge> : null}
        >
            {pendingAnswers.length === 0 ? (
                <AdminEmptyState
                    icon={MessageSquare}
                    title="Queue Clear"
                    description="No pending essays or free-response items need grading."
                    className="px-6 py-10"
                />
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {pendingAnswers.map((a, idx) => {
                            const t = teams.find((team) => team.id === a.teamId);
                            return (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-admin-cyan/15 bg-white/[0.04] p-4 md:flex-row"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-admin-cyan">{t?.name || a.teamId}</span>
                                            <span className="text-xs text-admin-muted">Group {t?.group}</span>
                                        </div>
                                        <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-sm italic text-white/78">
                                            &quot;{a.answer}&quot;
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <motion.button
                                            onClick={() => onGrade(a, true)}
                                            className="rounded-full border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-100"
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                        >
                                            <Check className="h-5 w-5" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onGrade(a, false)}
                                            className="rounded-full border border-rose-300/20 bg-rose-300/10 p-3 text-rose-100"
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                        >
                                            <X className="h-5 w-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </AdminPanel>
    );
}
