"use client";

import { Flag, X, Clock, AlertCircle } from "lucide-react";
import { Challenge } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { AdminBadge, AdminEmptyState, AdminPanel } from "./AdminPrimitives";

interface ChallengeAlertsProps {
    challenges: Challenge[];
    onDismiss: (challengeId: string) => void;
}

export function ChallengeAlerts({ challenges, onDismiss }: ChallengeAlertsProps) {
    const pendingChallenges = challenges.filter((c) => !c.dismissed);

    return (
        <AdminPanel
            title="Challenge Alerts"
            description="Pending challenge notifications requiring manual review."
            icon={Flag}
            actions={pendingChallenges.length > 0 ? <AdminBadge tone="warning">{pendingChallenges.length}</AdminBadge> : null}
        >
            {pendingChallenges.length === 0 ? (
                <AdminEmptyState
                    icon={AlertCircle}
                    title="No Pending Challenges"
                    description="Challenge alerts are currently clear."
                    className="px-6 py-10"
                />
            ) : (
                <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto pr-1">
                    <AnimatePresence>
                        {pendingChallenges.map((challenge, idx) => (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                transition={{ delay: idx * 0.05 }}
                                className="rounded-[1.5rem] border border-amber-300/18 bg-amber-300/10 p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-amber-100">{challenge.teamName}</span>
                                            <span className="flex items-center gap-1 text-xs text-admin-muted">
                                                <Clock className="h-3 w-3" />
                                                {new Date(challenge.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="rounded-xl border border-white/8 bg-white/[0.04] p-3 text-sm italic text-white/78">
                                            &quot;{challenge.questionText}&quot;
                                        </p>
                                        <p className="mt-2 text-xs text-admin-muted">
                                            Round: <span className="text-white/55">{challenge.roundId}</span>
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={() => onDismiss(challenge.id)}
                                        className="shrink-0 rounded-full border border-amber-200/20 bg-amber-200/10 p-2 text-amber-100 transition-colors"
                                        title="Dismiss"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="h-4 w-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </AdminPanel>
    );
}
