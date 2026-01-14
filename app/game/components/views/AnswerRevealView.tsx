import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, ChevronRight, Trophy, Loader2 } from "lucide-react";
import { SubmissionResult } from "../../types";
import { cn } from "@/lib/utils";

interface AnswerRevealViewProps {
    result: SubmissionResult | null;
    countdown: number;
    onChallenge: () => void;
}

export const AnswerRevealView = ({ result, countdown, onChallenge }: AnswerRevealViewProps) => {
    const isProcessing = !result;

    // Fallback content if results are still loading/syncing
    if (isProcessing) {
        return (
            <div className="max-w-4xl mx-auto w-full text-center py-20">
                <div className="p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] inline-block mb-10">
                    <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">Synchronizing Results</h2>
                <p className="text-blue-300/60 text-lg">Finalizing score verification for all teams...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
                <div className={cn(
                    "p-8 md:p-12 text-center relative",
                    result.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                        className="mb-6 flex justify-center"
                    >
                        {result.isCorrect ? (
                            <CheckCircle2 className="w-24 h-24 text-green-500 shadow-lg" />
                        ) : (
                            <XCircle className="w-24 h-24 text-red-500 shadow-lg" />
                        )}
                    </motion.div>

                    <h2 className={cn(
                        "text-5xl font-black mb-4 uppercase italic tracking-tighter",
                        result.isCorrect ? "text-green-500" : "text-red-500"
                    )}>
                        {result.message}
                    </h2>

                    <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-6 mt-8">
                        <div className="bg-white/5 p-4 rounded-2xl md:bg-transparent md:p-0">
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Points Gained</div>
                            <div className="text-3xl md:text-4xl font-black text-white">+{result.points}</div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/10" />
                        <div className="bg-white/5 p-4 rounded-2xl md:bg-transparent md:p-0">
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Current Streak</div>
                            <div className="flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <div className="text-3xl md:text-4xl font-black text-white">{result.streak}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-10 border-t border-white/5 space-y-6">
                    {result.correctAnswer && (
                        <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5 space-y-6">
                            <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-white/40">
                                <Info className="w-4 h-4 text-blue-500" />
                                Response Comparison & Reference
                            </div>

                            {/* Added Image Reference if available */}
                            {(result as any).imageUrl && (
                                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 mb-6 opacity-80">
                                    <img src={(result as any).imageUrl} className="w-full h-full object-contain" alt="Reference" />
                                </div>
                            )}

                            {result.correctAnswer.type === "mcq" && (
                                <div className="space-y-3">
                                    {result.correctAnswer.choices?.map((c, i) => (
                                        <div key={i} className={cn(
                                            "p-4 rounded-xl border flex items-center gap-4",
                                            i === result.correctAnswer?.correctChoiceIndex
                                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                : "bg-white/5 border-white/5 text-white/40"
                                        )}>
                                            <div className={cn(
                                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                                                i === result.correctAnswer?.correctChoiceIndex ? "bg-green-500 text-black" : "bg-white/10"
                                            )}>{String.fromCharCode(65 + i)}</div>
                                            <span className="font-medium">{c.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result.correctAnswer.type === "mtf" && (
                                <div className="space-y-2">
                                    {result.correctAnswer.statements?.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                                            <span className="text-sm text-white/80">{s.text}</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-2 py-1 rounded",
                                                s.isTrue ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            )}>{s.isTrue ? "True" : "False"}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!result.isCorrect && (
                        <button
                            onClick={onChallenge}
                            className="w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            Question doesn't seem right? Submit a Challenge
                        </button>
                    )}

                    <div className="flex items-center justify-between pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-blue-400">
                                <span className="text-xs font-black uppercase tracking-widest">Awaiting Admin Sync</span>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1 h-3 bg-blue-500 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
