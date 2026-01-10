import { motion } from "framer-motion";
import { Loader2, ScrollText, CheckCircle2 } from "lucide-react";
import { SubmissionResult } from "../../types";
import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WaitingGradingViewProps {
    result: SubmissionResult | null;
    timeLeft?: number | null;
    question: Question | null;
}

export const WaitingGradingView = ({ result, timeLeft, question }: WaitingGradingViewProps) => (
    <div className="max-w-5xl mx-auto w-full px-4 space-y-12">
        <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <div className="relative p-6 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                </div>
                <div className="text-left">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">Evaluation In Progress</h2>
                    <p className="text-blue-300/40 text-[10px] font-black uppercase tracking-widest">Verifying Clinical Records • Syncing Data</p>
                </div>
            </div>

            {timeLeft != null && (
                <div className="px-8 py-4 bg-blue-500/10 border border-blue-500/30 rounded-3xl">
                    <span className="text-blue-400 font-black text-3xl tabular-nums leading-none">
                        {timeLeft}s
                    </span>
                    <span className="ml-3 text-[10px] text-blue-300/40 uppercase font-black tracking-widest block transform -translate-y-1">Next Phase Sync</span>
                </div>
            )}
        </div>

        {question && (
            <div className="opacity-40 grayscale-[0.5] transition-all hover:opacity-80">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {question.imageUrl && (
                        <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/40">
                            <img src={question.imageUrl} className="w-full h-full object-contain" alt="Question" />
                        </div>
                    )}
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-2 text-blue-400/40">
                            <ScrollText className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Reference Document</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white leading-tight italic">{question.text}</h3>
                        {result && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest block">Transmission Status</span>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className={cn("w-5 h-5", result.pendingGrading ? "text-yellow-500/40" : "text-green-500")} />
                                    <span className="text-sm font-bold text-white/60">
                                        {result.pendingGrading ? "Metadata Uploaded - Pending Auth" : "Final Diagnosis Records Sealed"}
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
