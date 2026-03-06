"use client";

import { useStandingsSync } from "@/lib/admin/hooks/useStandingsSync";
import { ArenaView } from "@/components/admin/ArenaView";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function StandingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        loading,
        currentRound,
        currentQuestion,
        gameState,
        timeLeft,
        countdownSeconds,
        answerRevealCountdown,
        allTeams
    } = useStandingsSync();

    const isFullscreen = searchParams.get("fullscreen") === "true";

    const toggleFullscreen = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (isFullscreen) {
            params.delete("fullscreen");
        } else {
            params.set("fullscreen", "true");
        }
        router.push(`/admin/standings?${params.toString()}`);
    }, [isFullscreen, router, searchParams]);

    if (loading) {
        return (
            <div className="admin-shell flex min-h-screen items-center justify-center bg-[#020817]">
                <div className="h-20 w-20 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
            </div>
        );
    }

    return (
        <ArenaView
            teams={allTeams}
            activeRound={currentRound}
            activeQuestion={currentQuestion}
            gameState={gameState}
            timeLeft={timeLeft}
            countdown={gameState === 'countdown' ? countdownSeconds : answerRevealCountdown}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
        />
    );
}

