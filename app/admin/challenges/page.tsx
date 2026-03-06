"use client";

import { useAdminDashboard } from "@/lib/admin/hooks/useAdminDashboard";
import { api } from "@/lib/api";
import { Flag, Clock, MessageSquare, User, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBadge, AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminPrimitives";

export default function ChallengesPage() {
    const { challenges } = useAdminDashboard();
    const pendingChallenges = challenges.filter((c) => !c.dismissed);

    const handleDismiss = async (challengeId: string) => {
        try {
            await api.dismissChallenge(challengeId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Dismiss failed");
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Dispute Queue"
                title="Challenge Queue"
                description="Review contested prompts and dismiss processed alerts without altering the underlying workflow."
                status={<AdminBadge tone="warning"><Flag className="h-3 w-3" />{pendingChallenges.length} Pending Alerts</AdminBadge>}
            />

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {pendingChallenges.map((challenge, idx) => (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 80 }}
                            transition={{ delay: idx * 0.06 }}
                            className="admin-panel overflow-hidden rounded-[2.75rem]"
                        >
                            <div className="border-b border-white/8 bg-white/[0.04] p-6 md:p-8">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10 text-rose-100">
                                            <User className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-atsanee text-4xl font-black uppercase italic text-gold">
                                                {challenge.teamName}
                                            </h3>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <AdminBadge className="px-3 py-1">{challenge.roundId}</AdminBadge>
                                                <AdminBadge tone="warning" className="px-3 py-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(challenge.createdAt).toLocaleTimeString()}
                                                </AdminBadge>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(challenge.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-rose-300/20 bg-rose-300/10 px-6 py-3 font-atsanee text-xl font-black uppercase italic text-rose-100 transition-all hover:bg-rose-300/18"
                                    >
                                        Dismiss Alert
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 p-6 md:p-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-admin-muted">
                                        <BookOpen className="h-4 w-4 text-gold/70" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.24em]">Contested Question</span>
                                    </div>
                                    <p className="rounded-[2rem] border border-white/8 bg-white/[0.04] p-6 text-2xl font-medium italic leading-relaxed text-white/85">
                                        &quot;{challenge.questionText}&quot;
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-white/8 pt-5 md:flex-row md:items-center md:justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                        Question ID <span className="ml-2 text-white/55">{challenge.questionId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-rose-100/70">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.24em]">Manual Verification Required</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {pendingChallenges.length === 0 && (
                    <AdminEmptyState
                        icon={Flag}
                        title="No Active Challenges"
                        description="Challenge diagnostics are clear and all current disputes have been handled."
                    />
                )}
            </div>
        </div>
    );
}
