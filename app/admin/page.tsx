"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/admin/hooks/useAdminDashboard";
import {
    Activity, Bot, Users, FileQuestion, Flag,
    RefreshCw, RotateCcw, Layers, AlertTriangle, Zap,
    Play, Eye, ArrowRight, Crown, ShieldCheck
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { ActionButton } from "@/components/admin/ActionButton";
import { RoundControl } from "@/components/admin/RoundControl";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { EliminationPanel } from "@/components/admin/EliminationPanel";
import { AdminBadge, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPrimitives";
import { api } from "@/lib/api";

export default function AdminDashboardOverview() {
    const {
        teams, rounds, questions, allAnswers,
        activeTeamsCount, botCount, humanCount, pendingChallengesCount, activeRound,
    } = useAdminDashboard();

    const [selectedRound, setSelectedRound] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (name: string, fn: () => Promise<unknown>) => {
        setActionLoading(name);
        try {
            await fn();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Action failed");
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
        await api.gameAction("scheduleRound", { roundId, startTime });
    };

    const activateRound = async (roundId: string) => {
        await api.gameAction("activateRound", { roundId });
    };

    const endRound = async (roundId: string) => {
        await api.gameAction("endRound", { roundId });
    };

    const setQuestion = async (roundId: string, qId: string | null) => {
        await api.gameAction("setCurrentQuestion", { roundId, qId });
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
        if (!confirm("Are you sure you want to REVEAL RESULTS? This cannot be undone.")) return;

        const roundQuestions = questions
            .filter((q) => q.roundId === activeRound.id)
            .sort((a, b) => a.order - b.order);
        const currentQ = roundQuestions[activeRound.currentQuestionIndex || 0];
        const difficulty = currentQ?.difficulty || "easy";

        await api.gameAction("revealResults", { roundId: activeRound.id, difficulty });
    };

    const nextQuestion = async () => {
        if (!activeRound) return;
        if (!confirm("Are you sure you want to proceed to the NEXT QUESTION?")) return;

        const roundQuestions = questions
            .filter((q) => q.roundId === activeRound.id)
            .sort((a, b) => a.order - b.order);

        const currentIndex = activeRound.currentQuestionIndex || 0;

        if (currentIndex >= roundQuestions.length - 1) {
            if (!confirm("This is the last question. End this round and return to lobby?")) return;
            await api.gameAction("endRound", { roundId: activeRound.id });
        } else {
            await api.gameAction("nextQuestion", { roundId: activeRound.id });
        }
    };

    const runElimination = async (roundNum: number) => {
        if (!confirm(`Run Elimination for Round ${roundNum}?`)) return;
        await api.gameAction("runElimination", { roundNum });
    };

    const currentAnswerCount = activeRound && !activeRound.showResults
        ? allAnswers.filter((a) => {
            const roundQuestions = questions
                .filter((q) => q.roundId === activeRound.id)
                .sort((x, y) => x.order - y.order);
            const currentQ = roundQuestions[activeRound.currentQuestionIndex || 0];
            return currentQ && a.questionId === currentQ.id;
        }).length
        : 0;

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Arena Command"
                title="Overview"
                description="Live session status, round orchestration, and system diagnostics in a single operator console."
                status={
                    <div className="flex flex-col items-stretch gap-3 sm:items-end">
                        {activeRound ? (
                            <AdminBadge tone="success">Active Round {activeRound.id}</AdminBadge>
                        ) : (
                            <AdminBadge>No Active Round</AdminBadge>
                        )}
                        {activeRound && !activeRound.showResults && (
                            <AdminBadge tone="accent">
                                Answers {currentAnswerCount} / {teams.filter((t) => t.status === "active").length}
                            </AdminBadge>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} value={teams.length} label="Total Teams" color="bg-[radial-gradient(circle_at_top_right,rgba(124,232,239,0.10),transparent_34%)]" />
                <StatCard icon={Activity} value={activeTeamsCount} label="Active Teams" color="bg-[radial-gradient(circle_at_top_right,rgba(109,240,169,0.10),transparent_34%)]" />
                <StatCard icon={FileQuestion} value={questions.length} label="Questions" color="bg-[radial-gradient(circle_at_top_right,rgba(255,241,211,0.10),transparent_34%)]" />
                <StatCard icon={Flag} value={pendingChallengesCount} label="Challenges" color="bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.10),transparent_34%)]" />
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-8 space-y-6">
                    <AdminPanel
                        title="Primary Controls"
                        description="High-impact game actions grouped by urgency and operator frequency."
                        icon={Zap}
                        tone="accent"
                    >
                        <div className="flex flex-wrap gap-3">
                            <ActionButton onClick={initGame} icon={RefreshCw} label="Init Game" variant="danger" loading={actionLoading === "init"} />
                            <ActionButton onClick={fillBots} icon={Bot} label={`Fill Bots (${Math.max(0, 30 - teams.length)})`} loading={actionLoading === "fillbots"} />
                            <ActionButton onClick={removeBots} icon={Bot} label="Remove Bots" variant="danger" loading={actionLoading === "removebots"} />
                            <ActionButton onClick={resetScoresForTurn3} icon={RotateCcw} label="Reset Score" variant="warning" loading={actionLoading === "resetScores"} />
                            <ActionButton onClick={rearrangeDivisions} icon={Layers} label="Rearrange" variant="primary" loading={actionLoading === "rearrange"} />
                            <ActionButton
                                onClick={() => handleAction("suddenDeathAlert", async () => {
                                    const data = await api.gameAction("triggerSuddenDeathAlert");
                                    alert(data.message);
                                })}
                                icon={Zap}
                                label="Sudden Death Alert"
                                variant="danger"
                                loading={actionLoading === "suddenDeathAlert"}
                            />
                            <ActionButton
                                onClick={() => handleAction("clearSuddenDeath", () => api.gameAction("clearSuddenDeathAlert"))}
                                icon={RefreshCw}
                                label="Clear Sudden Death"
                                variant="primary"
                                loading={actionLoading === "clearSuddenDeath"}
                            />
                            {activeRound && !activeRound.showResults && (
                                <ActionButton onClick={revealResults} icon={Eye} label="Reveal Result" variant="primary" />
                            )}
                            {activeRound && (
                                <ActionButton onClick={nextQuestion} icon={ArrowRight} label="Next Question" variant="success" />
                            )}
                            {activeRound && !activeRound.pausedAt && (
                                <ActionButton onClick={pauseRound} icon={Activity} label="Force Pause" variant="warning" />
                            )}
                            {activeRound?.pausedAt && (
                                <ActionButton onClick={resumeRound} icon={Play} label="Resume Hub" variant="success" />
                            )}
                            <ActionButton
                                onClick={() => handleAction("declareWinners", async () => {
                                    if (!confirm("DECLARE WINNERS? This ends the game for active teams.")) return;
                                    return api.gameAction("declareWinners");
                                })}
                                icon={Crown}
                                label="Declare Winners"
                                variant="warning"
                                loading={actionLoading === "declareWinners"}
                            />
                        </div>
                    </AdminPanel>

                    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                        <RoundControl
                            rounds={rounds}
                            onSchedule={scheduleRound}
                            onActivate={activateRound}
                            onEnd={endRound}
                            onSelect={setSelectedRound}
                            selectedRoundId={selectedRound}
                        />
                        {selectedRound ? (
                            <QuestionManager selectedRoundId={selectedRound} questions={questions} onSetQuestion={setQuestion} />
                        ) : (
                            <AdminPanel
                                title="Question Rail"
                                description="Select a round to inspect and push questions."
                                icon={FileQuestion}
                            >
                                <div className="rounded-[1.75rem] border border-dashed border-white/10 px-6 py-14 text-center">
                                    <p className="font-atsanee text-3xl font-black uppercase italic text-gold/75">
                                        Select A Round
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-admin-muted">
                                        The question rail appears here after a round is selected.
                                    </p>
                                </div>
                            </AdminPanel>
                        )}
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-4 space-y-6">
                    <AdminPanel
                        title="System Diagnostics"
                        description="Read-only operational telemetry to support quick decisions."
                        icon={ShieldCheck}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                <span className="text-sm font-semibold text-admin-muted">Human Teams</span>
                                <span className="font-atsanee text-2xl font-black italic text-gold">{humanCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                                <span className="text-sm font-semibold text-admin-muted">Bot Teams</span>
                                <span className="font-atsanee text-2xl font-black italic text-gold">{botCount}</span>
                            </div>
                            <button
                                onClick={checkTies}
                                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/85 transition-all hover:border-admin-cyan/20 hover:bg-white/[0.06]"
                            >
                                Check for Ties
                            </button>
                            <button
                                onClick={simulateBotScores}
                                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/85 transition-all hover:border-admin-cyan/20 hover:bg-white/[0.06]"
                            >
                                Simulate Bot Progress
                            </button>
                        </div>
                    </AdminPanel>

                    <EliminationPanel onRunElimination={runElimination} />

                    <AdminPanel
                        title="Operator Guidance"
                        description="Quick reminders for the current control workflow."
                        icon={AlertTriangle}
                        tone="warning"
                    >
                        <div className="space-y-4 text-sm font-medium leading-relaxed text-admin-muted">
                            <p>Reveal results only after answer collection and grading synchronization are complete.</p>
                            <p>Use force pause when a round clock requires immediate intervention before grading.</p>
                            <p>Declare winners only as the final control action for the active teams.</p>
                        </div>
                    </AdminPanel>
                </div>
            </div>
        </div>
    );
}
