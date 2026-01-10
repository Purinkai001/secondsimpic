import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Loader2, Sparkles } from "lucide-react";
import { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LobbyViewProps {
    allTeams: Team[];
    team: Team | null;
}

export const LobbyView = ({ allTeams, team }: LobbyViewProps) => {
    // Group and sort teams by division
    const divisions = [1, 2, 3, 4, 5].map(divNum => {
        const teams = allTeams
            .filter(t => t.group === divNum)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        return { divNum, teams };
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-[1600px] mx-auto px-4 space-y-8"
        >
            {/* Minimal Sync Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-blue-400" />
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Clinical Standings</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/50 mt-1">Live Division Ranking Engine</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 h-4 bg-blue-500/20 rounded-full"
                                animate={{ height: [8, 16, 8], opacity: [0.2, 0.6, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-white/20 text-[8px] font-black uppercase tracking-[0.4em]">
                        <Activity className="w-3 h-3" />
                        Feed Active
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                        <span className="text-[10px] font-black text-blue-400 uppercase italic">Syncing...</span>
                    </div>
                </div>
            </div>

            {/* 6x5 Full Width Leaderboard Grid */}
            <div className="grid grid-cols-5 gap-6">
                {divisions.map(({ divNum, teams }) => (
                    <div key={divNum} className="space-y-4">
                        <div className="py-3 px-6 bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 rounded-r-xl">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-white italic">Division {divNum}</span>
                        </div>

                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, idx) => {
                                const t = teams[idx];
                                return (
                                    <motion.div
                                        key={t?.id || `empty-${divNum}-${idx}`}
                                        layout
                                        className={cn(
                                            "h-24 p-5 rounded-[2rem] border transition-all relative overflow-hidden flex flex-col justify-center",
                                            t?.id === team?.id
                                                ? "bg-blue-600/30 border-blue-500/50 ring-2 ring-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                                                : "bg-white/[0.03] border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        {t ? (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] italic shadow-sm",
                                                            idx === 0 ? "bg-yellow-500 text-black" : "bg-white/10 text-white/40"
                                                        )}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm font-black uppercase italic truncate tracking-tight",
                                                            t.id === team?.id ? "text-white" : "text-white/70"
                                                        )}>
                                                            {t.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xl font-black text-white italic tracking-tighter">{t.score}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={cn(
                                                        "h-1.5 rounded-full flex-1 bg-white/5 overflow-hidden",
                                                        t.status === 'eliminated' && "opacity-30"
                                                    )}>
                                                        <motion.div
                                                            className={cn(
                                                                "h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                                                                t.status === 'active' ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-red-500"
                                                            )}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (t.score / 10000) * 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                                {t.id === team?.id && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 rounded-bl-2xl shadow-lg border-l border-b border-blue-400/50">
                                                        <span className="text-[10px] font-black text-white uppercase italic tracking-widest">YOU</span>
                                                    </div>
                                                )}
                                                {t.status === 'eliminated' && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] italic">Eliminated</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-full opacity-10">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const Activity = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
