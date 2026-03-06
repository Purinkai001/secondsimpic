import { Play, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Round } from "@/lib/types";
import { motion } from "framer-motion";
import { AdminBadge, AdminPanel } from "./AdminPrimitives";

interface RoundControlProps {
    rounds: Round[];
    onSchedule: (id: string, startTime: number) => void;
    onActivate: (id: string) => void;
    onEnd: (id: string) => void;
    onSelect: (id: string) => void;
    selectedRoundId: string | null;
}

export function RoundControl({ rounds, onSchedule, onActivate, onEnd, onSelect, selectedRoundId }: RoundControlProps) {
    const getCurrentTime = () => new globalThis.Date().getTime();

    const scheduleRound = (roundId: string) => {
        const minutes = prompt("Start round in how many minutes?", "1");
        if (minutes) {
            const mins = parseInt(minutes, 10);
            if (!isNaN(mins) && mins > 0) {
                const startTime = getCurrentTime() + mins * 60 * 1000;
                onSchedule(roundId, startTime);
            }
        }
    };

    return (
        <AdminPanel
            title="Round Control"
            description="Schedule, activate, and inspect round state from a single command surface."
            icon={Play}
            tone="accent"
        >
            <div className="space-y-4">
                {rounds.map((r, idx) => {
                    const startTime = r.startTime ? new Date(r.startTime).toLocaleTimeString() : null;
                    const isScheduled = r.startTime && r.startTime > getCurrentTime();
                    const isActive = r.status === "active";
                    const isCompleted = r.status === "completed";

                    return (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "rounded-[1.5rem] border p-4 transition-all",
                                isActive
                                    ? "border-emerald-300/20 bg-emerald-300/10"
                                    : isCompleted
                                        ? "border-white/8 bg-white/[0.03] opacity-70"
                                        : "border-white/8 bg-white/[0.04] hover:border-admin-cyan/20 hover:bg-white/[0.06]"
                            )}
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="font-atsanee text-2xl font-black uppercase italic text-gold">
                                            {r.id.replace("-", " ")}
                                        </p>
                                        <AdminBadge
                                            tone={isActive ? "success" : isCompleted ? "default" : "accent"}
                                            className="px-3 py-1"
                                        >
                                            {r.status}
                                        </AdminBadge>
                                    </div>
                                    {startTime && (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-admin-muted">
                                            <Calendar className="h-3 w-3 text-admin-cyan" />
                                            {isScheduled ? `Starts at ${startTime}` : `Started at ${startTime}`}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs font-semibold text-admin-muted">
                                        <Clock className="h-3 w-3 text-gold" />
                                        Timer: {r.questionTimer || 100}s per question | Q Index: {r.currentQuestionIndex || 0}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(r.status === "waiting" || r.status === "completed") && (
                                        <>
                                            <motion.button
                                                onClick={() => scheduleRound(r.id)}
                                                className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100 transition-all"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                Schedule
                                            </motion.button>
                                            <motion.button
                                                onClick={() => onActivate(r.id)}
                                                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-100 transition-all"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {r.status === "completed" ? "Restart" : "Start Now"}
                                            </motion.button>
                                        </>
                                    )}
                                    {r.status === "active" && (
                                        <motion.button
                                            onClick={() => onEnd(r.id)}
                                            className="rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-100 transition-all"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            End Round
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={() => onSelect(r.id)}
                                        className={cn(
                                            "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all",
                                            selectedRoundId === r.id
                                                ? "border-gold/20 bg-gold/10 text-gold"
                                                : "border-white/10 bg-white/[0.04] text-admin-muted hover:border-admin-cyan/20 hover:text-white"
                                        )}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Details
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </AdminPanel>
    );
}
