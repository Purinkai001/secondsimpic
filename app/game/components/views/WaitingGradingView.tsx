import { motion } from "framer-motion";
import { Loader2, ScrollText, CheckCircle2, ShieldAlert } from "lucide-react";
import { SubmissionResult } from "../../types";

interface WaitingGradingViewProps {
    result: SubmissionResult | null;
}

export const WaitingGradingView = ({ result }: WaitingGradingViewProps) => (
    <div className="max-w-2xl mx-auto w-full text-center py-20">
        <div className="relative inline-block mb-10">
            <motion.div
                className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl">
                <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
            </div>
            <motion.div
                className="absolute -bottom-4 -right-4 p-4 bg-yellow-500 rounded-3xl shadow-xl shadow-yellow-500/20"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <ShieldAlert className="w-8 h-8 text-black" />
            </motion.div>
        </div>

        <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">Evaluation In Progress</h2>
        <p className="text-blue-300/60 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            Your diagnosis is being verified by the medical proctors. Results will be synchronized momentarity.
        </p>

        {result && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between max-w-sm mx-auto"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                        <ScrollText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <span className="text-[10px] text-white/40 uppercase font-black block leading-tight">Your Submission</span>
                        <span className="text-white font-bold block truncate max-w-[150px]">Processing Data...</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                    <span className="text-[10px] uppercase font-black">Status</span>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                </div>
            </motion.div>
        )}
    </div>
);
