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
        <div className="min-h-screen bg-[#0a0e1a] text-white p-4 md:p-8 overflow-y-auto">
            {/* Background decorative elements */}
            <BackgroundDecoration />

            <div className="relative z-10 max-w-[1920px] mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 flex items-center justify-center gap-6 drop-shadow-2xl">
                        <Trophy className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 fill-yellow-400/20" />
                        <span className="italic tracking-tighter">LIVE STANDINGS</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map((group) => {
                        const groupTeams = groupedTeams[group] || [];

                        return (
                            <div key={group} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-2xl">
                                <div className="text-center mb-8">
                                    <div className="inline-block px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                                        <h2 className="text-xl md:text-2xl font-black text-blue-400 uppercase tracking-[0.2em]">Group {group}</h2>
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
                                                    "relative flex items-center gap-3 p-3 md:p-4 rounded-2xl border transition-all duration-500 overflow-hidden",
                                                    team.status === "eliminated"
                                                        ? "bg-red-950/20 border-red-500/10"
                                                        : index === 0
                                                            ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                                            : index === 1
                                                                ? "bg-white/10 border-white/20"
                                                                : index === 2
                                                                    ? "bg-white/5 border-white/10"
                                                                    : "bg-black/20 border-white/5"
                                                )}
                                            >
                                                {/* Eliminated Overlay */}
                                                {team.status === "eliminated" && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-[1px]">
                                                        <span className="text-red-500 font-black italic tracking-[0.3em] text-sm md:text-lg uppercase drop-shadow-md border-y-2 border-red-500/50 py-1 bg-black/40 w-full text-center">
                                                            ELIMINATED
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Rank - Allow shrinking slightly on very small screens, but mostly fixed */}
                                                <div className={cn(
                                                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-lg shrink-0 shadow-lg relative z-10 transition-opacity",
                                                    team.status === "eliminated" ? "opacity-20" : "opacity-100",
                                                    index === 0 ? "bg-yellow-400 text-black shadow-yellow-400/20" :
                                                        index === 1 ? "bg-slate-300 text-slate-900" :
                                                            index === 2 ? "bg-orange-700 text-orange-100" : "bg-white/5 text-white/40 border border-white/5"
                                                )}>
                                                    {index + 1}
                                                </div>

                                                {/* Name - Flex grow and truncate to fill available space */}
                                                <div className="flex flex-col min-w-0 flex-1 relative z-10 transition-opacity" style={{ opacity: team.status === "eliminated" ? 0.3 : 1 }}>
                                                    <span className={cn(
                                                        "font-bold break-words text-sm md:text-lg tracking-tight leading-tight",
                                                        index === 0 ? "text-white" : "text-white/90"
                                                    )}>
                                                        {team.name}
                                                    </span>
                                                </div>

                                                {/* Score - Fixed width approx or shrink-0 to never wrap */}
                                                <div className="shrink-0 text-right relative z-10 transition-opacity" style={{ opacity: team.status === "eliminated" ? 0.3 : 1 }}>
                                                    <span className={cn(
                                                        "font-black font-mono text-lg md:text-2xl block leading-none",
                                                        index === 0 ? "text-yellow-400" : "text-white"
                                                    )}>
                                                        {team.score || 0}
                                                    </span>
                                                </div>

                                                {/* Crown for #1 */}
                                                {index === 0 && team.status !== "eliminated" && (
                                                    <div className="absolute -top-3 -right-2 transform rotate-12 z-20 pointer-events-none">
                                                        <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
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
