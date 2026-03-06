"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, Key, ShieldCheck } from "lucide-react";
import BgSVG from "@/vectors/bgsvg";
import TlCorner from "@/vectors/TlCorner";
import BrCorner from "@/vectors/BrCorner";
import { AdminBadge } from "./AdminPrimitives";

export function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            console.error(err);
            setError("Invalid credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            console.error("Google Auth Error:", err);
            setError("Google Sign-In failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-4 py-10">
            <div className="admin-grid absolute inset-0 opacity-[0.14]" />
            <div className="pointer-events-none absolute inset-0 opacity-30">
                <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#7ce8ef]/12 blur-[140px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#b8a25f]/14 blur-[160px]" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45 }}
                className="relative z-10 w-full max-w-6xl"
            >
                <div className="grid overflow-hidden rounded-[2.75rem] border border-gold/15 bg-[#04112d]/70 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="relative hidden min-h-[720px] overflow-hidden border-r border-white/8 lg:block">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,241,211,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(124,232,239,0.16),transparent_34%),linear-gradient(180deg,rgba(0,18,55,0.88),rgba(8,20,56,0.96))]" />
                        <div className="absolute left-5 top-5 opacity-35">
                            <TlCorner className="h-40 w-40" />
                        </div>
                        <div className="absolute bottom-5 right-5 opacity-30">
                            <BrCorner className="h-36 w-36" />
                        </div>

                        <div className="relative flex h-full flex-col justify-between p-10">
                            <div>
                                <AdminBadge tone="accent">Ceremonial Control</AdminBadge>
                                <h1 className="mt-6 font-atsanee text-7xl font-black uppercase italic leading-[0.85] text-gold">
                                    SIMPIC
                                    <br />
                                    Admin
                                </h1>
                                <p className="mt-6 max-w-md text-base leading-relaxed text-admin-muted">
                                    A branded command center aligned with the arena experience for grading, standings, diagnostics, and live round control.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Live round orchestration and diagnostics",
                                    "Fast operator workflows for grading and score management",
                                    "Shared gold-blue visual language with the game arena",
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-5 py-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/15 bg-gold/10 text-gold">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-semibold text-white/85">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="relative p-6 md:p-10 lg:p-12">
                        <div className="pointer-events-none absolute left-3 top-3 opacity-30 lg:hidden">
                            <TlCorner className="h-24 w-24" />
                        </div>
                        <div className="pointer-events-none absolute bottom-3 right-3 opacity-25 lg:hidden">
                            <BrCorner className="h-20 w-20" />
                        </div>

                        <form onSubmit={handleLogin} className="relative mx-auto max-w-md space-y-6 py-4">
                            <div>
                                <AdminBadge tone="default">Arena Access</AdminBadge>
                                <h2 className="mt-5 font-atsanee text-5xl font-black uppercase italic text-gold">
                                    Sign In
                                </h2>
                                <p className="mt-3 text-sm font-medium text-admin-muted">
                                    Authenticate with an approved admin account to enter the control room.
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm font-semibold text-rose-100"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div className="group relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-admin-muted transition-colors group-focus-within:text-admin-cyan">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="admin-input w-full rounded-[1.5rem] px-5 py-4 pl-12 text-base font-semibold placeholder:text-admin-muted/60"
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="group relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-admin-muted transition-colors group-focus-within:text-admin-cyan">
                                        <Key className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="admin-input w-full rounded-[1.5rem] px-5 py-4 pl-12 text-base font-semibold placeholder:text-admin-muted/60"
                                        placeholder="Password"
                                    />
                                </div>
                            </div>

                            <motion.button
                                disabled={loading}
                                type="submit"
                                className="group relative w-full overflow-hidden rounded-full"
                                whileHover={{ scale: loading ? 1 : 1.015 }}
                                whileTap={{ scale: loading ? 1 : 0.985 }}
                            >
                                <div className="absolute inset-0 bg-shiny" />
                                <div className="absolute inset-[1px] rounded-full bg-[#03112b]" />
                                <div className="relative flex items-center justify-center gap-3 px-6 py-4 font-atsanee text-2xl font-black uppercase italic text-gold">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                                    Sign In with Email
                                </div>
                            </motion.button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.32em]">
                                    <span className="bg-[#04112d] px-4 text-admin-muted">Or continue with</span>
                                </div>
                            </div>

                            <motion.button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="admin-input flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-bold text-white/90 disabled:opacity-60"
                                whileHover={{ scale: loading ? 1 : 1.015 }}
                                whileTap={{ scale: loading ? 1 : 0.985 }}
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign In with Google
                            </motion.button>
                        </form>
                    </section>
                </div>
            </motion.div>

            <div className="absolute bottom-6 text-[10px] font-black uppercase tracking-[0.32em] text-admin-muted">
                SIMPIC 2026 Admin Panel
            </div>
        </div>
    );
}
