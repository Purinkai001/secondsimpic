"use client";

import { Team, Question, Round } from "@/lib/types";
import { GameState } from "@/lib/game/types/game";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, Activity, ShieldAlert } from "lucide-react";
import { LobbyView, CountdownView, PlayingView, AnswerRevealView, WaitingGradingView } from "@/components/game";

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
    teams, activeRound, activeQuestion, gameState, timeLeft, countdown, isFullscreen, onToggleFullscreen
}: ArenaViewProps) {
    return (
        <div className={cn(
            "min-h-screen bg-[#0a0e1a] text-white flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden relative transition-all duration-700",
            isFullscreen ? "fixed inset-0 z-[100]" : ""
        )}>
            {/* Background decorative elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Overlay */}
            <div className="fixed top-8 left-8 right-8 z-[110] flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-4 opacity-50">
                    {isFullscreen && <span className="font-bold text-lg hidden sm:inline italic tracking-tight uppercase">SIMPIC ARENA</span>}
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={onToggleFullscreen}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group shadow-2xl backdrop-blur-xl"
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5 text-white/40 group-hover:text-white" /> : <Maximize2 className="w-5 h-5 text-white/40 group-hover:text-white" />}
                    </button>
                </div>
            </div>

            <main className="w-full relative z-10 flex flex-col items-center justify-center pt-20">
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
                            result={{
                                isCorrect: true,
                                points: 0,
                                streak: 0,
                                message: "Verification Phase",
                                imageUrl: activeQuestion?.imageUrl,
                                questionText: activeQuestion?.text || "",
                                correctAnswer: activeQuestion?.type === "mcq" ? { type: "mcq", correctChoiceIndex: activeQuestion.correctChoiceIndex, choices: activeQuestion.choices } : (activeQuestion?.type === "mtf" ? { type: "mtf", statements: activeQuestion.statements } : undefined)
                            } as any}
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

            {/* Status Footer - Hidden in intense moments/fullscreen */}
            {!isFullscreen && (
                <div className="fixed bottom-8 left-0 right-0 p-6 flex justify-center items-center text-white/10 text-[10px] font-black uppercase tracking-[0.5em] pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        Spectator View Mode • Active Feed Sync
                    </div>
                </div>
            )}
        </div>
    );
}
