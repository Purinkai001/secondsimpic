import { Skull, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { AdminPanel } from "./AdminPrimitives";

interface EliminationPanelProps {
    onRunElimination: (round: number) => void;
}

export function EliminationPanel({ onRunElimination }: EliminationPanelProps) {
    return (
        <AdminPanel
            title="Elimination"
            description="Execute division eliminations at the correct phase without changing any underlying game rules."
            icon={Skull}
            tone="danger"
        >
            <div className="space-y-4">
                {[3, 5].map((round) => (
                    <motion.div
                        key={round}
                        className="rounded-[1.5rem] border border-rose-300/18 bg-rose-300/10 p-4"
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <p className="font-atsanee text-2xl font-black uppercase italic text-rose-100">
                                    End of Round {round}
                                </p>
                                <p className="mt-1 text-sm font-medium text-rose-100/75">
                                    {round === 3 ? "Eliminate 3 per division (15 total)." : "Eliminate 2 per division (10 total)."}
                                </p>
                            </div>
                            <motion.button
                                onClick={() => onRunElimination(round)}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200/25 bg-rose-200/10 px-5 py-3 font-atsanee text-lg font-black uppercase italic text-rose-100"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Execute
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-gold/12 bg-gold/6 px-4 py-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-admin-muted">
                    <Zap className="h-4 w-4 text-gold" />
                    After Round 5, one winner per division proceeds to the final.
                </div>
            </div>
        </AdminPanel>
    );
}
