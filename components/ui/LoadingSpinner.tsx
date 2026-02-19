import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    label?: string;
}

const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-[3px]",
};

export function LoadingSpinner({ className, size = "md", label }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div
                className={cn(
                    "rounded-full border-transparent border-t-accent-blue animate-spin",
                    sizes[size]
                )}
                style={{ borderTopColor: "currentColor" }}
            />
            {label && <p className="text-muted text-sm font-medium">{label}</p>}
        </div>
    );
}
