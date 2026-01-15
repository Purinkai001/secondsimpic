import { Play, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Round } from "@/lib/types";
import { motion } from "framer-motion";

interface RoundControlProps {
    rounds: Round[];
    onSchedule: (id: string, startTime: number) => void;
    onActivate: (id: string) => void;
    onEnd: (id: string) => void;
    onSelect: (id: string) => void;
    selectedRoundId: string | null;
}

export function RoundControl({ rounds, onSchedule, onActivate, onEnd, onSelect, selectedRoundId }: RoundControlProps) {
    const scheduleRound = (roundId: string) => {
        const minutes = prompt("Start round in how many minutes?", "1");
        if (minutes) {
            const mins = parseInt(minutes, 10);
            if (!isNaN(mins) && mins > 0) {
                const startTime = Date.now() + mins * 60 * 1000;
                onSchedule(roundId, startTime);
            }
        }
    };

    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Play className="w-4 h-4 text-blue-400" />
                </div>
                Round Control
            </h2>
            <div className="space-y-3">
                {rounds.map((r, idx) => {
                    const startTime = r.startTime ? new Date(r.startTime).toLocaleTimeString() : null;
                    const isScheduled = r.startTime && r.startTime > Date.now();
                    const isActive = r.status === "active";
                    const isCompleted = r.status === "completed";

                    return (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "p-4 rounded-xl border transition-all",
                                isActive
                                    ? "bg-green-500/10 border-green-500/30"
                                    : isCompleted
                                        ? "bg-white/5 border-white/5 opacity-60"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                                <div className="flex items-center gap-2 mb-2 xl:mb-0">
                                    <span className="font-bold uppercase text-sm text-white">{r.id.replace("-", " ")}</span>
                                    <span
                                        className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-semibold",
                                            isActive
                                                ? "bg-green-500/20 text-green-400"
                                                : isCompleted
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-white/10 text-white/50"
                                        )}
                                    >
                                        {r.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                    {(r.status === "waiting" || r.status === "completed") && (
                                        <>
                                            <motion.button
                                                onClick={() => scheduleRound(r.id)}
                                                className="flex-1 xl:flex-none justify-center text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow-lg shadow-amber-500/20 whitespace-nowrap"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Calendar className="w-3 h-3" /> Schedule
                                            </motion.button>
                                            <motion.button
                                                onClick={() => onActivate(r.id)}
                                                className="flex-1 xl:flex-none justify-center text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg shadow-green-500/20 whitespace-nowrap"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {r.status === "completed" ? "Restart" : "Start Now"}
                                            </motion.button>
                                        </>
                                    )}
                                    {r.status === "active" && (
                                        <motion.button
                                            onClick={() => onEnd(r.id)}
                                            className="flex-1 xl:flex-none justify-center text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg shadow-red-500/20 whitespace-nowrap"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            End Round
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={() => onSelect(r.id)}
                                        className={cn(
                                            "flex-1 xl:flex-none justify-center text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all whitespace-nowrap",
                                            selectedRoundId === r.id
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                                        )}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Details
                                    </motion.button>
                                </div>
                            </div>
                            {startTime && (
                                <div className="text-xs text-white/40 flex items-center gap-1 mt-2">
                                    <Calendar className="w-3 h-3" />
                                    {isScheduled ? `Starts at ${startTime}` : `Started at ${startTime}`}
                                </div>
                            )}
                            <div className="text-xs text-white/30 mt-1 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Timer: {r.questionTimer || 100}s per question | Q Index: {r.currentQuestionIndex || 0}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
