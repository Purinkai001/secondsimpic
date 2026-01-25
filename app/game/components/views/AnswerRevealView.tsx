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
                <div className="p-10 bg-surface-bg border border-surface-border rounded-[3rem] inline-block mb-10 shadow-xl">
                    <Loader2 className="w-20 h-20 text-accent-blue animate-spin" />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-4 uppercase italic tracking-tighter">Synchronizing Results</h2>
                <p className="text-muted text-lg">Finalizing score verification for all teams...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-surface-bg border border-surface-border rounded-[2.5rem] overflow-hidden shadow-2xl transition-colors duration-300"
            >
                <div className={cn(
                    "p-8 md:p-12 text-center relative",
                    result.isCorrect ? "bg-green-500/10 dark:bg-green-500/5" : "bg-red-500/10 dark:bg-red-500/5"
                )}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                        className="mb-6 flex justify-center"
                    >
                        {result.isCorrect ? (
                            <CheckCircle2 className="w-24 h-24 text-green-600 dark:text-green-500 shadow-lg" />
                        ) : (
                            <XCircle className="w-24 h-24 text-red-600 dark:text-red-500 shadow-lg" />
                        )}
                    </motion.div>

                    <h2 className={cn(
                        "text-5xl font-black mb-4 uppercase italic tracking-tighter",
                        result.isCorrect ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                    )}>
                        {result.message}
                    </h2>

                    <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-6 mt-8">
                        <div className="bg-surface-bg border border-surface-border p-4 rounded-2xl md:bg-transparent md:p-0 md:border-none">
                            <div className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Points Gained</div>
                            <div className="text-3xl md:text-4xl font-black text-foreground">+{result.points}</div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-surface-border" />
                        <div className="bg-surface-bg border border-surface-border p-4 rounded-2xl md:bg-transparent md:p-0 md:border-none">
                            <div className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Current Streak</div>
                            <div className="flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <div className="text-3xl md:text-4xl font-black text-foreground">{result.streak}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-10 border-t border-surface-border space-y-6">
                    {result.correctAnswer && (
                        <div className="bg-surface-bg/50 rounded-3xl p-6 border border-surface-border space-y-6">
                            <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-muted">
                                <Info className="w-4 h-4 text-accent-blue" />
                                Response Comparison & Reference
                            </div>

                            {/* Reference Image */}
                            {(result as any).imageUrl && (
                                <div className="aspect-video rounded-2xl overflow-hidden border border-surface-border bg-surface-bg/80 mb-6 group cursor-zoom-in">
                                    <img src={(result as any).imageUrl} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" alt="Reference" />
                                </div>
                            )}

                            {result.correctAnswer.type === "mcq" && (() => {
                                const correctIndices = result.correctAnswer?.correctChoiceIndices ||
                                    (result.correctAnswer?.correctChoiceIndex !== undefined ? [result.correctAnswer.correctChoiceIndex] : []);
                                return (
                                    <div className="space-y-3">
                                        {result.correctAnswer?.choices?.map((c, i) => {
                                            const isCorrectChoice = correctIndices.includes(i);
                                            return (
                                                <div key={i} className={cn(
                                                    "p-4 rounded-xl border flex items-center gap-4 transition-all",
                                                    isCorrectChoice
                                                        ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                                                        : "bg-surface-bg border-surface-border text-muted"
                                                )}>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black italic",
                                                        isCorrectChoice ? "bg-green-600 dark:bg-green-500 text-white dark:text-black" : "bg-surface-bg border border-surface-border text-muted/40"
                                                    )}>{String.fromCharCode(65 + i)}</div>
                                                    <span className={cn("font-bold tracking-tight", isCorrectChoice ? "text-green-700 dark:text-green-400" : "text-foreground/60")}>
                                                        {c.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {result.correctAnswer.type === "mtf" && (
                                <div className="space-y-2">
                                    {result.correctAnswer.statements?.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-surface-bg border border-surface-border rounded-xl group/row hover:border-accent-blue/20 transition-all">
                                            <span className="font-bold text-foreground/80 group-hover/row:text-foreground">{s.text}</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-3 py-1 rounded-full border tracking-widest italic",
                                                s.isTrue ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
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
                            className="w-full py-4 rounded-2xl border border-surface-border bg-surface-bg/50 hover:bg-surface-bg hover:border-accent-blue/30 text-muted hover:text-foreground transition-all text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 text-accent-amber" />
                            Submit a Challenge Inquiry
                        </button>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-surface-border/50">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 text-accent-blue/80 font-black text-[10px] uppercase tracking-[0.2em] italic">
                                <span>Awaiting Remote Sync</span>
                                <div className="flex gap-1.5 Items-center">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1 h-3 bg-accent-blue rounded-full"
                                            animate={{ height: [8, 12, 8], opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
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
