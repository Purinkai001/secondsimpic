import { Skull, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface EliminationPanelProps {
    onRunElimination: (round: number) => void;
}

export function EliminationPanel({ onRunElimination }: EliminationPanelProps) {
    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-red-500/20 rounded-lg">
                    <Skull className="w-4 h-4 text-red-400" />
                </div>
                Elimination
            </h2>

            <div className="space-y-3">
                {/* Round 3 Elimination */}
                <motion.div
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
                    whileHover={{ scale: 1.01 }}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-bold text-red-300">End of Round 3</span>
                            <p className="text-xs text-red-400/70 mt-0.5">Eliminate 3 per division (15 total)</p>
                        </div>
                        <motion.button
                            onClick={() => onRunElimination(3)}
                            className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AlertTriangle className="w-4 h-4" /> Execute
                        </motion.button>
                    </div>
                </motion.div>

                {/* Round 5 Elimination */}
                <motion.div
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
                    whileHover={{ scale: 1.01 }}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-bold text-red-300">End of Round 5</span>
                            <p className="text-xs text-red-400/70 mt-0.5">Eliminate 2 per division (10 total)</p>
                        </div>
                        <motion.button
                            onClick={() => onRunElimination(5)}
                            className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <AlertTriangle className="w-4 h-4" /> Execute
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Zap className="w-3 h-3" />
                    <span>After Round 5: 5 winners (1 per division) proceed to Final</span>
                </div>
            </div>
        </div>
    );
}
