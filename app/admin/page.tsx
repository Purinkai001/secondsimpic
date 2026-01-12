"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import {
    Activity, Bot, Users, FileQuestion, CheckCircle, Flag,
    RefreshCw, Shuffle, RotateCcw, Layers, AlertTriangle, Zap,
    Play, Eye, ArrowRight
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { ActionButton } from "@/components/admin/ActionButton";
import { RoundControl } from "@/components/admin/RoundControl";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { EliminationPanel } from "@/components/admin/EliminationPanel";
import { ChallengeAlerts } from "@/components/admin/ChallengeAlerts";
import { api } from "@/lib/api";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboardOverview() {
    const {
        teams, rounds, questions, allAnswers, challenges,
        activeTeamsCount, botCount, humanCount, pendingChallengesCount, activeRound
    } = useAdminDashboard();

    const [selectedRound, setSelectedRound] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (name: string, fn: () => Promise<any>) => {
        setActionLoading(name);
        try {
            await fn();
        } catch (err: any) {
            alert(err.message || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const initGame = () => handleAction("init", async () => {
        if (!confirm("Initialize Game? This will reset everything.")) return;
        return api.gameAction("initGame");
    });

    const fillBots = () => handleAction("fillbots", () => api.seedAction("fillbots"));
    const removeBots = () => handleAction("removebots", async () => {
        if (!confirm("Remove ALL bots?")) return;
        return api.seedAction("removebots");
    });

    const shuffleTeams = () => handleAction("shuffle", async () => {
        if (!confirm("Shuffle all 30 teams?")) return;
        return api.gameAction("shuffleTeams");
    });

    const resetScoresForTurn3 = () => handleAction("resetScores", async () => {
        if (!confirm("Reset scores for Turn 3?")) return;
        return api.gameAction("resetScoresForTurn3");
    });

    const rearrangeDivisions = () => handleAction("rearrange", async () => {
        if (!confirm("Rearrange divisions by score?")) return;
        return api.gameAction("rearrangeDivisions");
    });

    const checkTies = () => handleAction("checkTies", async () => {
        const data = await api.gameAction("checkTies");
        if (data.hasTies) alert("Ties detected!");
        else alert("No ties detected.");
    });

    const simulateBotScores = () => handleAction("botScores", async () => {
        if (!confirm("Simulate bot scores?")) return;
        return api.gameAction("simulateBotScores");
    });

    const scheduleRound = async (roundId: string, startTime: number) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime,
            currentQuestionIndex: 0
        });
    };

    const activateRound = async (roundId: string) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime: Date.now(),
            currentQuestionIndex: 0,
            pausedAt: null,
            totalPauseDuration: 0,
        });
    };

    const endRound = async (roundId: string) => {
        await updateDoc(doc(db, "rounds", roundId), { status: "completed", startTime: null });
    };

    const setQuestion = async (roundId: string, qId: string | null) => {
        await updateDoc(doc(db, "rounds", roundId), { currentQuestionId: qId });
    };

    const dismissChallenge = async (challengeId: string) => {
        await api.dismissChallenge(challengeId);
    };

    const pauseRound = async () => {
        if (!activeRound) return;
        await api.gameAction("pauseForGrading", { roundId: activeRound.id });
    };

    const resumeRound = async () => {
        if (!activeRound) return;
        await api.gameAction("resumeFromGrading", { roundId: activeRound.id });
    };

    const revealResults = async () => {
        if (!activeRound) return;
        await updateDoc(doc(db, "rounds", activeRound.id), { showResults: true });
    };

    const nextQuestion = async () => {
        if (!activeRound) return;

        const roundQuestions = questions
            .filter(q => q.roundId === activeRound.id)
            .sort((a, b) => a.order - b.order);

        const currentIndex = activeRound.currentQuestionIndex || 0;

        if (currentIndex >= roundQuestions.length - 1) {
            if (!confirm("This is the last question. End this round and return to lobby?")) return;
            await updateDoc(doc(db, "rounds", activeRound.id), {
                status: "completed",
                startTime: null,
                showResults: false,
                pausedAt: null
            });
        } else {
            await updateDoc(doc(db, "rounds", activeRound.id), {
                currentQuestionIndex: currentIndex + 1,
                showResults: false,
                pausedAt: null,
                startTime: Date.now(), // Reset start time for the next question
                totalPauseDuration: 0
            });
        }
    };

    const runElimination = async (roundNum: number) => {
        if (!confirm(`Run Elimination for Round ${roundNum}?`)) return;
        await api.gameAction("runElimination", { roundNum });
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Overview</h1>
                    <p className="text-white/40 mt-1">Live session status and control hub</p>
                </div>
                {activeRound && (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Active: {activeRound.id}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} value={teams.length} label="Total Teams" color="from-blue-500/10 to-blue-600/5" />
                <StatCard icon={Activity} value={activeTeamsCount} label="Active Teams" color="from-green-500/10 to-green-600/5" />
                <StatCard icon={FileQuestion} value={questions.length} label="Questions" color="from-cyan-500/10 to-cyan-600/5" />
                <StatCard icon={Flag} value={pendingChallengesCount} label="Challenges" color="from-pink-500/10 to-pink-600/5" />
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-12 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-widest"><Zap className="w-3 h-3" /> Control Panel</div>
                        <div className="flex flex-wrap gap-4">
                            <ActionButton onClick={initGame} icon={RefreshCw} label="Init Game" variant="danger" loading={actionLoading === "init"} />
                            <ActionButton onClick={fillBots} icon={Bot} label={`Fill Bots (${30 - teams.length})`} loading={actionLoading === "fillbots"} />
                            <ActionButton onClick={removeBots} icon={Bot} label="Remove Bots" variant="danger" loading={actionLoading === "removebots"} />
                            <ActionButton onClick={shuffleTeams} icon={Shuffle} label="Shuffle" variant="success" loading={actionLoading === "shuffle"} />
                            <ActionButton onClick={resetScoresForTurn3} icon={RotateCcw} label="Reset Score" variant="warning" loading={actionLoading === "resetScores"} />
                            <ActionButton onClick={rearrangeDivisions} icon={Layers} label="Rearrange" variant="primary" loading={actionLoading === "rearrange"} />
                            <ActionButton
                                onClick={() => handleAction("simulateTies", () => api.gameAction("simulateTies"))}
                                icon={AlertTriangle}
                                label="Simulate Ties"
                                variant="warning"
                                loading={actionLoading === "simulateTies"}
                            />
                            <ActionButton
                                onClick={() => handleAction("triggerSuddenDeath", () => api.gameAction("triggerSuddenDeath"))}
                                icon={Zap}
                                label="Sudden Death"
                                variant="danger"
                                loading={actionLoading === "triggerSuddenDeath"}
                            />
                            {activeRound && !activeRound.showResults && (
                                <ActionButton onClick={revealResults} icon={Eye} label="Reveal Result" variant="primary" />
                            )}
                            {activeRound && (
                                <ActionButton onClick={nextQuestion} icon={ArrowRight} label="Next Question" variant="success" />
                            )}
                            {activeRound && !activeRound.pausedAt && (
                                <ActionButton onClick={pauseRound} icon={Activity} label="Force Pause/Sync" variant="warning" />
                            )}
                            {activeRound?.pausedAt && (
                                <ActionButton onClick={resumeRound} icon={Play} label="Resume Hub" variant="success" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <RoundControl rounds={rounds} onSchedule={scheduleRound} onActivate={activateRound} onEnd={endRound} onSelect={setSelectedRound} selectedRoundId={selectedRound} />
                    {selectedRound && <QuestionManager selectedRoundId={selectedRound} questions={questions} onSetQuestion={setQuestion} />}
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <EliminationPanel onRunElimination={runElimination} />
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-widest"><AlertTriangle className="w-3 h-3" /> System Diagnostics</div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm text-white/60">Human Teams</span>
                                <span className="font-bold">{humanCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm text-white/60">Bot Teams</span>
                                <span className="font-bold">{botCount}</span>
                            </div>
                            <button onClick={checkTies} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">Check for Ties</button>
                            <button onClick={simulateBotScores} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">Simulate Bot Progress</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
