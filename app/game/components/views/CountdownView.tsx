import { motion } from "framer-motion";

interface CountdownViewProps {
    seconds: number;
}

export const CountdownView = ({ seconds }: CountdownViewProps) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
            key={seconds}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10rem] md:text-[15rem] font-black text-white leading-none drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]"
        >
            {seconds}
        </motion.div>
        <motion.p
            className="text-2xl font-bold text-blue-400 mt-4 uppercase tracking-[0.3em]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            Get Ready
        </motion.p>
    </div>
);
