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
            <div className="h-screen flex items-center justify-center bg-[#0a0e1a]">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-500 w-12 h-12 mx-auto mb-4" />
                    <p className="text-white/50">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!user) return <AdminLogin />;

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white flex">
            {/* Sidebar */}
            {!isFullscreen && (
                <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col sticky top-0 h-screen">
                    <div className="p-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">SIMPIC Admin</span>
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
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                        isActive
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            : "hover:bg-white/5 text-white/50 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "group-hover:text-white")} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                <header className="px-8 py-4 flex justify-end items-center gap-4 bg-black/10 backdrop-blur-sm border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Logged in as</p>
                            <p className="text-sm font-medium text-blue-400">{user.email}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className={cn("flex-1", isFullscreen ? "p-0" : "p-8")}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-[#0a0e1a]">
                <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
            </div>
        }>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}
