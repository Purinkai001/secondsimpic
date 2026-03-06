"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminBadge } from "@/components/admin/AdminPrimitives";
import {
    Loader2, ShieldAlert, LayoutDashboard, FileQuestion, Users,
    History, Settings, CheckSquare, Flag, LogOut, Activity, Sliders, Menu, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import BgSVG from "@/vectors/bgsvg";
import TlCorner from "@/vectors/TlCorner";
import BrCorner from "@/vectors/BrCorner";

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

function AdminLoadingState({ message }: { message: string }) {
    return (
        <div className="admin-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-6">
            <div className="admin-grid absolute inset-0 opacity-[0.14]" />
            <div className="pointer-events-none absolute inset-0 opacity-25">
                <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>
            <div className="pointer-events-none absolute left-4 top-4 opacity-25">
                <TlCorner className="h-40 w-40" />
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 opacity-25">
                <BrCorner className="h-36 w-36" />
            </div>

            <div className="admin-panel admin-panel-strong relative flex w-full max-w-lg flex-col items-center gap-5 rounded-[2.5rem] px-10 py-14 text-center">
                <div className="rounded-full border border-gold/20 bg-gold/10 p-5 text-gold">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-admin-muted">
                        SIMPIC Admin
                    </p>
                    <h1 className="mt-3 font-atsanee text-4xl font-black uppercase italic text-gold">
                        Loading Control Room
                    </h1>
                    <p className="mt-3 text-sm font-medium text-admin-muted">{message}</p>
                </div>
            </div>
        </div>
    );
}

function AdminAccessDenied({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="admin-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-6">
            <div className="admin-grid absolute inset-0 opacity-[0.14]" />
            <div className="pointer-events-none absolute inset-0 opacity-25">
                <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>

            <div className="admin-panel admin-panel-strong relative w-full max-w-2xl rounded-[2.75rem] px-8 py-12 text-center md:px-12">
                <div className="pointer-events-none absolute left-3 top-3 opacity-30">
                    <TlCorner className="h-28 w-28" />
                </div>
                <div className="pointer-events-none absolute bottom-3 right-3 opacity-30">
                    <BrCorner className="h-24 w-24" />
                </div>

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-rose-300/20 bg-rose-300/10 text-rose-200">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <AdminBadge tone="danger" className="mt-6">
                    Admin Access Required
                </AdminBadge>
                <h1 className="mt-5 font-atsanee text-5xl font-black uppercase italic text-gold">
                    Access Denied
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-admin-muted md:text-base">
                    This account is authenticated, but it is not included in the admin allowlist for this control surface.
                </p>

                <button
                    onClick={onLogout}
                    className="mt-8 inline-flex items-center justify-center rounded-full border border-rose-300/25 bg-rose-300/10 px-7 py-3 font-atsanee text-xl font-black uppercase italic text-rose-100 transition-all hover:bg-rose-300/20"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

function AdminNavContent({
    pathname,
    userEmail,
    onLogout,
    onNavigate,
    mobile = false,
}: {
    pathname: string;
    userEmail: string | null | undefined;
    onLogout: () => void;
    onNavigate?: () => void;
    mobile?: boolean;
}) {
    return (
        <>
            {!mobile && (
                <div className={cn(
                    "admin-panel admin-panel-strong relative overflow-hidden rounded-[2rem] px-6 py-7",
                    mobile ? "bg-[#071737]/90" : "",
                )}>
                    <div className="pointer-events-none absolute left-0 top-0 opacity-25">
                        <TlCorner className="h-24 w-24" />
                    </div>
                    <div className="pointer-events-none absolute bottom-0 right-0 opacity-20">
                        <BrCorner className="h-20 w-20" />
                    </div>

                    <div className="relative">
                        <AdminBadge tone="accent">Arena Control</AdminBadge>
                        <h1 className="mt-4 font-atsanee text-4xl font-black uppercase italic text-gold">
                            SIMPIC Admin
                        </h1>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-admin-muted">
                            Command hub for rounds, grading, standings, and diagnostics.
                        </p>
                    </div>
                </div>
            )}

            <nav className={cn("flex-1 space-y-2", mobile ? "overflow-y-auto pr-1 custom-scrollbar" : "mt-6")}>
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border px-4 py-4 transition-all",
                                isActive
                                    ? "border-gold/20 bg-gold/10 text-gold shadow-[0_14px_32px_rgba(184,162,95,0.16)]"
                                    : "border-white/6 bg-white/[0.03] text-admin-muted hover:border-admin-cyan/20 hover:bg-white/[0.06] hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all",
                                isActive
                                    ? "border-gold/20 bg-gold/10 text-gold"
                                    : "border-white/10 bg-white/[0.04] text-admin-cyan group-hover:border-admin-cyan/20"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-atsanee text-xl font-black uppercase italic tracking-wide">
                                    {item.label}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                    Admin Surface
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="admin-panel mt-6 rounded-[1.75rem] px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-admin-muted">
                    Session
                </p>
                <p className="mt-3 break-all text-sm font-medium text-white/85">{userEmail}</p>
                <button
                    onClick={onLogout}
                    className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full border border-rose-300/20 bg-rose-300/10 px-5 py-3 font-atsanee text-xl font-black uppercase italic text-rose-100 transition-all hover:bg-rose-300/18"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </>
    );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loadingAuth } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const handleLogout = () => signOut(auth);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [hasAdminAccess, setHasAdminAccess] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const isFullscreen = searchParams.get("fullscreen") === "true";

    useEffect(() => {
        let cancelled = false;

        const verifySession = async () => {
            if (!user) {
                if (!cancelled) {
                    setHasAdminAccess(false);
                    setCheckingAccess(false);
                }
                return;
            }

            setCheckingAccess(true);
            try {
                await api.verifyAdminSession();
                if (!cancelled) {
                    setHasAdminAccess(true);
                }
            } catch {
                if (!cancelled) {
                    setHasAdminAccess(false);
                }
            } finally {
                if (!cancelled) {
                    setCheckingAccess(false);
                }
            }
        };

        verifySession();

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname, isFullscreen]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const originalOverflow = document.body.style.overflow;
        if (mobileNavOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [mobileNavOpen]);

    if (loadingAuth || (user && checkingAccess)) {
        return <AdminLoadingState message="Verifying credentials and synchronizing the current admin session." />;
    }

    if (!user) return <AdminLogin />;

    if (!hasAdminAccess) {
        return <AdminAccessDenied onLogout={handleLogout} />;
    }

    return (
        <div className="admin-shell relative min-h-screen overflow-hidden bg-[#020817] text-foreground">
            <div className="admin-grid absolute inset-0 opacity-[0.12]" />
            <div className="pointer-events-none absolute inset-0 opacity-25">
                <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#61d8f5]/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#d5b36b]/12 blur-[150px]" />

            <AnimatePresence>
                {!isFullscreen && mobileNavOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 z-50 xl:hidden"
                    >
                        <div className="admin-shell absolute inset-0 bg-[#020817]" />
                        <div className="admin-grid absolute inset-0 opacity-[0.12]" />
                        <div className="pointer-events-none absolute inset-0 opacity-25">
                            <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
                        </div>
                        <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#61d8f5]/10 blur-[120px]" />
                        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#d5b36b]/12 blur-[150px]" />
                        <div className="pointer-events-none absolute left-4 top-4 opacity-28">
                            <TlCorner className="h-28 w-28" />
                        </div>
                        <div className="pointer-events-none absolute bottom-4 right-4 opacity-24">
                            <BrCorner className="h-24 w-24" />
                        </div>

                        <motion.div
                            initial={{ y: "-100%", opacity: 0.92 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "-100%", opacity: 0.92 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex h-full flex-col px-4 py-4 sm:px-6"
                        >
                            <div className="mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-[#03112c]/70 px-5 py-4 backdrop-blur-2xl">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-admin-muted">
                                        Navigation
                                    </p>
                                    <h2 className="mt-2 font-atsanee text-3xl font-black uppercase italic text-gold">
                                        SIMPIC Admin
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setMobileNavOpen(false)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition-all hover:border-gold/20 hover:text-gold"
                                    title="Close navigation"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col">
                                <AdminNavContent
                                    pathname={pathname}
                                    userEmail={user.email}
                                    onLogout={handleLogout}
                                    onNavigate={() => setMobileNavOpen(false)}
                                    mobile
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 flex min-h-screen">
                {!isFullscreen && (
                    <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-[#03112c]/75 p-6 backdrop-blur-2xl xl:flex xl:flex-col">
                        <AdminNavContent
                            pathname={pathname}
                            userEmail={user.email}
                            onLogout={handleLogout}
                        />
                    </aside>
                )}

                <div className="flex min-h-screen flex-1 flex-col">
                    {!isFullscreen && (
                        <header className="sticky top-0 z-20 border-b border-white/8 bg-[#021127]/70 px-5 py-4 backdrop-blur-2xl md:px-8">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setMobileNavOpen(true)}
                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition-all hover:border-gold/20 hover:text-gold xl:hidden"
                                        title="Open navigation"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-admin-muted">
                                            Operator Console
                                        </p>
                                        <h2 className="mt-2 font-atsanee text-3xl font-black uppercase italic text-gold">
                                            {NAV_ITEMS.find((item) => item.href === pathname)?.label || "Admin"}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <AdminBadge tone="accent">Live Session</AdminBadge>
                                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-admin-muted">
                                            Logged in as
                                        </p>
                                        <p className="mt-1 max-w-[280px] truncate text-sm font-semibold text-white/90">
                                            {user.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-rose-300/20 hover:bg-rose-300/10 hover:text-rose-100 lg:inline-flex"
                                        title="Sign Out"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </header>
                    )}

                    <main className={cn("relative flex-1", isFullscreen ? "p-0" : "px-4 py-6 md:px-8 md:py-8")}>
                        <div className={cn("mx-auto", isFullscreen ? "max-w-none" : "max-w-[1700px]")}>
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<AdminLoadingState message="Preparing the admin interface." />}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}
