"use client";

import { useStandingsSync } from "@/lib/hooks/useStandingsSync";
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
            <div className="flex items-center justify-center min-h-screen bg-[#060914]">
                <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
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
