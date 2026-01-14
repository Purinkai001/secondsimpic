"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useServerTime() {
    const [offset, setOffset] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncTime = async () => {
            try {
                const start = Date.now();
                const res = await fetch("/api/time");
                if (!res.ok) throw new Error("Failed to fetch time");
                const data = await res.json();
                const end = Date.now();
                const latency = (end - start) / 2;
                const serverTime = data.time + latency;
                setOffset(serverTime - end);
                setLoading(false);
            } catch (err) {
                console.error("Failed to sync server time:", err);
                // Fallback to 0 offset (local time)
                setLoading(false);
            }
        };

        syncTime();
        // Resync every minute? Maybe overkill. Once is usually enough for a session unless clock drifts significantly.
    }, []);

    const now = useCallback(() => {
        return Date.now() + offset;
    }, [offset]);

    return { now, offset, loading };
}
