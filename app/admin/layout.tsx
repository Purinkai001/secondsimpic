"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import {
    Loader2, ShieldAlert, LayoutDashboard, FileQuestion, Users,
    History, Settings, CheckSquare, Flag, LogOut, Activity, Sliders
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Suspense } from "react";

const NAV_ITEMS = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Grading", href: "/admin/grading", icon: CheckSquare },
    { label: "Tracking", href: "/admin/tracking", icon: Activity },
    { label: "Challenges", href: "/admin/challenges", icon: Flag },
    { label: "Standings", href: "/admin/standings", icon: Users },
    { label: "History", href: "/admin/history", icon: History },
    { label: "Questions", href: "/admin/questions", icon: FileQuestion },
    { label: "Config", href: "/admin/config", icon: Settings },
    { label: "Modify Scores", href: "/admin/modifyscore", icon: Sliders },
];

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loadingAuth } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const handleLogout = () => signOut(auth);

    // Fullscreen detection from search params hook (reactive)
    const isFullscreen = searchParams.get("fullscreen") === "true";

    if (loadingAuth) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="animate-spin text-accent-blue w-12 h-12 mx-auto mb-4" />
                    <p className="text-muted">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!user) return <AdminLogin />;

    return (
        <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
            {/* Sidebar */}
            {!isFullscreen && (
                <aside className="w-64 border-r border-surface-border bg-surface-bg backdrop-blur-xl flex flex-col sticky top-0 h-screen">
                    <div className="p-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-white dark:text-foreground" />
                        </div>
                        <span className="font-bold text-lg text-foreground">SIMPIC Admin</span>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group border",
                                        isActive
                                            ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
                                            : "hover:bg-surface-bg/80 text-muted hover:text-foreground border-transparent"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-accent-blue" : "text-muted group-hover:text-foreground")} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-surface-border">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header for User Info */}
                <header className="px-8 py-4 flex justify-end items-center gap-4 bg-surface-bg backdrop-blur-sm border-b border-surface-border">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-muted font-bold uppercase tracking-wider">Logged in as</p>
                            <p className="text-sm font-medium text-accent-blue">{user.email}</p>
                        </div>
                        <div className="h-8 w-px border-surface-border mx-2" />
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-400 transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className={cn("flex-1 overflow-x-auto", isFullscreen ? "p-0" : "p-8")}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-accent-blue w-12 h-12" />
            </div>
        }>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}

