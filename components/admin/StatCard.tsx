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
            "admin-panel relative overflow-hidden rounded-[2rem] p-5",
            color,
        )}
        whileHover={{ scale: 1.015, y: -4 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,241,211,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(124,232,239,0.14),transparent_34%)]" />
        <div className="absolute -right-6 top-4 h-24 w-24 rounded-full border border-white/8 bg-white/[0.04]" />

        <div className="relative flex items-start justify-between gap-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-admin-muted">{label}</p>
                <p className="mt-3 font-atsanee text-5xl font-black italic text-gold">{value}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-gold/15 bg-gold/10 text-gold">
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </motion.div>
);
