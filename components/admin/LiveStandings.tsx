import { Trophy, Trash2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, GROUPS } from "@/lib/types";

interface LiveStandingsProps {
    teams: Team[];
    activeTeamsCount: number;
    onKickPlayer?: (teamId: string, teamName: string) => void;
}

export function LiveStandings({ teams, activeTeamsCount, onKickPlayer }: LiveStandingsProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Live Standings ({activeTeamsCount} Active)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {GROUPS.map((g) => (
                    <div key={g} className="bg-gray-50 p-2 rounded border">
                        <h3 className="font-bold text-center text-gray-500 text-xs uppercase mb-2">Group {g}</h3>
                        <div className="space-y-1">
                            {teams
                                .filter((t) => t.group === g)
                                .sort((a, b) => b.score - a.score)
                                .map((t) => (
                                    <div
                                        key={t.id}
                                        className={cn(
                                            "text-xs flex justify-between items-center p-1 rounded group",
                                            t.status === "eliminated"
                                                ? "bg-red-100 text-red-400 opacity-60 line-through"
                                                : "bg-white shadow-sm"
                                        )}
                                    >
                                        <span className="truncate max-w-[60px] flex items-center gap-1">
                                            {t.isBot && <Bot className="w-3 h-3 text-purple-400" />}
                                            {t.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">{t.score}</span>
                                            {onKickPlayer && (
                                                <button
                                                    onClick={() => onKickPlayer(t.id, t.name)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-opacity"
                                                    title="Kick Player"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
