"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Zap, Skull } from "lucide-react";
import { Team } from "@/lib/types";

interface SuddenDeathAlertProps {
    team: Team;
    tiedTeams?: Team[];
}

export function SuddenDeathAlert({ team, tiedTeams = [] }: SuddenDeathAlertProps) {
    // Only show teams in same division with same score
    const otherTiedTeams = tiedTeams.filter(t => t.id !== team.id && t.group === team.group && t.score === team.score);
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/95">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-[50vh] bg-gradient-to-t from-transparent via-red-500/20 to-transparent origin-bottom"
                        style={{ rotate: `${i * 30}deg` }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
            </div>

            <motion.div
                className="relative z-10 text-center max-w-2xl mx-4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 1, bounce: 0.4 }}
            >
                <motion.div
                    className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            "0 0 40px rgba(239, 68, 68, 0.5)",
                            "0 0 80px rgba(239, 68, 68, 0.8)",
                            "0 0 40px rgba(239, 68, 68, 0.5)",
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Skull className="w-16 h-16 text-white drop-shadow-lg" />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-xl font-black uppercase tracking-[0.3em] bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                        SUDDEN DEATH
                    </span>
                </motion.div>

                <motion.h1
                    className="text-4xl md:text-6xl font-black text-white mt-4 mb-2 tracking-tight"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    TIE BREAKER REQUIRED
                </motion.h1>

                <motion.div
                    className="mt-6 px-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <span className="text-white/60 text-base md:text-lg">Your Team</span>
                    <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent break-words">
                        {team.name}
                    </h2>
                </motion.div>

                <motion.div
                    className="mt-8 bg-red-500/20 backdrop-blur-lg rounded-2xl px-8 py-4 inline-block border border-red-500/30"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <span className="text-white/60 text-sm uppercase tracking-wider">Tied Score</span>
                    <p className="text-5xl font-black text-white">{team.score}</p>
                </motion.div>

                {otherTiedTeams.length > 0 && (
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                    >
                        <p className="text-white/40 text-sm uppercase tracking-widest mb-3">Tied With</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {otherTiedTeams.map(t => (
                                <div key={t.id} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold">
                                    {t.name}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <motion.p
                    className="text-white/40 mt-8 text-sm italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                >
                    Please wait for further instructions from the proctor.
                </motion.p>

                <motion.div
                    className="flex items-center justify-center gap-2 mt-6 text-red-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">Standby</span>
                    <AlertTriangle className="w-5 h-5" />
                </motion.div>
            </motion.div>

            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        </div>
    );
}
