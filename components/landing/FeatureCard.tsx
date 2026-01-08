import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export const FeatureCard = ({ icon: Icon, title, delay }: { icon: LucideIcon; title: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-2 text-white/60 text-sm"
    >
        <div className="p-1.5 bg-white/10 rounded-lg">
            <Icon className="w-4 h-4" />
        </div>
        <span>{title}</span>
    </motion.div>
);
