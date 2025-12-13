import { Trophy, Trash2, Bot, Crown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, GROUPS } from "@/lib/types";
import { motion } from "framer-motion";

interface LiveStandingsProps {
    teams: Team[];
    activeTeamsCount: number;
    onKickPlayer?: (teamId: string, teamName: string) => void;
}

export function LiveStandings({ teams, activeTeamsCount, onKickPlayer }: LiveStandingsProps) {
    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                Live Standings
                <span className="text-sm font-normal text-white/50 ml-2">({activeTeamsCount} Active)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {GROUPS.map((g, gIdx) => {
                    const groupTeams = teams
                        .filter((t) => t.group === g)
                        .sort((a, b) => b.score - a.score);

                    return (
                        <motion.div
                            key={g}
                            className="bg-white/5 border border-white/10 rounded-xl p-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gIdx * 0.05 }}
                        >
                            <h3 className="font-bold text-center text-xs uppercase mb-3 text-blue-400">
                                Group {g}
                            </h3>
                            <div className="space-y-1.5">
                                {groupTeams.map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        className={cn(
                                            "text-xs flex justify-between items-center p-2 rounded-lg group transition-all",
                                            t.status === "eliminated"
                                                ? "bg-red-500/10 text-red-400/50 line-through"
                                                : "bg-white/5 hover:bg-white/10 text-white"
                                        )}
                                        whileHover={{ scale: t.status !== "eliminated" ? 1.02 : 1 }}
                                    >
                                        <span className="truncate max-w-[80px] flex items-center gap-1.5">
                                            {idx === 0 && t.status === "active" && (
                                                <Crown className="w-3 h-3 text-yellow-400" />
                                            )}
                                            {t.isBot && <Bot className="w-3 h-3 text-purple-400" />}
                                            <span className={t.status === "eliminated" ? "" : "font-medium"}>
                                                {t.name}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {(t.streak || 0) > 0 && (
                                                <span className="flex items-center text-orange-400">
                                                    <Flame className="w-3 h-3" />
                                                    <span className="text-[10px]">{t.streak}</span>
                                                </span>
                                            )}
                                            <span className={cn(
                                                "font-bold min-w-[30px] text-right",
                                                idx === 0 && t.status === "active" ? "text-yellow-400" : ""
                                            )}>
                                                {t.score}
                                            </span>
                                            {onKickPlayer && (
                                                <button
                                                    onClick={() => onKickPlayer(t.id, t.name)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                                                    title="Kick Player"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {groupTeams.length === 0 && (
                                    <p className="text-white/20 text-[10px] text-center py-2">No teams</p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
