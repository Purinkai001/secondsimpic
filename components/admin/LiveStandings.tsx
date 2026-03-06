import { Trophy, Trash2, Bot, Crown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, GROUPS } from "@/lib/types";
import { motion } from "framer-motion";
import { AdminEmptyState, AdminPanel } from "./AdminPrimitives";

interface LiveStandingsProps {
    teams: Team[];
    activeTeamsCount: number;
    onKickPlayer?: (teamId: string, teamName: string) => void;
}

export function LiveStandings({ teams, activeTeamsCount, onKickPlayer }: LiveStandingsProps) {
    return (
        <AdminPanel
            title="Live Standings"
            description={`${activeTeamsCount} active teams across all divisions.`}
            icon={Trophy}
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {GROUPS.map((g, gIdx) => {
                    const groupTeams = teams
                        .filter((t) => t.group === g)
                        .sort((a, b) => b.score - a.score);

                    return (
                        <motion.div
                            key={g}
                            className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gIdx * 0.05 }}
                        >
                            <h3 className="text-center font-atsanee text-2xl font-black uppercase italic text-gold">
                                Group {g}
                            </h3>
                            <div className="mt-4 space-y-2">
                                {groupTeams.map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        className={cn(
                                            "group flex items-center justify-between rounded-[1rem] border p-3 text-xs transition-all",
                                            t.status === "eliminated"
                                                ? "border-rose-300/14 bg-rose-300/10 text-rose-100/55 line-through"
                                                : "border-white/8 bg-white/[0.03] text-white/85 hover:border-admin-cyan/18"
                                        )}
                                        whileHover={{ scale: t.status !== "eliminated" ? 1.02 : 1 }}
                                    >
                                        <span className="no-scrollbar flex max-w-[120px] items-center gap-1.5 overflow-x-auto whitespace-nowrap">
                                            {idx === 0 && t.status === "active" && (
                                                <Crown className="h-3 w-3 shrink-0 text-gold" />
                                            )}
                                            {t.isBot && <Bot className="h-3 w-3 shrink-0 text-admin-cyan" />}
                                            <span className={t.status === "eliminated" ? "" : "font-medium"}>{t.name}</span>
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {(t.streak || 0) > 0 && (
                                                <span className="flex items-center text-amber-100">
                                                    <Flame className="h-3 w-3" />
                                                    <span className="text-[10px]">{t.streak}</span>
                                                </span>
                                            )}
                                            <span className={cn(
                                                "min-w-[30px] text-right font-bold",
                                                idx === 0 && t.status === "active" ? "text-gold" : ""
                                            )}>
                                                {t.score}
                                            </span>
                                            {onKickPlayer && (
                                                <button
                                                    onClick={() => onKickPlayer(t.id, t.name)}
                                                    className="rounded p-1 text-rose-100 opacity-0 transition-all hover:bg-rose-300/18 group-hover:opacity-100"
                                                    title="Kick Player"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {groupTeams.length === 0 && (
                                    <AdminEmptyState
                                        icon={Trophy}
                                        title="No Teams"
                                        description="No teams are assigned to this division yet."
                                        className="px-4 py-8"
                                    />
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </AdminPanel>
    );
}
