import { motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    variant?: "default" | "danger" | "success" | "warning" | "primary";
    disabled?: boolean;
    loading?: boolean;
}

export const ActionButton = ({
    onClick,
    icon: Icon,
    label,
    variant = "default",
    disabled = false,
    loading = false,
}: ActionButtonProps) => {
    const variants = {
        default: "border-white/10 bg-white/[0.05] text-white/90 hover:border-white/20 hover:bg-white/[0.08]",
        danger: "border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/18",
        success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/18",
        warning: "border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/18",
        primary: "border-admin-cyan/20 bg-admin-cyan/10 text-admin-cyan hover:bg-admin-cyan/18",
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                "group relative inline-flex min-h-14 items-center gap-3 overflow-hidden rounded-full border px-5 py-3 text-left font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                variants[variant],
            )}
            whileHover={{ scale: disabled ? 1 : 1.015 }}
            whileTap={{ scale: disabled ? 1 : 0.985 }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_32%)] opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-current/20 bg-black/10">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </div>
            <span className="relative font-atsanee text-lg font-black uppercase italic tracking-wide">
                {label}
            </span>
        </motion.button>
    );
};
