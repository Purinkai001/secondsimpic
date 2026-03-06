"use client";

import { Team, Question, Round, SubmissionResult } from "@/lib/types";
import { GameState } from "@/lib/game/types/game";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { LobbyView, CountdownView, PlayingView, AnswerRevealView, WaitingGradingView } from "@/components/game";
import BgSVG from "@/vectors/bgsvg";
import TlCorner from "@/vectors/TlCorner";
import BrCorner from "@/vectors/BrCorner";

interface ArenaViewProps {
    teams: Team[];
    activeRound: Round | null;
    activeQuestion: Question | null;
    gameState: GameState;
    timeLeft: number | null;
    countdown: number;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

export function ArenaView({
    teams, activeQuestion, gameState, timeLeft, countdown, isFullscreen, onToggleFullscreen,
}: ArenaViewProps) {
    const spectatorResult: SubmissionResult = {
        isCorrect: true,
        points: 0,
        streak: 0,
        message: "Verification Phase",
        imageUrl: activeQuestion?.imageUrl,
        questionText: activeQuestion?.text || "",
        correctAnswer: activeQuestion?.type === "mcq"
            ? {
                type: "mcq",
                correctChoiceIndex: activeQuestion.correctChoiceIndex,
                correctChoiceIndices: activeQuestion.correctChoiceIndices,
                choices: activeQuestion.choices,
            }
            : activeQuestion?.type === "mtf"
                ? {
                    type: "mtf",
                    statements: activeQuestion.statements?.map((statement) => ({
                        text: statement.text,
                        isTrue: statement.isTrue ?? false,
                    })),
                }
                : undefined,
    };

    return (
        <div
            className={cn(
                "admin-shell relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020817] p-4 text-white md:p-8",
                isFullscreen ? "fixed inset-0 z-[100]" : ""
            )}
        >
            <div className="admin-grid absolute inset-0 opacity-[0.12]" />
            <div className="pointer-events-none absolute inset-0 opacity-25">
                <BgSVG className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" />
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[#61d8f5]/10 blur-[130px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#d9b76d]/12 blur-[160px]" />
            <div className="pointer-events-none absolute left-5 top-5 opacity-25">
                <TlCorner className="h-36 w-36" />
            </div>
            <div className="pointer-events-none absolute bottom-5 right-5 opacity-22">
                <BrCorner className="h-32 w-32" />
            </div>

            <div className="fixed left-4 right-4 top-4 z-[110] flex items-start justify-between md:left-8 md:right-8 md:top-8">
                <div className="pointer-events-none">
                    <div className="rounded-full border border-gold/15 bg-gold/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-admin-muted">
                        Spectator Arena
                    </div>
                    {isFullscreen && (
                        <h2 className="mt-3 font-atsanee text-4xl font-black uppercase italic text-gold">
                            SIMPIC Standings
                        </h2>
                    )}
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={onToggleFullscreen}
                        className="rounded-full border border-white/10 bg-[#03112c]/70 p-3 text-white/70 shadow-2xl backdrop-blur-xl transition-all hover:border-gold/20 hover:text-gold"
                    >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <main className="relative z-10 flex w-full flex-col items-center justify-center pt-20">
                <AnimatePresence mode="wait">
                    {gameState === "waiting" && (
                        <LobbyView key="lobby" allTeams={teams} team={null} />
                    )}

                    {gameState === "countdown" && (
                        <CountdownView key="countdown" seconds={countdown} />
                    )}

                    {gameState === "playing" && (
                        <PlayingView
                            key="playing"
                            question={activeQuestion}
                            timeLeft={timeLeft}
                            timeSpent={0}
                            mcqAnswer={null}
                            setMcqAnswer={() => { }}
                            mtfAnswers={new Array(activeQuestion?.statements?.length || 0).fill(false)}
                            setMtfAnswers={() => { }}
                            textAnswer=""
                            setTextAnswer={() => { }}
                            submitted={true}
                            submitting={false}
                            onSubmit={() => { }}
                        />
                    )}

                    {gameState === "answer_reveal" && (
                        <AnswerRevealView
                            key="reveal"
                            question={activeQuestion}
                            result={spectatorResult}
                            countdown={countdown}
                            onChallenge={() => { }}
                        />
                    )}

                    {gameState === "waiting_grading" && (
                        <WaitingGradingView
                            key="grading"
                            result={null}
                            timeLeft={timeLeft}
                            question={activeQuestion}
                        />
                    )}
                </AnimatePresence>
            </main>

            {!isFullscreen && (
                <div className="pointer-events-none fixed bottom-8 left-0 right-0 flex items-center justify-center px-6 text-[10px] font-black uppercase tracking-[0.4em] text-admin-muted">
                    <div className="flex items-center gap-3 rounded-full border border-white/8 bg-[#03112c]/60 px-5 py-3 backdrop-blur-xl">
                        <div className="h-2 w-2 rounded-full bg-admin-cyan shadow-[0_0_14px_rgba(124,232,239,0.7)]" />
                        Spectator View Active Feed Sync
                    </div>
                </div>
            )}
        </div>
    );
}
