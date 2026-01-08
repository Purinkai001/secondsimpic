import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Loader2, Sparkles } from "lucide-react";
import { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LobbyViewProps {
    allTeams: Team[];
    team: Team | null;
}

export const LobbyView = ({ allTeams, team }: LobbyViewProps) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto w-full px-4"
    >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Leaderboard - Now more prominent but cleaner */}
            <div className="lg:col-span-12 xl:col-span-8 order-2 lg:order-1">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white italic tracking-tight uppercase flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Live Leaderboard
                        </h2>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-11">Current Standings</p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-4 lg:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="w-32 h-32" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        <AnimatePresence mode="popLayout">
                            {allTeams.map((t, idx) => (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "flex items-center justify-between p-5 rounded-2xl border transition-all duration-500",
                                        t.id === team?.id
                                            ? "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg",
                                            idx === 0 ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black" :
                                                idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" :
                                                    idx === 2 ? "bg-gradient-to-br from-amber-600 to-amber-900 text-white" : "bg-white/5 text-white/20"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <span className={cn("font-black italic uppercase tracking-tight text-lg leading-none flex items-center gap-2", t.id === team?.id ? "text-white" : "text-white/70")}>
                                                {t.name}
                                                {idx === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                                                {t.id === team?.id && <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase italic font-black shadow-lg">You</span>}
                                            </span>
                                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Group {t.group}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block font-black italic text-2xl text-white tracking-tighter">{t.score}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Right/Top: Sync Status - Now a cleaner, focused element */}
            <div className="lg:col-span-12 xl:col-span-4 order-1 lg:order-2">
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-2xl backdrop-blur-2xl">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                            <Loader2 className="w-full h-full text-blue-500 animate-spin relative z-10 stroke-[1.5px]" />
                        </div>
                        <h4 className="text-2xl font-black text-white italic uppercase tracking-tight mb-3">Syncing System</h4>
                        <p className="text-blue-300/40 text-sm font-medium leading-relaxed mb-8">
                            Standing by for the next clinical challenge. Ensure your terminal is ready.
                        </p>

                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-6 bg-blue-500/30 rounded-full"
                                    animate={{
                                        height: [16, 32, 16],
                                        opacity: [0.3, 1, 0.3],
                                        backgroundColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 1)", "rgba(59, 130, 246, 0.3)"]
                                    }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                                />
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                                <Activity className="w-3 h-3" />
                                Live Uplink Active
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

const Activity = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
