"use client";

import { useCallback, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    onDisconnect,
    onValue,
    ref,
    update,
    serverTimestamp,
    Unsubscribe,
    DatabaseReference,
} from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import {
    GameState,
    LocationPermissionState,
    TrackingRoute,
    TrackingScreen,
    TrackingSession,
} from "@/lib/types";
import {
    TRACKING_HEARTBEAT_INTERVAL_MS,
    deriveAnswerActivityState,
    deriveTrackingScreen,
    getTrackingRoute,
    roundCoordinates,
} from "@/lib/tracking/utils";

type UseContestantTrackingParams = {
    loading: boolean;
    teamId?: string;
    teamStatus?: "active" | "eliminated" | "winner";
    inSuddenDeath?: boolean;
    gameState: GameState;
    submitted: boolean;
    mcqAnswer: number | null;
    mtfAnswers: (boolean | null)[];
    textAnswer: string;
};

function createSessionId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionStorageKey(teamId: string) {
    return `medical_quiz_tracking_session_id:${teamId}`;
}

export function useContestantTracking({
    loading,
    teamId,
    teamStatus,
    inSuddenDeath,
    gameState,
    submitted,
    mcqAnswer,
    mtfAnswers,
    textAnswer,
}: UseContestantTrackingParams) {
    const sessionRef = useRef<DatabaseReference | null>(null);
    const trackingStateRef = useRef<Partial<TrackingSession>>({});
    const currentUidRef = useRef<string | null>(auth.currentUser?.uid ?? null);

    const writeTrackingState = useCallback(async (patch: Partial<TrackingSession>, markEvent = true) => {
        if (!sessionRef.current || !teamId) {
            return;
        }

        const now = Date.now();
        const nextState: Partial<TrackingSession> = {
            ...trackingStateRef.current,
            ...patch,
        };

        trackingStateRef.current = nextState;

        try {
            await update(sessionRef.current, {
                ...nextState,
                teamId,
                uid: currentUidRef.current,
                lastHeartbeatAt: patch.lastHeartbeatAt ?? now,
                ...(markEvent ? { lastEventAt: now } : {}),
            });
        } catch (error) {
            console.error("Tracking update failed:", error);
        }
    }, [teamId]);

    const disconnectTracking = useCallback(async () => {
        if (!sessionRef.current) {
            return;
        }

        try {
            await update(sessionRef.current, {
                connected: false,
                networkOnline: false,
                lastHeartbeatAt: Date.now(),
                lastEventAt: Date.now(),
            });
        } catch (error) {
            console.error("Tracking disconnect failed:", error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            currentUidRef.current = user?.uid ?? null;

            if (!user?.uid || !sessionRef.current) {
                return;
            }

            void onDisconnect(sessionRef.current).update({
                connected: false,
                networkOnline: false,
                lastHeartbeatAt: serverTimestamp(),
                lastEventAt: serverTimestamp(),
            });

            void update(sessionRef.current, {
                ...trackingStateRef.current,
                uid: user.uid,
                connected: true,
                lastHeartbeatAt: Date.now(),
                lastEventAt: Date.now(),
            });
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!teamId || typeof window === "undefined") {
            return;
        }

        const storageKey = getSessionStorageKey(teamId);
        const existingSessionId = sessionStorage.getItem(storageKey);
        const sessionId = existingSessionId || createSessionId();
        sessionStorage.setItem(storageKey, sessionId);

        sessionRef.current = ref(rtdb, `presence/${teamId}/sessions/${sessionId}`);

        const baseState: Partial<TrackingSession> = {
            sessionId,
            teamId,
            uid: currentUidRef.current,
            connected: false,
            route: getTrackingRoute(window.location.pathname),
            screen: "loading",
            gameState: null,
            answerState: "idle",
            visibilityState: document.visibilityState === "hidden" ? "hidden" : "visible",
            windowFocused: document.hasFocus(),
            networkOnline: navigator.onLine,
            userAgent: navigator.userAgent,
            platform: navigator.platform || "Unknown",
            locationPermission: "prompt",
            coordsRounded: null,
            accuracyMeters: null,
            locationUpdatedAt: null,
        };

        trackingStateRef.current = baseState;

        let heartbeatId: ReturnType<typeof setInterval> | null = null;
        let geolocationWatchId: number | null = null;
        let permissionStatus: PermissionStatus | null = null;
        let connectionUnsubscribe: Unsubscribe | null = null;

        const startGeolocation = () => {
            if (!navigator.geolocation) {
                void writeTrackingState({
                    locationPermission: "unavailable",
                    coordsRounded: null,
                    accuracyMeters: null,
                    locationUpdatedAt: null,
                });
                return;
            }

            geolocationWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    void writeTrackingState({
                        locationPermission: "granted",
                        coordsRounded: roundCoordinates(position.coords.latitude, position.coords.longitude),
                        accuracyMeters: Math.round(position.coords.accuracy),
                        locationUpdatedAt: Date.now(),
                    });
                },
                (error) => {
                    let permission: LocationPermissionState = "unavailable";
                    if (error.code === error.PERMISSION_DENIED) {
                        permission = "denied";
                    } else if (error.code === error.TIMEOUT) {
                        permission = trackingStateRef.current.locationPermission || "prompt";
                    }

                    void writeTrackingState({
                        locationPermission: permission,
                        coordsRounded: permission === "granted" ? trackingStateRef.current.coordsRounded || null : null,
                        accuracyMeters: permission === "granted" ? trackingStateRef.current.accuracyMeters || null : null,
                        locationUpdatedAt: permission === "granted" ? trackingStateRef.current.locationUpdatedAt || null : null,
                    });
                },
                {
                    enableHighAccuracy: false,
                    maximumAge: 30000,
                    timeout: 15000,
                }
            );
        };

        const syncPermissionState = async () => {
            if (!navigator.geolocation) {
                await writeTrackingState({ locationPermission: "unavailable" });
                return;
            }

            if (!navigator.permissions?.query) {
                startGeolocation();
                return;
            }

            try {
                permissionStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
                await writeTrackingState({ locationPermission: permissionStatus.state as LocationPermissionState });
                permissionStatus.onchange = () => {
                    const nextPermission = permissionStatus?.state as LocationPermissionState;
                    void writeTrackingState({
                        locationPermission: nextPermission,
                        ...(nextPermission === "denied"
                            ? {
                                coordsRounded: null,
                                accuracyMeters: null,
                                locationUpdatedAt: null,
                            }
                            : {}),
                    });
                };
                startGeolocation();
            } catch (error) {
                console.error("Permission query failed:", error);
                startGeolocation();
            }
        };

        const handleConnectionState = async (connected: boolean) => {
            if (!sessionRef.current) {
                return;
            }

            if (!connected) {
                return;
            }

            try {
                await onDisconnect(sessionRef.current).update({
                    connected: false,
                    networkOnline: false,
                    lastHeartbeatAt: serverTimestamp(),
                    lastEventAt: serverTimestamp(),
                });

                await update(sessionRef.current, {
                    ...trackingStateRef.current,
                    uid: currentUidRef.current,
                    teamId,
                    connected: true,
                    connectedAt: serverTimestamp(),
                    lastHeartbeatAt: Date.now(),
                    lastEventAt: Date.now(),
                });
            } catch (error) {
                console.error("Failed to initialize tracking session:", error);
            }
        };

        connectionUnsubscribe = onValue(ref(rtdb, ".info/connected"), (snapshot) => {
            void handleConnectionState(snapshot.val() === true);
        });

        void syncPermissionState();

        const updateVisibility = () => {
            void writeTrackingState({
                visibilityState: document.visibilityState === "hidden" ? "hidden" : "visible",
                windowFocused: document.hasFocus(),
                networkOnline: navigator.onLine,
                route: getTrackingRoute(window.location.pathname),
            });
        };

        const handleFocus = () => {
            void writeTrackingState({ windowFocused: true });
        };

        const handleBlur = () => {
            void writeTrackingState({ windowFocused: false });
        };

        const handleOnline = () => {
            void writeTrackingState({ networkOnline: true });
        };

        const handleOffline = () => {
            void writeTrackingState({ networkOnline: false });
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", updateVisibility);

        heartbeatId = setInterval(() => {
            void writeTrackingState({
                connected: true,
                networkOnline: navigator.onLine,
                route: getTrackingRoute(window.location.pathname),
                lastHeartbeatAt: Date.now(),
            }, false);
        }, TRACKING_HEARTBEAT_INTERVAL_MS);

        return () => {
            if (heartbeatId) {
                clearInterval(heartbeatId);
            }
            if (geolocationWatchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(geolocationWatchId);
            }
            if (permissionStatus) {
                permissionStatus.onchange = null;
            }
            if (connectionUnsubscribe) {
                connectionUnsubscribe();
            }
            document.removeEventListener("visibilitychange", updateVisibility);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            void disconnectTracking();
            sessionRef.current = null;
        };
    }, [disconnectTracking, teamId, writeTrackingState]);

    useEffect(() => {
        if (!teamId || typeof window === "undefined") {
            return;
        }

        const screen: TrackingScreen = deriveTrackingScreen({
            loading,
            teamStatus,
            inSuddenDeath,
            gameState,
            submitted,
        });
        const answerState = deriveAnswerActivityState({
            gameState,
            submitted,
            mcqAnswer,
            mtfAnswers,
            textAnswer,
        });
        const route: TrackingRoute = getTrackingRoute(window.location.pathname);

        void writeTrackingState({
            route,
            screen,
            gameState,
            answerState,
        });
    }, [
        gameState,
        inSuddenDeath,
        loading,
        mcqAnswer,
        mtfAnswers,
        submitted,
        teamId,
        teamStatus,
        textAnswer,
        writeTrackingState,
    ]);

    return { disconnectTracking };
}
