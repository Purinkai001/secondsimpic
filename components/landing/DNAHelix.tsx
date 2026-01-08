import { motion } from "framer-motion";

export const DNAHelix = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <svg viewBox="0 0 200 800" className="absolute left-10 top-0 h-full w-32">
                {Array.from({ length: 20 }, (_, i) => (
                    <motion.g key={i}>
                        <motion.circle
                            cx={100 + Math.sin(i * 0.5) * 40}
                            cy={i * 40}
                            r="6"
                            fill="url(#gradient1)"
                            animate={{
                                cx: [100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40],
                            }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
                        />
                        <motion.circle
                            cx={100 + Math.sin(i * 0.5 + Math.PI) * 40}
                            cy={i * 40}
                            r="6"
                            fill="url(#gradient2)"
                            animate={{
                                cx: [100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40],
                            }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
                        />
                        <motion.line
                            x1={100 + Math.sin(i * 0.5) * 40}
                            y1={i * 40}
                            x2={100 + Math.sin(i * 0.5 + Math.PI) * 40}
                            y2={i * 40}
                            stroke="url(#lineGradient)"
                            strokeWidth="2"
                            animate={{
                                x1: [100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40],
                                x2: [100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40],
                            }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
                        />
                    </motion.g>
                ))}
                <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
