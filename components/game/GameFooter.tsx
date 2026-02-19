import { motion } from "framer-motion";
import { Heart, Activity } from "lucide-react";

export const GameFooter = () => (
    <motion.div
        className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/20 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
    >
    </motion.div>
);
