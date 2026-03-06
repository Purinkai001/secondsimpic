"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Wifi, WifiOff, Clock, Laptop, Activity } from "lucide-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { AdminBadge, AdminPageHeader } from "@/components/admin/AdminPrimitives";

type Presence = {
    teamId: string;
    lastSeen: number;
    userAgent: string;
    connected: boolean;
};

export default function TrackingPage() {
    const teams = useTeams();
    const [presence, setPresence] = useState<Record<string, Presence>>({});
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "presence"),
            (snap) => {
                const p: Record<string, Presence> = {};
                snap.docs.forEach((d) => {
                    p[d.id] = { teamId: d.id, ...d.data() } as Presence;
                });
                setPresence(p);
            },
            (err) => {
                console.error("Presence sync error:", err);
            }
        );
        return () => unsub();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatus = (lastSeen?: number) => {
        if (!lastSeen) return "offline";
        const diff = now - lastSeen;
        if (diff < 60000) return "online";
        if (diff < 300000) return "idle";
        return "offline";
    };

    const formatTimeAgo = (ts?: number) => {
        if (!ts) return "Never";
        const diff = Math.floor((now - ts) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const humanTeams = teams.filter((t) => !t.isBot);
    const onlineCount = humanTeams.filter((t) => getStatus(presence[t.id]?.lastSeen) === "online").length;
    const offlineCount = humanTeams.filter((t) => getStatus(presence[t.id]?.lastSeen) === "offline").length;

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Presence Feed"
                title="Live Tracking"
                description="Real-time connection monitoring for teams currently attached to the arena session."
                status={
                    <div className="flex flex-wrap gap-3">
                        <AdminBadge tone="success"><Wifi className="h-3 w-3" />{onlineCount} Online</AdminBadge>
                        <AdminBadge tone="danger"><WifiOff className="h-3 w-3" />{offlineCount} Offline</AdminBadge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4">
                {humanTeams.map((team, idx) => {
                    const p = presence[team.id];
                    const status = getStatus(p?.lastSeen);

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="admin-panel rounded-[2rem] p-5"
                        >
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`h-4 w-4 rounded-full ${status === "online" ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" : status === "idle" ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.6)]" : "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.55)]"}`} />
                                    <div>
                                        <h3 className="font-atsanee text-3xl font-black uppercase italic text-gold">{team.name}</h3>
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                            Group {team.group}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3 xl:min-w-[640px]">
                                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                        <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                            <Clock className="h-4 w-4 text-admin-cyan" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.24em]">Last Seen</span>
                                        </div>
                                        <p className="text-lg font-black text-white/90 tabular-nums">{formatTimeAgo(p?.lastSeen)}</p>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                        <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                            <Laptop className="h-4 w-4 text-gold/70" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.24em]">Device</span>
                                        </div>
                                        <p className="text-sm font-semibold text-white/85" title={p?.userAgent || "Unknown"}>
                                            {p?.userAgent ? (p.userAgent.includes("Windows") ? "Windows" : p.userAgent.includes("Mac") ? "Mac" : p.userAgent.includes("iPhone") ? "iPhone" : "Device") : "Unknown"}
                                        </p>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                        <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                            <Activity className="h-4 w-4 text-admin-cyan" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.24em]">Score</span>
                                        </div>
                                        <p className="font-atsanee text-3xl font-black italic text-gold tabular-nums">{team.score}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
