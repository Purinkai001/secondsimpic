import { Gavel, Check, X, MessageSquare } from "lucide-react";
import { Answer, Team } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface GradingQueueProps {
    pendingAnswers: Answer[];
    teams: Team[];
    onGrade: (answer: Answer, correct: boolean) => void;
}

export function GradingQueue({ pendingAnswers, teams, onGrade }: GradingQueueProps) {
    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Gavel className="w-4 h-4 text-purple-400" />
                </div>
                Grading Queue
                {pendingAnswers.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        {pendingAnswers.length}
                    </span>
                )}
            </h2>

            {pendingAnswers.length === 0 ? (
                <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-white/30 text-sm">No pending essays to grade</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {pendingAnswers.map((a, idx) => {
                            const t = teams.find((team) => team.id === a.teamId);
                            return (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col md:flex-row gap-4 justify-between items-start"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-purple-300 mb-2 flex items-center gap-2">
                                            {t?.name || a.teamId}
                                            <span className="text-xs text-white/30 font-normal">
                                                Group {t?.group}
                                            </span>
                                        </div>
                                        <div className="text-white/70 text-sm bg-black/20 p-3 rounded-lg italic">
                                            "{a.answer}"
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <motion.button
                                            onClick={() => onGrade(a, true)}
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-green-500/20"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Check className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onGrade(a, false)}
                                            className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-3 rounded-xl shadow-lg shadow-red-500/20"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <X className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
