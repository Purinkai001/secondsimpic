import { motion } from "framer-motion";
import { Heart, Activity } from "lucide-react";

export const GameFooter = () => (
    <motion.div
        className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/20 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
    >
        <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Secure Connection • Real-time Sync Active</span>
        </div>
        <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-red-400/50" />
            <span>© 2025 MedSimpic Pro Arena</span>
        </div>
    </motion.div>
);
