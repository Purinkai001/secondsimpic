import { FileQuestion, ArrowRight, StopCircle } from "lucide-react";
import { Question } from "@/lib/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuestionManagerProps {
    selectedRoundId: string;
    questions: Question[];
    onSetQuestion: (roundId: string, qId: string | null) => void;
}

export function QuestionManager({ selectedRoundId, questions, onSetQuestion }: QuestionManagerProps) {
    const roundQuestions = questions
        .filter((q) => q.roundId === selectedRoundId)
        .sort((a, b) => a.order - b.order);

    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <FileQuestion className="w-4 h-4 text-cyan-400" />
                </div>
                Questions
                <span className="text-sm font-normal text-white/50 ml-1">({selectedRoundId})</span>
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                <motion.button
                    onClick={() => onSetQuestion(selectedRoundId, null)}
                    className="w-full text-left p-3 bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all flex items-center gap-2 font-semibold"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <StopCircle className="w-4 h-4" />
                    Stop/Hide Question
                </motion.button>

                {roundQuestions.map((q, idx) => (
                    <motion.div
                        key={q.id}
                        className="flex justify-between items-center p-3 hover:bg-white/5 border border-white/5 rounded-xl bg-white/[0.02] transition-all"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white/50">
                                {q.order}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                        q.type === "mcq" ? "bg-blue-500/20 text-blue-400" :
                                            q.type === "mtf" ? "bg-purple-500/20 text-purple-400" :
                                                q.type === "saq" ? "bg-green-500/20 text-green-400" :
                                                    "bg-orange-500/20 text-orange-400"
                                    )}>
                                        {q.type}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                        q.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                                            q.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                    )}>
                                        {q.difficulty}
                                    </span>
                                </div>
                                <p className="text-sm text-white/70 truncate">
                                    {q.text || "(Image question)"}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => onSetQuestion(selectedRoundId, q.id)}
                            className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors font-semibold flex items-center gap-1 ml-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Push <ArrowRight className="w-3 h-3" />
                        </motion.button>
                    </motion.div>
                ))}

                {roundQuestions.length === 0 && (
                    <div className="text-center py-6">
                        <FileQuestion className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-white/30 text-sm">No questions for this round</p>
                    </div>
                )}
            </div>
        </div>
    );
}
