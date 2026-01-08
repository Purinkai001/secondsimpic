import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";

export const AnimatedLogo = () => {
    return (
        <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
            {/* Outer glow ring */}
            <motion.div
                className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-50 blur-xl"
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Rotating border */}
            <motion.div
                className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner circle with icon */}
            <div className="relative p-5 bg-slate-900 rounded-full shadow-2xl">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Stethoscope className="w-12 h-12 text-white" />
                </motion.div>
            </div>

            {/* Sparkle effects */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                        top: "50%",
                        left: "50%",
                    }}
                    animate={{
                        x: [0, Math.cos(angle * Math.PI / 180) * 50, 0],
                        y: [0, Math.sin(angle * Math.PI / 180) * 50, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                    }}
                />
            ))}
        </motion.div>
    );
};
