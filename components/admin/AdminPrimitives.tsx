import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import TlCorner from "@/vectors/TlCorner";
import BrCorner from "@/vectors/BrCorner";

interface AdminPageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    status?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

interface AdminPanelProps {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    tone?: "default" | "accent" | "warning" | "danger";
}

interface AdminEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    className?: string;
}

export function AdminPageHeader({
    eyebrow = "SIMPIC Control",
    title,
    description,
    status,
    actions,
    className,
}: AdminPageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
            <div className="space-y-3">
                <div className="inline-flex items-center gap-3 rounded-full border border-gold/15 bg-gold/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-admin-muted">
                    <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_14px_rgba(255,241,211,0.6)]" />
                    {eyebrow}
                </div>
                <div>
                    <h1 className="font-atsanee text-4xl font-black uppercase italic tracking-wide text-gold md:text-5xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-3xl text-sm font-medium text-admin-muted md:text-base">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {(status || actions) && (
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                    {status}
                    {actions}
                </div>
            )}
        </div>
    );
}

export function AdminPanel({
    title,
    description,
    icon: Icon,
    actions,
    children,
    className,
    contentClassName,
    tone = "default",
}: AdminPanelProps) {
    const tones = {
        default: "border-admin-panel-border",
        accent: "border-admin-cyan/25 shadow-[0_20px_60px_rgba(8,72,102,0.35)]",
        warning: "border-amber-300/25 shadow-[0_20px_60px_rgba(120,78,9,0.25)]",
        danger: "border-rose-300/25 shadow-[0_20px_60px_rgba(120,24,42,0.25)]",
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "admin-panel relative overflow-hidden rounded-[2rem]",
                tones[tone],
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,241,211,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(124,232,239,0.10),transparent_26%)]" />
            <div className="pointer-events-none absolute left-0 top-0 opacity-25">
                <TlCorner className="h-28 w-28" />
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 opacity-20">
                <BrCorner className="h-24 w-24" />
            </div>

            {(title || description || actions) && (
                <div className="relative flex flex-col gap-4 border-b border-white/8 px-6 py-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        {title && (
                            <div className="flex items-center gap-3">
                                {Icon && (
                                    <div className="rounded-2xl border border-gold/15 bg-gold/10 p-2.5 text-gold">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-atsanee text-2xl font-black uppercase italic tracking-wide text-gold">
                                        {title}
                                    </h2>
                                    {description && (
                                        <p className="mt-1 text-sm text-admin-muted">{description}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {actions && <div className="relative shrink-0">{actions}</div>}
                </div>
            )}

            <div className={cn("relative p-6", contentClassName)}>{children}</div>
        </motion.section>
    );
}

export function AdminBadge({
    children,
    tone = "default",
    className,
}: {
    children: React.ReactNode;
    tone?: "default" | "accent" | "success" | "warning" | "danger";
    className?: string;
}) {
    const tones = {
        default: "border-white/10 bg-white/5 text-admin-muted",
        accent: "border-admin-cyan/25 bg-admin-cyan/10 text-admin-cyan",
        success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-300/20 bg-amber-300/10 text-amber-200",
        danger: "border-rose-300/20 bg-rose-300/10 text-rose-200",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em]",
                tones[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

export function AdminEmptyState({
    icon: Icon,
    title,
    description,
    className,
}: AdminEmptyStateProps) {
    return (
        <div
            className={cn(
                "admin-panel relative overflow-hidden rounded-[2.5rem] border border-dashed border-white/10 px-8 py-20 text-center",
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,241,211,0.08),transparent_40%)]" />
            <Icon className="mx-auto mb-6 h-20 w-20 text-gold/25" />
            <p className="font-atsanee text-3xl font-black uppercase italic tracking-wide text-gold/70">
                {title}
            </p>
            {description && (
                <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-admin-muted">
                    {description}
                </p>
            )}
        </div>
    );
}
