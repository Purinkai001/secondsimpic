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
            <div className="flex items-center justify-between px-8 py-4 bg-surface-bg border border-surface-border rounded-3xl backdrop-blur-xl transition-colors duration-300">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-accent-blue" />
                        <div>
                            <h2 className="text-xl font-black text-foreground italic uppercase tracking-tighter leading-none">Standings</h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 h-4 bg-accent-blue/20 rounded-full"
                                animate={{ height: [8, 16, 8], opacity: [0.2, 0.6, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-muted/30 text-[8px] font-black uppercase tracking-[0.4em]">
                        <Activity className="w-3 h-3" />
                        Feed Active
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 rounded-xl border border-accent-blue/20">
                        <Loader2 className="w-3 h-3 text-accent-blue animate-spin" />
                        <span className="text-[10px] font-black text-accent-blue uppercase italic">Syncing...</span>
                    </div>
                </div>
            </div>

            {/* 6x5 Full Width Leaderboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
                {divisions.map(({ divNum, teams }) => (
                    <div key={divNum} className="space-y-4">
                        <div className="py-2 md:py-3 px-4 md:px-6 bg-gradient-to-r from-accent-blue/10 to-transparent border-l-4 border-accent-blue rounded-r-xl sticky top-20 z-10 backdrop-blur-md">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground italic">Division {divNum}</span>
                        </div>

                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, idx) => {
                                const t = teams[idx];
                                return (
                                    <motion.div
                                        key={t?.id || `empty-${divNum}-${idx}`}
                                        layout
                                        className={cn(
                                            "min-h-[5rem] md:min-h-[6rem] h-auto p-4 md:p-5 rounded-2xl md:rounded-[2rem] border transition-all relative overflow-x-auto flex flex-col justify-center",
                                            t?.inSuddenDeath
                                                ? "bg-red-600/20 border-red-500/50 ring-2 ring-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-pulse"
                                                : t?.id === team?.id
                                                    ? "bg-accent-blue/5 dark:bg-accent-blue/30 border-accent-blue/50 ring-2 ring-accent-blue/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                                                    : "bg-surface-bg border-surface-border hover:border-accent-blue/30"
                                        )}
                                    >
                                        {t ? (
                                            <>
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] italic shadow-sm shrink-0",
                                                            idx === 0 ? "bg-yellow-500 text-white dark:text-black" : "bg-surface-bg border border-surface-border text-muted"
                                                        )}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm font-black uppercase italic tracking-tight break-words leading-tight",
                                                            t.id === team?.id ? "text-accent-blue dark:text-accent-cyan" : "text-foreground/80 dark:text-foreground/70"
                                                        )}>
                                                            {t.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xl font-black text-foreground italic tracking-tighter shrink-0">{t.score}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={cn(
                                                        "h-1.5 rounded-full flex-1 bg-surface-bg/80 border border-surface-border overflow-hidden",
                                                        t.status === 'eliminated' && "opacity-30"
                                                    )}>
                                                        <motion.div
                                                            className={cn(
                                                                "h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                                                                t.status === 'active' ? "bg-gradient-to-r from-accent-blue to-accent-cyan" : "bg-red-500"
                                                            )}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (t.score / 10000) * 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                                {t.id === team?.id && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-accent-blue rounded-bl-2xl shadow-lg border-l border-b border-accent-blue/50">
                                                        <span className="text-[10px] font-black text-white uppercase italic tracking-widest">YOU</span>
                                                    </div>
                                                )}
                                                {t.status === 'eliminated' && (
                                                    <div className="absolute inset-0 bg-background/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.5em] italic">Eliminated</span>
                                                    </div>
                                                )}
                                                {t.inSuddenDeath && t.status !== 'eliminated' && (
                                                    <div className="absolute top-0 left-0 px-2 py-1 bg-red-500 rounded-br-xl shadow-lg">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">TIE</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-full opacity-10">
                                                <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
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
