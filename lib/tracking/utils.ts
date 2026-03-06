import {
    AnswerActivityState,
    GameState,
    TrackingCoordsRounded,
    TrackingRoute,
    TrackingScreen,
    TrackingSession,
    TrackingStatus,
    TrackingTeamSnapshot,
} from "@/lib/types";

export const TRACKING_HEARTBEAT_INTERVAL_MS = 15000;
export const TRACKING_FRESHNESS_THRESHOLD_MS = 45000;
export const TRACKING_LOCATION_STALE_THRESHOLD_MS = 120000;

const COORD_PRECISION = 3;

type ScreenParams = {
    loading: boolean;
    teamStatus?: "active" | "eliminated" | "winner";
    inSuddenDeath?: boolean;
    gameState: GameState;
    submitted: boolean;
};

type AnswerStateParams = {
    gameState: GameState;
    submitted: boolean;
    mcqAnswer: number | null;
    mtfAnswers: (boolean | null)[];
    textAnswer: string;
};

export function getTrackingRoute(pathname: string | null | undefined): TrackingRoute {
    return pathname === "/" ? "/" : "/game";
}

export function roundCoordinates(latitude: number, longitude: number): TrackingCoordsRounded {
    return {
        lat: Number(latitude.toFixed(COORD_PRECISION)),
        lng: Number(longitude.toFixed(COORD_PRECISION)),
    };
}

export function deriveTrackingScreen({
    loading,
    teamStatus,
    inSuddenDeath,
    gameState,
    submitted,
}: ScreenParams): TrackingScreen {
    if (loading) return "loading";
    if (teamStatus === "eliminated") return "eliminated";
    if (teamStatus === "winner") return "winner";
    if (inSuddenDeath) return "sudden_death";
    if (submitted && gameState === "waiting_grading") return "submitted";
    if (gameState === "waiting") return "lobby";
    return gameState;
}

export function deriveAnswerActivityState({
    gameState,
    submitted,
    mcqAnswer,
    mtfAnswers,
    textAnswer,
}: AnswerStateParams): AnswerActivityState {
    if (submitted && gameState === "answer_reveal") {
        return "waiting_result";
    }

    if (submitted) {
        return "submitted";
    }

    const hasDraft =
        mcqAnswer !== null ||
        mtfAnswers.some((answer) => answer !== null) ||
        textAnswer.trim().length > 0;

    return hasDraft ? "answering" : "idle";
}

export function getTrackingStatus(session: TrackingSession | null | undefined, now: number): TrackingStatus {
    if (!session) return "offline";
    if (!session.connected || now - session.lastHeartbeatAt > TRACKING_FRESHNESS_THRESHOLD_MS) {
        return "offline";
    }

    if (session.visibilityState !== "visible" || !session.windowFocused || !session.networkOnline) {
        return "idle";
    }

    return "online";
}

export function aggregateTrackingTeam(
    teamId: string,
    rawSessions: Record<string, Partial<TrackingSession>> | null | undefined,
    now: number,
): TrackingTeamSnapshot {
    const allSessions = Object.entries(rawSessions || {})
        .map(([sessionId, value]) => {
            const route: TrackingRoute = value.route === "/" ? "/" : "/game";
            const visibilityState: "visible" | "hidden" = value.visibilityState === "hidden" ? "hidden" : "visible";

            return {
                sessionId,
                uid: typeof value.uid === "string" ? value.uid : null,
                teamId,
                connected: Boolean(value.connected),
                connectedAt: typeof value.connectedAt === "number" ? value.connectedAt : null,
                lastHeartbeatAt: typeof value.lastHeartbeatAt === "number" ? value.lastHeartbeatAt : 0,
                lastEventAt: typeof value.lastEventAt === "number" ? value.lastEventAt : 0,
                route,
                screen: value.screen || "loading",
                gameState: value.gameState || null,
                answerState: value.answerState || "idle",
                visibilityState,
                windowFocused: value.windowFocused !== false,
                networkOnline: value.networkOnline !== false,
                userAgent: typeof value.userAgent === "string" ? value.userAgent : "",
                platform: typeof value.platform === "string" ? value.platform : "",
                locationPermission: value.locationPermission || "unavailable",
                coordsRounded: value.coordsRounded &&
                    typeof value.coordsRounded.lat === "number" &&
                    typeof value.coordsRounded.lng === "number"
                    ? value.coordsRounded
                    : null,
                accuracyMeters: typeof value.accuracyMeters === "number" ? value.accuracyMeters : null,
                locationUpdatedAt: typeof value.locationUpdatedAt === "number" ? value.locationUpdatedAt : null,
            };
        })
        .sort((left, right) => right.lastHeartbeatAt - left.lastHeartbeatAt);

    const activeSessions = allSessions.filter((session) =>
        session.connected && now - session.lastHeartbeatAt <= TRACKING_FRESHNESS_THRESHOLD_MS
    );
    const primarySession = activeSessions[0] || allSessions[0] || null;
    const status = getTrackingStatus(primarySession, now);
    const missingLocationWarning = Boolean(
        primarySession &&
        status !== "offline" &&
        (
            primarySession.locationPermission !== "granted" ||
            !primarySession.coordsRounded ||
            !primarySession.locationUpdatedAt ||
            now - primarySession.locationUpdatedAt > TRACKING_LOCATION_STALE_THRESHOLD_MS
        )
    );

    return {
        teamId,
        status,
        activeSessionCount: activeSessions.length,
        hasDuplicateSessions: activeSessions.length > 1,
        missingLocationWarning,
        freshestHeartbeatAt: primarySession?.lastHeartbeatAt ?? null,
        primarySession,
        activeSessions,
        allSessions,
    };
}

export function formatDeviceLabel(session: TrackingSession | null | undefined): string {
    if (!session) return "Unknown";

    const source = `${session.platform} ${session.userAgent}`.toLowerCase();
    if (source.includes("iphone")) return "iPhone";
    if (source.includes("ipad")) return "iPad";
    if (source.includes("android")) return "Android";
    if (source.includes("windows")) return "Windows";
    if (source.includes("mac")) return "Mac";
    if (source.includes("linux")) return "Linux";
    return session.platform || "Device";
}

export function formatTimeAgo(timestamp: number | null | undefined, now: number): string {
    if (!timestamp) return "Never";

    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
}

export function formatApproxLocation(session: TrackingSession | null | undefined): string {
    if (!session?.coordsRounded) {
        return "Unavailable";
    }

    return `${session.coordsRounded.lat}, ${session.coordsRounded.lng}`;
}
