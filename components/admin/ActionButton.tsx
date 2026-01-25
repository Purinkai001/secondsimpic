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
    loading = false
}: ActionButtonProps) => {
    const variants = {
        default: "from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-900/20",
        danger: "from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/20",
        success: "from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20",
        warning: "from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20",
        primary: "from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-500/20",
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                "relative overflow-x-auto bg-gradient-to-r text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant]
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            {label}
        </motion.button>
    );
};
