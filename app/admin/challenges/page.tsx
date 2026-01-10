"use client";

import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { api } from "@/lib/api";
import { Flag, X, Clock, MessageSquare, User, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ChallengesPage() {
    const { challenges } = useAdminDashboard();
    const pendingChallenges = challenges.filter(c => !c.dismissed);

    const handleDismiss = async (challengeId: string) => {
        try {
            await api.dismissChallenge(challengeId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-white via-white to-pink-500 bg-clip-text text-transparent italic tracking-tight uppercase">
                        CHALLENGE QUEUE
                    </h1>
                    <p className="text-white/40 mt-2 text-lg font-medium">Contestant dispute and verification hub</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="px-6 py-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center gap-4">
                        <Flag className="w-5 h-5 text-pink-500" />
                        <div>
                            <p className="text-2xl font-black leading-none">{pendingChallenges.length}</p>
                            <p className="text-[10px] font-black uppercase text-pink-500/50 mt-1">Pending Alerts</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AnimatePresence mode="popLayout">
                    {pendingChallenges.map((challenge, idx) => (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/[0.03] border border-white/5 rounded-[3rem] overflow-hidden group hover:border-pink-500/20 transition-all"
                        >
                            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white uppercase italic">{challenge.teamName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{challenge.roundId}</span>
                                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(challenge.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDismiss(challenge.id)}
                                    className="px-8 py-4 bg-white/5 hover:bg-pink-500 text-white rounded-2xl border border-white/10 hover:border-pink-500 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                                >
                                    Dismiss Alert
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white/20">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Contested Question</span>
                                    </div>
                                    <p className="text-2xl font-medium text-white/80 italic leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5">
                                        "{challenge.questionText}"
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                        Question ID: <span className="text-white/40">{challenge.questionId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-pink-500/40">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Manual Verification Required</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {pendingChallenges.length === 0 && (
                    <div className="py-60 text-center bg-white/[0.02] border-4 border-dashed border-white/[0.03] rounded-[4rem]">
                        <Flag className="w-24 h-24 text-pink-500/10 mx-auto mb-8" />
                        <p className="text-4xl font-black text-white/20 italic uppercase tracking-wider">No Active Challenges</p>
                        <p className="text-white/10 mt-2 font-medium">Clear diagnostics. All teams are synchronized.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
