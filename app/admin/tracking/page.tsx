"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { motion } from "framer-motion";
import {
    Activity,
    Clock,
    Eye,
    Laptop,
    MapPin,
    TriangleAlert,
    Users,
    Wifi,
    WifiOff,
} from "lucide-react";
import { rtdb } from "@/lib/firebase";
import { useTeams } from "@/lib/hooks/useTeams";
import { TrackingSession, TrackingStatus } from "@/lib/types";
import { AdminBadge, AdminPageHeader } from "@/components/admin/AdminPrimitives";
import {
    aggregateTrackingTeam,
    formatApproxLocation,
    formatDeviceLabel,
    formatTimeAgo,
    getTrackingStatus,
} from "@/lib/tracking/utils";

type PresenceTree = Record<string, { sessions?: Record<string, Partial<TrackingSession>> }>;

const STATUS_STYLES: Record<TrackingStatus, string> = {
    online: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]",
    idle: "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.65)]",
    offline: "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.55)]",
};

const STATUS_TONES: Record<TrackingStatus, "success" | "warning" | "danger"> = {
    online: "success",
    idle: "warning",
    offline: "danger",
};

export default function TrackingPage() {
    const teams = useTeams("name");
    const [presence, setPresence] = useState<Record<string, Record<string, Partial<TrackingSession>>>>({});
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const unsubscribe = onValue(
            ref(rtdb, "presence"),
            (snapshot) => {
                const value = (snapshot.val() || {}) as PresenceTree;
                const nextPresence: Record<string, Record<string, Partial<TrackingSession>>> = {};

                Object.entries(value).forEach(([teamId, teamPresence]) => {
                    nextPresence[teamId] = teamPresence.sessions || {};
                });

                setPresence(nextPresence);
            },
            (error) => {
                console.error("Presence sync error:", error);
            }
        );

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(intervalId);
    }, []);

    const humanTeams = useMemo(() => teams.filter((team) => !team.isBot), [teams]);
    const trackingRows = useMemo(() => {
        return humanTeams
            .map((team) => ({
                team,
                tracking: aggregateTrackingTeam(team.id, presence[team.id], now),
            }))
            .sort((left, right) => {
                const statusOrder = { online: 0, idle: 1, offline: 2 };
                const leftRank = statusOrder[left.tracking.status];
                const rightRank = statusOrder[right.tracking.status];

                if (leftRank !== rightRank) {
                    return leftRank - rightRank;
                }

                if (left.tracking.hasDuplicateSessions !== right.tracking.hasDuplicateSessions) {
                    return left.tracking.hasDuplicateSessions ? -1 : 1;
                }

                return left.team.name.localeCompare(right.team.name);
            });
    }, [humanTeams, now, presence]);

    const onlineCount = trackingRows.filter(({ tracking }) => tracking.status === "online").length;
    const idleCount = trackingRows.filter(({ tracking }) => tracking.status === "idle").length;
    const offlineCount = trackingRows.filter(({ tracking }) => tracking.status === "offline").length;
    const duplicateCount = trackingRows.filter(({ tracking }) => tracking.hasDuplicateSessions).length;
    const missingLocationCount = trackingRows.filter(({ tracking }) => tracking.missingLocationWarning).length;

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Presence Feed"
                title="Live Tracking"
                description="Contestant session telemetry aggregated from real-time per-device presence, app state, and coarse GPS signals."
                status={
                    <div className="flex flex-wrap gap-3">
                        <AdminBadge tone="success"><Wifi className="h-3 w-3" />{onlineCount} Online</AdminBadge>
                        <AdminBadge tone="warning"><Eye className="h-3 w-3" />{idleCount} Idle</AdminBadge>
                        <AdminBadge tone="danger"><WifiOff className="h-3 w-3" />{offlineCount} Offline</AdminBadge>
                        <AdminBadge tone="warning"><Users className="h-3 w-3" />{duplicateCount} Duplicate Teams</AdminBadge>
                        <AdminBadge tone="danger"><TriangleAlert className="h-3 w-3" />{missingLocationCount} Missing Location</AdminBadge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4">
                {trackingRows.map(({ team, tracking }, idx) => {
                    const primarySession = tracking.primarySession;
                    const status = tracking.status;
                    const coords = primarySession?.coordsRounded;

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="admin-panel rounded-[2rem] p-5"
                        >
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex items-start gap-5">
                                        <div className={`mt-2 h-4 w-4 rounded-full ${STATUS_STYLES[status]}`} />
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="font-atsanee text-3xl font-black uppercase italic text-gold">{team.name}</h3>
                                                <AdminBadge tone={STATUS_TONES[status]}>{status}</AdminBadge>
                                                {tracking.hasDuplicateSessions && (
                                                    <AdminBadge tone="warning">
                                                        <Users className="h-3 w-3" />
                                                        {tracking.activeSessionCount} Active Logins
                                                    </AdminBadge>
                                                )}
                                                {tracking.missingLocationWarning && (
                                                    <AdminBadge tone="danger">
                                                        <TriangleAlert className="h-3 w-3" />
                                                        GPS Warning
                                                    </AdminBadge>
                                                )}
                                            </div>
                                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                                Group {team.group} | Score {team.score}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[720px] xl:grid-cols-3">
                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <Clock className="h-4 w-4 text-admin-cyan" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Last Heartbeat</span>
                                            </div>
                                            <p className="text-lg font-black text-white/90 tabular-nums">
                                                {formatTimeAgo(tracking.freshestHeartbeatAt, now)}
                                            </p>
                                        </div>

                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <Users className="h-4 w-4 text-gold/70" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Active Sessions</span>
                                            </div>
                                            <p className="font-atsanee text-3xl font-black italic text-gold tabular-nums">{tracking.activeSessionCount}</p>
                                        </div>

                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <Activity className="h-4 w-4 text-admin-cyan" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Screen / State</span>
                                            </div>
                                            <p className="text-sm font-semibold uppercase text-white/90">
                                                {primarySession?.screen?.replace(/_/g, " ") || "unknown"}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-admin-muted">
                                                {primarySession?.gameState || "no phase"} | {primarySession?.answerState?.replace(/_/g, " ") || "idle"}
                                            </p>
                                        </div>

                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <Laptop className="h-4 w-4 text-gold/70" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Device</span>
                                            </div>
                                            <p className="text-sm font-semibold text-white/85">
                                                {formatDeviceLabel(primarySession)}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-admin-muted">
                                                {primarySession?.visibilityState || "unknown"} | {primarySession?.windowFocused ? "focused" : "blurred"}
                                            </p>
                                        </div>

                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <MapPin className="h-4 w-4 text-admin-cyan" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Approx. Location</span>
                                            </div>
                                            <p className="text-sm font-semibold text-white/85">
                                                {coords ? `${coords.lat}, ${coords.lng}` : "Unavailable"}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-admin-muted">
                                                {primarySession?.locationPermission || "unavailable"}
                                                {primarySession?.accuracyMeters ? ` | +/- ${primarySession.accuracyMeters}m` : ""}
                                            </p>
                                        </div>

                                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                            <div className="mb-2 flex items-center gap-2 text-admin-muted">
                                                <Eye className="h-4 w-4 text-gold/70" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em]">Route / Network</span>
                                            </div>
                                            <p className="text-sm font-semibold text-white/85">
                                                {primarySession?.route || "unknown"}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-admin-muted">
                                                {primarySession?.networkOnline ? "browser online" : "browser offline"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {tracking.allSessions.length > 0 && (
                                    <div className="rounded-[1.75rem] border border-white/8 bg-black/15 px-4 py-4">
                                        <div className="mb-3 flex items-center gap-2 text-admin-muted">
                                            <Users className="h-4 w-4 text-admin-cyan" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.24em]">All Session Logins</span>
                                        </div>
                                        <div className="grid gap-3 lg:grid-cols-2">
                                            {tracking.allSessions.map((session) => {
                                                const sessionStatus = getTrackingStatus(session, now);

                                                return (
                                                    <div
                                                        key={session.sessionId}
                                                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <AdminBadge tone={STATUS_TONES[sessionStatus]}>{sessionStatus}</AdminBadge>
                                                            <span className="text-sm font-semibold text-white/85">
                                                                {formatDeviceLabel(session)}
                                                            </span>
                                                            <span className="text-xs font-semibold uppercase text-admin-muted">
                                                                {session.screen.replace(/_/g, " ")}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                            <p className="text-xs font-semibold text-admin-muted">
                                                                Last heartbeat: <span className="text-white/85">{formatTimeAgo(session.lastHeartbeatAt, now)}</span>
                                                            </p>
                                                            <p className="text-xs font-semibold text-admin-muted">
                                                                Approx. location: <span className="text-white/85">{formatApproxLocation(session)}</span>
                                                            </p>
                                                            <p className="text-xs font-semibold text-admin-muted">
                                                                GPS: <span className="text-white/85">{session.locationPermission}</span>
                                                            </p>
                                                            <p className="text-xs font-semibold text-admin-muted">
                                                                Accuracy: <span className="text-white/85">{session.accuracyMeters ? `+/- ${session.accuracyMeters}m` : "Unknown"}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
