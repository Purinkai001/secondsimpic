import { motion } from "framer-motion";
import { Loader2, ScrollText, CheckCircle2 } from "lucide-react";
import { SubmissionResult } from "@/lib/game/types/game";
import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WaitingGradingViewProps {
    result: SubmissionResult | null;
    timeLeft?: number | null;
    question: Question | null;
}

export const WaitingGradingView = ({ result, timeLeft, question }: WaitingGradingViewProps) => (
    <div className="max-w-5xl mx-auto w-full px-4 space-y-12">
        <div className="bg-surface-bg border border-surface-border rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shadow-xl transition-colors duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="relative shrink-0">
                    <motion.div
                        className="absolute inset-0 bg-accent-blue blur-2xl opacity-20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <div className="relative p-5 md:p-6 bg-surface-bg border border-surface-border rounded-2xl">
                        <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-accent-blue animate-spin" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tighter italic leading-none mb-2">Evaluation In Progress</h2>
                    <p className="text-accent-blue/60 text-[10px] font-black uppercase tracking-widest">Verifying</p>
                </div>
            </div>

            {timeLeft != null && (
                <div className="w-full md:w-auto px-8 py-4 bg-accent-blue/10 border border-accent-blue/30 rounded-2xl md:rounded-3xl flex flex-col items-center md:block text-center md:text-right">
                    <span className="text-accent-blue font-black text-3xl tabular-nums leading-none">
                        {timeLeft}s
                    </span>

                </div>
            )}
        </div>

        {question && (
            <div className="opacity-40 grayscale-[0.5] transition-all hover:opacity-100 hover:grayscale-0">
                <div className="grid grid-cols-1 gap-8 items-start">
                    {question.imageUrl && (
                        <div className="aspect-video rounded-3xl overflow-hidden border border-surface-border bg-black/5">
                            <img src={question.imageUrl} className="w-full h-full object-contain" alt="Question" />
                        </div>
                    )}
                    <div className="space-y-4 text-left">
                        <h3 className="text-2xl font-bold text-foreground leading-tight">{question.text}</h3>
                        {result && (
                            <div className="pt-6 border-t space-y-4">
                                <span className="text-[12px] text-muted uppercase font-black">Status</span>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className={cn("w-5 h-5", result.pendingGrading ? "text-accent-amber/40" : "text-green-500")} />
                                    <span className="text-sm font-bold text-foreground/60">
                                        {result.pendingGrading ? "Grading your answer" : "Finished Grading"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
);
