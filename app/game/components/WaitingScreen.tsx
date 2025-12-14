"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, GROUPS } from "@/lib/types";

interface WaitingScreenProps {
    team: Team | null;
    allTeams: Team[];
}

export function WaitingScreen({ team, allTeams }: WaitingScreenProps) {
    return (
        <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-6"
        >
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-blue-100">Waiting for round to start...</h2>
                <p className="text-slate-400 text-sm mt-1">Keep your eyes on the screen!</p>
            </div>

            {/* Division Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {GROUPS.map(g => {
                    const groupTeams = allTeams
                        .filter(t => t.group === g)
                        .sort((a, b) => b.score - a.score);

                    return (
                        <div key={g} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <h3 className="text-center text-xs uppercase font-bold text-blue-400 mb-2">
                                Group {g}
                            </h3>
                            <div className="space-y-1">
                                {groupTeams.map((t, idx) => (
                                    <div
                                        key={t.id}
                                        className={cn(
                                            "flex justify-between items-center text-xs py-1 px-2 rounded",
                                            t.id === team?.id ? "bg-blue-500/20 text-blue-300" :
                                                t.status === "eliminated" ? "text-red-400/50 line-through" :
                                                    "text-white/70"
                                        )}
                                    >
                                        <span className="flex items-center gap-1 truncate max-w-[80px]">
                                            {idx === 0 && t.status === "active" && <span className="text-yellow-400">👑</span>}
                                            {t.name}
                                        </span>
                                        <span className="font-bold">{t.score}</span>
                                    </div>
                                ))}
                                {groupTeams.length === 0 && (
                                    <p className="text-white/30 text-[10px] text-center">No teams</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
