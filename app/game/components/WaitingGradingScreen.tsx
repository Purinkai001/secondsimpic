"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface WaitingGradingScreenProps {
    questionText: string;
    userAnswer: string;
}

export function WaitingGradingScreen({ questionText, userAnswer }: WaitingGradingScreenProps) {
    return (
        <motion.div
            key="waiting-grading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-yellow-500/30"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4">
                <span className="text-white font-bold text-lg flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Waiting for Admin Grading
                </span>
            </div>

            <div className="p-8 text-center">
                {/* Spinning animation */}
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
                </div>

                <h2 className="text-2xl font-bold text-yellow-100 mb-4">
                    Your Answer Has Been Submitted
                </h2>

                <div className="bg-black/20 rounded-xl p-4 mb-6 max-w-lg mx-auto">
                    <p className="text-white/60 text-sm mb-2">Question:</p>
                    <p className="text-white/80 font-medium mb-4">{questionText || "(Image question)"}</p>
                    <p className="text-white/60 text-sm mb-2">Your Answer:</p>
                    <p className="text-yellow-400 font-bold text-lg">"{userAnswer}"</p>
                </div>

                <p className="text-white/50 text-sm max-w-md mx-auto">
                    The admin is reviewing all answers. The game will automatically continue once grading is complete.
                    Please wait...
                </p>

                {/* Animated dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="w-3 h-3 bg-yellow-400 rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
