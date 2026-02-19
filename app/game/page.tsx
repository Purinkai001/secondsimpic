"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useGameRoom } from "@/lib/game/hooks/useGameRoom";
import {
    TeamHeader,
    GameFooter,
    LobbyView,
    CountdownView,
    PlayingView,
    AnswerRevealView,
    WaitingGradingView
} from "@/components/game";
import { SettingsModal, WinnerCelebration, SuddenDeathAlert } from "@/components/game";
import { PreloadImages } from "@/components/game/PreloadImages";
import { BackgroundDecoration } from "@/components/ui/BackgroundDecoration";

export default function GamePage() {
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);

    const {
        loading, team, currentQuestion, allTeams, roundQuestions,
        mcqAnswer, setMcqAnswer, mtfAnswers, setMtfAnswers, textAnswer, setTextAnswer,
        gameState, timeLeft, countdownSeconds, answerRevealCountdown, timeSpent,
        submitted, submitting, lastResult,
        handleSubmit, handleChallenge, handleLogout, handleRename
    } = useGameRoom();

    const preloadUrls = useMemo(() => {
        return roundQuestions
            .map(q => q.imageUrl)
            .filter((url): url is string => !!url);
    }, [roundQuestions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300">
                <div className="relative">
                    <div className="absolute inset-0 bg-accent-blue blur-2xl opacity-20 animate-pulse" />
                    <Loader2 className="w-12 h-12 animate-spin text-accent-blue relative z-10" />
                </div>
            </div>
        );
    }

    if (team?.status === "eliminated") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-auto relative transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-bg backdrop-blur-2xl border border-red-500/20 p-12 rounded-[3rem] max-w-lg text-center shadow-2xl relative z-10"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <span className="text-4xl font-black text-red-500">!</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground mb-4 italic tracking-tighter">ELIMINATED</h1>
                    <p className="text-muted text-lg mb-8 leading-relaxed">
                        The competition has reached its limit for your team. Thank you for your exceptional participation, <strong>{team.name}</strong>.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-8 py-3 bg-surface-bg hover:bg-surface-bg/80 border border-surface-border rounded-2xl text-muted hover:text-foreground transition-all text-sm font-bold uppercase tracking-widest"
                    >
                        Return to Hub
                    </button>
                </motion.div>
            </div>
        );
    }

    // Winner detection
    const activeTeams = allTeams.filter(t => t.status === "active");
    // Explicit winner status ONLY - preventing random congratulations
    const isWinner = team?.status === "winner";

    if (isWinner && team) {
        const finalists = team.status === "winner" ? allTeams.filter(t => t.status === "winner") : activeTeams;
        const rankedFinalists = finalists.sort((a, b) => (b.score || 0) - (a.score || 0));
        const rank = rankedFinalists.findIndex(t => t.id === team.id) + 1;
        return <WinnerCelebration team={team} rank={rank || 1} />;
    }

    if (team?.inSuddenDeath) {
        const tiedTeams = allTeams.filter(t => t.inSuddenDeath);
        return <SuddenDeathAlert team={team} tiedTeams={tiedTeams} />;
    }

    return (
        <div className="min-h-[100dvh] bg-background text-foreground flex flex-col p-4 md:p-8 overflow-x-auto relative transition-colors duration-300">
            {/* Background decorative elements */}
            <BackgroundDecoration />

            <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col min-h-full">
                <TeamHeader
                    team={team}
                    onLogout={handleLogout}
                    onRename={() => setShowSettings(true)}
                />

                <main className="flex-1 flex flex-col items-center justify-center py-8">
                    <AnimatePresence mode="wait">
                        {gameState === "waiting" && (
                            <LobbyView key="lobby" allTeams={allTeams} team={team} />
                        )}

                        {gameState === "countdown" && (
                            <CountdownView key="countdown" seconds={countdownSeconds} />
                        )}

                        {gameState === "playing" && (
                            <PlayingView
                                key="playing"
                                question={currentQuestion}
                                timeLeft={timeLeft}
                                timeSpent={timeSpent}
                                mcqAnswer={mcqAnswer}
                                setMcqAnswer={setMcqAnswer}
                                mtfAnswers={mtfAnswers}
                                setMtfAnswers={setMtfAnswers}
                                textAnswer={textAnswer}
                                setTextAnswer={setTextAnswer}
                                submitted={submitted}
                                submitting={submitting}
                                onSubmit={() => handleSubmit()}
                            />
                        )}

                        {gameState === "answer_reveal" && (
                            <AnswerRevealView
                                key="reveal"
                                result={lastResult}
                                countdown={answerRevealCountdown}
                                onChallenge={handleChallenge}
                            />
                        )}

                        {gameState === "waiting_grading" && (
                            <WaitingGradingView
                                key="grading"
                                result={lastResult}
                                timeLeft={timeLeft}
                                question={currentQuestion}
                            />
                        )}
                    </AnimatePresence>
                </main>

                <GameFooter />
                <PreloadImages images={preloadUrls} />
            </div>

            {showSettings && team && (
                <SettingsModal
                    team={team}
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onRename={handleRename}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}
