import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export const FeatureCard = ({ icon: Icon, title, delay }: { icon: LucideIcon; title: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-2 text-muted text-sm"
    >
        <div className="p-1.5 bg-surface-bg border border-surface-border rounded-lg">
            <Icon className="w-4 h-4 text-accent-blue" />
        </div>
        <span className="text-foreground/80">{title}</span>
    </motion.div>
);
