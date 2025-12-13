"use client";

import { Flag, X, Clock, AlertCircle } from "lucide-react";
import { Challenge } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface ChallengeAlertsProps {
    challenges: Challenge[];
    onDismiss: (challengeId: string) => void;
}

export function ChallengeAlerts({ challenges, onDismiss }: ChallengeAlertsProps) {
    const pendingChallenges = challenges.filter(c => !c.dismissed);

    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Flag className="w-4 h-4 text-amber-400" />
                </div>
                Challenge Alerts
                {pendingChallenges.length > 0 && (
                    <motion.span
                        className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        {pendingChallenges.length}
                    </motion.span>
                )}
            </h2>

            {pendingChallenges.length === 0 ? (
                <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-white/30 text-sm">No pending challenges</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    <AnimatePresence>
                        {pendingChallenges.map((challenge, idx) => (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex justify-between items-start gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="font-bold text-amber-300">{challenge.teamName}</span>
                                        <span className="text-xs text-white/30 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(challenge.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/60 line-clamp-2 bg-black/20 p-2 rounded-lg">
                                        "{challenge.questionText}"
                                    </p>
                                    <p className="text-xs text-white/30 mt-2">
                                        Round: <span className="text-white/50">{challenge.roundId}</span>
                                    </p>
                                </div>
                                <motion.button
                                    onClick={() => onDismiss(challenge.id)}
                                    className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors shrink-0"
                                    title="Dismiss"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
