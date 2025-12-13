"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; group: number; score: number; status: "active" | "eliminated" };

const GROUPS = [1, 2, 3, 4, 5];

export default function ScoreboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const q = query(collection(db, "teams"), orderBy("score", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTeams(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Team)));
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 overflow-hidden">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-gradient-x flex items-center justify-center gap-4">
                    <Trophy className="w-12 h-12 md:w-20 md:h-20 text-yellow-500" />
                    Live Leaderboard
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
                {GROUPS.map((group) => {
                    const groupTeams = teams
                        .filter((t) => t.group === group)
                        .sort((a, b) => b.score - a.score);

                    return (
                        <div key={group} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col h-full">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 py-2 rounded-lg">Group {group}</h2>
                            </div>

                            <div className="space-y-3 flex-1">
                                <AnimatePresence>
                                    {groupTeams.map((team, index) => (
                                        <motion.div
                                            key={team.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className={cn(
                                                "relative flex items-center justify-between p-4 rounded-xl border border-white/5 shadow-lg",
                                                team.status === "eliminated"
                                                    ? "bg-red-900/20 border-red-500/30 opacity-60 grayscale"
                                                    : index === 0
                                                        ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                                                        : index === 1
                                                            ? "bg-white/10 border-white/20"
                                                            : index === 2
                                                                ? "bg-orange-900/20 border-orange-500/20"
                                                                : "bg-black/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                                    index === 0 ? "bg-yellow-500 text-black" :
                                                        index === 1 ? "bg-gray-300 text-black" :
                                                            index === 2 ? "bg-orange-700 text-white" : "bg-slate-700 text-slate-400"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <span className={cn(
                                                    "font-bold truncate text-sm md:text-base",
                                                    team.status === "eliminated" && "line-through decoration-red-500"
                                                )}>
                                                    {team.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "font-mono font-bold text-xl",
                                                index === 0 ? "text-yellow-400" : "text-white"
                                            )}>
                                                {team.score}
                                            </span>

                                            {index === 0 && team.status !== "eliminated" && (
                                                <Crown className="absolute -top-3 -right-2 w-6 h-6 text-yellow-500 rotate-12 drop-shadow-lg" />
                                            )}
                                            {team.status === "eliminated" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-red-500 font-black uppercase tracking-widest text-xs rotate-12 border-2 border-red-500 rounded-xl">
                                                    Eliminated
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {groupTeams.length === 0 && (
                                    <div className="text-center text-white/20 italic mt-10">No Teams</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
