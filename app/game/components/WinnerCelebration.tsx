"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Star, Sparkles } from "lucide-react";
import { Team } from "@/lib/types";

interface WinnerCelebrationProps {
    team: Team;
    rank: number;
}

export function WinnerCelebration({ team, rank }: WinnerCelebrationProps) {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Stop confetti after 10 seconds
        const timer = setTimeout(() => setShowConfetti(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    // Generate confetti particles
    const confettiColors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96F7D2", "#F9C80E", "#F86624"];
    const confettiPieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2,
        rotation: Math.random() * 360,
    }));

    const getRankDisplay = () => {
        switch (rank) {
            case 1: return { label: "CHAMPION", color: "from-yellow-400 to-amber-600", icon: Crown };
            case 2: return { label: "2ND PLACE", color: "from-gray-300 to-gray-500", icon: Trophy };
            case 3: return { label: "3RD PLACE", color: "from-amber-600 to-amber-800", icon: Trophy };
            case 4: return { label: "4TH PLACE", color: "from-blue-400 to-blue-600", icon: Star };
            case 5: return { label: "5TH PLACE", color: "from-purple-400 to-purple-600", icon: Star };
            default: return { label: "FINALIST", color: "from-green-400 to-green-600", icon: Sparkles };
        }
    };

    const rankInfo = getRankDisplay();
    const RankIcon = rankInfo.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/90">
            {/* Confetti */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confettiPieces.map((piece) => (
                        <motion.div
                            key={piece.id}
                            className="absolute w-3 h-3"
                            style={{
                                left: `${piece.left}%`,
                                backgroundColor: piece.color,
                                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                            }}
                            initial={{
                                y: -20,
                                opacity: 1,
                                rotate: piece.rotation,
                                scale: 0.5 + Math.random() * 0.5,
                            }}
                            animate={{
                                y: "100vh",
                                opacity: 0,
                                rotate: piece.rotation + 360,
                            }}
                            transition={{
                                duration: piece.duration,
                                delay: piece.delay,
                                repeat: showConfetti ? Infinity : 0,
                                ease: "linear",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Glowing rays */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-[50vh] bg-gradient-to-t from-transparent via-yellow-500/20 to-transparent origin-bottom"
                        style={{ rotate: `${i * 30}deg` }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
            </div>

            {/* Main content */}
            <motion.div
                className="relative z-10 text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 1, bounce: 0.4 }}
            >
                {/* Trophy/Crown icon */}
                <motion.div
                    className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${rankInfo.color} flex items-center justify-center shadow-2xl`}
                    animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            "0 0 40px rgba(255, 215, 0, 0.5)",
                            "0 0 80px rgba(255, 215, 0, 0.8)",
                            "0 0 40px rgba(255, 215, 0, 0.5)",
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <RankIcon className="w-16 h-16 text-white drop-shadow-lg" />
                </motion.div>

                {/* Rank label */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className={`text-xl font-black uppercase tracking-[0.3em] bg-gradient-to-r ${rankInfo.color} bg-clip-text text-transparent`}>
                        {rankInfo.label}
                    </span>
                </motion.div>

                {/* Congratulations text */}
                <motion.h1
                    className="text-5xl md:text-7xl font-black text-white mt-4 mb-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    CONGRATULATIONS!
                </motion.h1>

                {/* Team name */}
                <motion.div
                    className="mt-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <span className="text-white/60 text-lg">Team</span>
                    <h2 className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${rankInfo.color} bg-clip-text text-transparent`}>
                        {team.name}
                    </h2>
                </motion.div>

                {/* Score display */}
                <motion.div
                    className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-4 inline-block border border-white/20"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    <span className="text-white/60 text-sm uppercase tracking-wider">Final Score</span>
                    <p className="text-5xl font-black text-white">{team.score}</p>
                </motion.div>

                {/* Group info */}
                <motion.p
                    className="text-white/40 mt-6 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    Division {team.group} Winner
                </motion.p>

                {/* Animated sparkles */}
                <div className="absolute -top-10 -left-10 w-20 h-20">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                </div>
                <div className="absolute -top-10 -right-10 w-20 h-20">
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Bottom decorative stars */}
            <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
                <div className="flex justify-around">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                        >
                            <Star className="w-8 h-8 text-yellow-500/50 fill-yellow-500/30" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
