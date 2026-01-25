"use client";

import { useStandingsSync } from "@/lib/hooks/useStandingsSync";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { BackgroundDecoration } from "@/components/ui/BackgroundDecoration";

export default function ScoreboardPage() {
    const { allTeams } = useStandingsSync();

    const groupedTeams = useMemo(() => {
        // Initialize groups
        const groups: Record<number, typeof allTeams> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        // Distribute teams
        allTeams.forEach(t => {
            const g = t.group || 1; // Default to 1 if undefined, though it should be defined
            if (!groups[g]) groups[g] = [];
            groups[g].push(t);
        });

        // Sort each group
        Object.keys(groups).forEach(key => {
            const k = Number(key);
            groups[k].sort((a, b) => (b.score || 0) - (a.score || 0));
        });

        return groups;
    }, [allTeams]);

    // Auto-scroll logic could go here, but for now let's just ensure it fits or scrolls naturally

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 overflow-y-auto transition-colors duration-300">
            {/* Background decorative elements */}
            <BackgroundDecoration />

            <div className="relative z-10 max-w-[1920px] mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-black text-foreground flex items-center justify-center gap-6 drop-shadow-2xl">
                        <Trophy className="w-16 h-16 md:w-24 md:h-24 text-yellow-500 fill-yellow-500/20" />
                        <span className="italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 dark:from-yellow-300 dark:via-orange-400 dark:to-yellow-300">LIVE STANDINGS</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map((group) => {
                        const groupTeams = groupedTeams[group] || [];

                        return (
                            <div key={group} className="bg-surface-bg border border-surface-border rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-2xl transition-colors duration-300">
                                <div className="text-center mb-8">
                                    <div className="inline-block px-6 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20">
                                        <h2 className="text-xl md:text-2xl font-black text-accent-blue uppercase tracking-[0.2em]">Group {group}</h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {groupTeams.map((team, index) => (
                                            <motion.div
                                                key={team.id}
                                                layoutId={`team-${team.id}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className={cn(
                                                    "relative flex items-center gap-3 p-3 md:p-4 rounded-2xl border transition-all duration-500 overflow-x-auto",
                                                    team.status === "eliminated"
                                                        ? "bg-red-500/5 dark:bg-red-950/20 border-red-500/10"
                                                        : index === 0
                                                            ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.05)]"
                                                            : index === 1
                                                                ? "bg-surface-bg border-surface-border"
                                                                : index === 2
                                                                    ? "bg-surface-bg border-surface-border/80"
                                                                    : "bg-surface-bg border-surface-border/50"
                                                )}
                                            >
                                                {/* Eliminated Overlay */}
                                                {team.status === "eliminated" && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/60 dark:bg-black/60 backdrop-blur-[1px]">
                                                        <span className="text-red-600 dark:text-red-500 font-black italic tracking-[0.3em] text-sm md:text-lg uppercase drop-shadow-md border-y-2 border-red-500/50 py-1 bg-surface-bg/80 dark:bg-black/40 w-full text-center">
                                                            ELIMINATED
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Rank Symbol */}
                                                <div className={cn(
                                                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-lg shrink-0 shadow-lg relative z-10 transition-all",
                                                    team.status === "eliminated" ? "opacity-20" : "opacity-100",
                                                    index === 0 ? "bg-yellow-500 text-white dark:bg-yellow-400 dark:text-black shadow-yellow-500/20" :
                                                        index === 1 ? "bg-slate-400 text-white dark:bg-slate-300 dark:text-slate-900 shadow-slate-400/10" :
                                                            index === 2 ? "bg-orange-700 text-orange-100 shadow-orange-700/10" : "bg-surface-bg border border-surface-border text-muted"
                                                )}>
                                                    {index + 1}
                                                </div>

                                                {/* Name Container */}
                                                <div className="flex flex-col min-w-0 flex-1 relative z-10 transition-opacity" style={{ opacity: team.status === "eliminated" ? 0.3 : 1 }}>
                                                    <span className={cn(
                                                        "font-bold overflow-x-auto whitespace-nowrap text-sm md:text-lg tracking-tight leading-tight text-foreground",
                                                        index === 0 ? "font-black" : "font-bold"
                                                    )}>
                                                        {team.name}
                                                    </span>
                                                </div>

                                                {/* Score Display */}
                                                <div className="shrink-0 text-right relative z-10 transition-opacity" style={{ opacity: team.status === "eliminated" ? 0.3 : 1 }}>
                                                    <span className={cn(
                                                        "font-black font-mono text-lg md:text-2xl block leading-none",
                                                        index === 0 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
                                                    )}>
                                                        {team.score || 0}
                                                    </span>
                                                </div>

                                                {/* Crown Icon for Leader */}
                                                {index === 0 && team.status !== "eliminated" && (
                                                    <div className="absolute -top-3 -right-2 transform rotate-12 z-20 pointer-events-none">
                                                        <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 dark:text-yellow-400 fill-yellow-600/20 dark:fill-yellow-400 animate-bounce" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
