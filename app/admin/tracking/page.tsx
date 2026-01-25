"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/lib/types";
import { motion } from "framer-motion";
import { Activity, Wifi, WifiOff, Clock, Laptop, ShieldCheck } from "lucide-react";

type Presence = {
    teamId: string;
    lastSeen: number;
    userAgent: string;
    connected: boolean;
};

export default function TrackingPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [presence, setPresence] = useState<Record<string, Presence>>({});
    const [now, setNow] = useState(Date.now());

    // Sync Teams
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snap) => {
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
        });
        return () => unsub();
    }, []);

    // Sync Presence
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "presence"),
            (snap) => {
                const p: Record<string, Presence> = {};
                snap.docs.forEach(d => {
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

    // Live Timer
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatus = (lastSeen?: number) => {
        if (!lastSeen) return "offline";
        const diff = now - lastSeen;
        if (diff < 60000) return "online"; // < 1 min
        if (diff < 300000) return "idle"; // < 5 min
        return "offline";
    };

    const formatTimeAgo = (ts?: number) => {
        if (!ts) return "Never";
        const diff = Math.floor((now - ts) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const humanTeams = teams.filter(t => !t.isBot);

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-foreground via-foreground to-amber-500 bg-clip-text text-transparent italic tracking-tight uppercase">
                        Live Tracking
                    </h1>
                    <p className="text-muted mt-2 text-lg font-medium">Real-time connection monitoring</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <div>
                            <span className="text-xl font-black text-foreground">
                                {humanTeams.filter(t => getStatus(presence[t.id]?.lastSeen) === "online").length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 ml-2">Online</span>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                        <WifiOff className="w-5 h-5 text-red-600 dark:text-red-500" />
                        <div>
                            <span className="text-xl font-black text-foreground">
                                {humanTeams.filter(t => getStatus(presence[t.id]?.lastSeen) === "offline").length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-500 ml-2">Offline</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {humanTeams.map((team, idx) => {
                    const p = presence[team.id];
                    const status = getStatus(p?.lastSeen);

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-surface-bg border border-surface-border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-6 flex-1">
                                <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : status === 'idle' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
                                    <p className="text-xs text-muted/60 uppercase tracking-widest font-bold">Group {team.group}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 md:gap-12 flex-1 justify-end">
                                <div className="flex items-center gap-3 text-muted">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-medium tabular-nums">{formatTimeAgo(p?.lastSeen)}</span>
                                </div>

                                <div className="flex items-center gap-3 text-muted max-w-[200px] hidden md:flex">
                                    <Laptop className="w-4 h-4" />
                                    <span className="text-xs break-words" title={p?.userAgent || "Unknown"}>
                                        {p?.userAgent ? (p.userAgent.includes("Windows") ? "Windows" : p.userAgent.includes("Mac") ? "Mac" : p.userAgent.includes("iPhone") ? "iPhone" : "Device") : "Unknown"}
                                    </span>
                                </div>

                                <div className="bg-surface-bg border border-surface-border px-4 py-2 rounded-xl min-w-[100px] text-center">
                                    <div className="text-[10px] uppercase font-bold text-muted/60">Score</div>
                                    <div className="text-xl font-black text-foreground tabular-nums">{team.score}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
