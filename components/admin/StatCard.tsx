import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    value: number | string;
    label: string;
    color: string;
}

export const StatCard = ({ icon: Icon, value, label, color }: StatCardProps) => (
    <motion.div
        className={cn(
            "relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 shadow-lg border border-white/10",
            color
        )}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="relative flex items-center justify-between">
            <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
);
