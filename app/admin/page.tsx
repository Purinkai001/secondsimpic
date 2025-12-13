"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, deleteDoc, writeBatch, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import {
    Loader2, ShieldAlert, LogOut, Bot, RefreshCw, Shuffle, RotateCcw,
    Layers, AlertTriangle, FileQuestion, Zap, Activity, Users,
    Trophy, Clock, MessageSquare, CheckCircle, Play, Pause, Flag
} from "lucide-react";
import { Team, Round, Question, Answer, GROUPS, Challenge } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Components
import { AdminLogin } from "@/components/admin/AdminLogin";
import { RoundControl } from "@/components/admin/RoundControl";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { EliminationPanel } from "@/components/admin/EliminationPanel";
import { GradingQueue } from "@/components/admin/GradingQueue";
import { LiveStandings } from "@/components/admin/LiveStandings";
import { AnswerHistory } from "@/components/admin/AnswerHistory";
import { ChallengeAlerts } from "@/components/admin/ChallengeAlerts";

// Stat card component
const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
    trend
}: {
    icon: any;
    value: number | string;
    label: string;
    color: string;
    trend?: "up" | "down" | null;
}) => (
    <motion.div
        className={cn(
            "relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 shadow-lg border border-white/10",
            color
        )}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="relative flex items-center justify-between">
            <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
);

// Action button component
const ActionButton = ({
    onClick,
    icon: Icon,
    label,
    variant = "default",
    disabled = false,
    loading = false
}: {
    onClick: () => void;
    icon: any;
    label: string;
    variant?: "default" | "danger" | "success" | "warning" | "primary";
    disabled?: boolean;
    loading?: boolean;
}) => {
    const variants = {
        default: "from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-900/20",
        danger: "from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/20",
        success: "from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20",
        warning: "from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20",
        primary: "from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-500/20",
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                "relative overflow-hidden bg-gradient-to-r text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant]
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            {label}
        </motion.button>
    );
};

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Answer[]>([]);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [selectedRound, setSelectedRound] = useState<string | null>(null);

    // Stats
    const activeTeamsCount = teams.filter(t => t.status === "active").length;
    const eliminatedCount = teams.filter(t => t.status === "eliminated").length;
    const botCount = teams.filter(t => t.isBot).length;
    const humanCount = teams.filter(t => !t.isBot).length;
    const pendingChallengesCount = challenges.filter(c => !c.dismissed).length;
    const activeRound = rounds.find(r => r.status === "active");

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubAuth();
    }, []);

    // Fetch data via API (bypasses Firestore security rules)
    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin?key=admin123");
            const data = await res.json();

            if (data.success) {
                setTeams(data.teams || []);
                setRounds(data.rounds || []);
                setQuestions(data.questions || []);
                setPendingAnswers(data.pendingAnswers || []);
                setAllAnswers(data.allAnswers || []);
                setChallenges(data.challenges || []);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchData();

        // Poll every 3 seconds
        const pollInterval = setInterval(fetchData, 3000);

        return () => clearInterval(pollInterval);
    }, [user]);

    const handleLogout = () => {
        signOut(auth);
    };

    // --- ACTIONS ---

    const initGame = async () => {
        if (!confirm("Initialize Game? This will reset rounds, clear all answers/challenges, and reset team scores.")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "initGame", key: "admin123" }),
            });
            const data = await res.json();
            alert(data.message || "Game initialized!");
            fetchData();
        } catch (e) {
            alert("Failed to initialize game");
        }
    };

    const seedQuestions = async () => {
        try {
            const res = await fetch("/api/seed?key=admin123&action=seed");
            const data = await res.json();
            alert(data.message || "Seeded!");
            fetchData();
        } catch (e) {
            alert("Failed to seed");
        }
    };

    const fillBots = async () => {
        try {
            const res = await fetch("/api/seed?key=admin123&action=fillbots");
            const data = await res.json();
            alert(data.message || "Bots added!");
            fetchData();
        } catch (e) {
            alert("Failed to add bots");
        }
    };

    const removeBots = async () => {
        if (!confirm("Remove ALL bots from the game?")) return;
        try {
            const res = await fetch("/api/seed?key=admin123&action=removebots");
            const data = await res.json();
            alert(data.message || "Bots removed!");
            fetchData();
        } catch (e) {
            alert("Failed to remove bots");
        }
    };

    const shuffleTeams = async () => {
        if (!confirm("Shuffle all 30 teams randomly into 5 divisions?")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "shuffleTeams", key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Teams shuffled!");
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to shuffle teams");
        }
    };

    const resetScoresForTurn3 = async () => {
        if (!confirm("Reset all team scores for Turn 3? This will set all active team scores to 0.")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "resetScoresForTurn3", key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Scores reset!");
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to reset scores");
        }
    };

    const rearrangeDivisions = async () => {
        if (!confirm("Rearrange divisions by score ranking? This should be done after Turn 3 elimination.")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "rearrangeDivisions", key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Divisions rearranged!");
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to rearrange divisions");
        }
    };

    const checkTies = async () => {
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "checkTies", key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.hasTies && data.ties.length > 0) {
                let message = "TIES DETECTED:\n\n";
                data.ties.forEach((tie: any) => {
                    message += `Division ${tie.division}: ${tie.teams.map((t: any) => `${t.name} (${t.score}pts)`).join(", ")}\n`;
                });
                message += "\nThese teams need Sudden Death to resolve ties.";
                alert(message);
            } else {
                alert("No ties detected. All teams have unique scores within their divisions.");
            }
        } catch (e: any) {
            alert(e.message || "Failed to check ties");
        }
    };

    const simulateBotScores = async () => {
        if (!confirm("Simulate random scores for all bot teams?")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "simulateBotScores", key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Bot scores simulated!");
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to simulate bot scores");
        }
    };

    const kickPlayer = async (teamId: string, teamName: string) => {
        if (!confirm(`Force kick "${teamName}"? This will remove them from the game.`)) return;
        try {
            await deleteDoc(doc(db, "teams", teamId));
            alert(`${teamName} has been removed.`);
            fetchData();
        } catch (e) {
            console.error("Failed to kick player:", e);
            alert("Failed to kick player.");
        }
    };

    const scheduleRound = async (roundId: string, startTime: number) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime: startTime,
            currentQuestionIndex: 0
        });
        fetchData();
    };

    const activateRound = async (roundId: string) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime: Date.now(),
            currentQuestionIndex: 0
        });
        fetchData();
    };

    const endRound = async (roundId: string) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "completed",
            startTime: null
        });
        fetchData();
    };

    const setQuestion = async (roundId: string, qId: string | null) => {
        await updateDoc(doc(db, "rounds", roundId), { currentQuestionId: qId });
    };

    const gradeAnswer = async (answer: Answer, correct: boolean) => {
        const POINTS = 10;
        const batch = writeBatch(db);
        const ansRef = doc(db, "answers", answer.id);
        batch.update(ansRef, { isCorrect: correct, points: correct ? POINTS : 0 });

        if (correct) {
            const tRef = doc(db, "teams", answer.teamId);
            const tSnap = await getDoc(tRef);
            if (tSnap.exists()) {
                batch.update(tRef, { score: (tSnap.data().score || 0) + POINTS });
            }
        }
        await batch.commit();
        fetchData();
    };

    const runElimination = async (roundNum: number) => {
        if (roundNum !== 3 && roundNum !== 5) {
            return alert("Elimination only at Round 3 or Round 5.");
        }
        if (!confirm(`Run Elimination for End of Round ${roundNum}?`)) return;

        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "runElimination", key: "admin123", roundNum }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Elimination complete!");
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to run elimination");
        }
    };

    const dismissChallenge = async (challengeId: string) => {
        try {
            const res = await fetch("/api/challenge", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challengeId, key: "admin123" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchData();
        } catch (e: any) {
            alert(e.message || "Failed to dismiss challenge");
        }
    };

    if (loadingAuth) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a0e1a]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="animate-spin text-blue-500 w-12 h-12 mx-auto mb-4" />
                    <p className="text-white/50">Loading admin panel...</p>
                </motion.div>
            </div>
        );
    }

    if (!user) {
        return <AdminLogin />;
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
            {/* Animated background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-slate-900" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                    Admin Dashboard
                                </h1>
                                <p className="text-xs text-white/40">SIMPIC Control Center</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Live indicator */}
                            {activeRound && (
                                <motion.div
                                    className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
                                </motion.div>
                            )}

                            {/* Last update time */}
                            <div className="text-white/30 text-xs hidden md:flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Updated {lastUpdate.toLocaleTimeString()}
                            </div>

                            <span className="text-white/40 text-sm hidden md:block">{user.email}</span>

                            <Link
                                href="/admin/questions"
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white px-4 py-2 rounded-xl shadow-lg shadow-teal-500/20 text-sm font-semibold flex items-center gap-2 transition-all"
                            >
                                <FileQuestion className="w-4 h-4" /> Questions
                            </Link>

                            <motion.button
                                onClick={handleLogout}
                                className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400 p-2.5 rounded-xl transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <LogOut className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative max-w-[1800px] mx-auto p-6 space-y-6">
                {/* Stats Row */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <StatCard icon={Users} value={teams.length} label="Total Teams" color="from-blue-500/20 to-blue-600/10" />
                    <StatCard icon={Activity} value={activeTeamsCount} label="Active" color="from-green-500/20 to-green-600/10" />
                    <StatCard icon={Bot} value={`${humanCount}/${botCount}`} label="Human/Bot" color="from-purple-500/20 to-purple-600/10" />
                    <StatCard icon={FileQuestion} value={questions.length} label="Questions" color="from-cyan-500/20 to-cyan-600/10" />
                    <StatCard icon={CheckCircle} value={allAnswers.length} label="Answers" color="from-amber-500/20 to-amber-600/10" />
                    <StatCard icon={Flag} value={pendingChallengesCount} label="Challenges" color="from-pink-500/20 to-pink-600/10" />
                </motion.div>

                {/* Quick Actions Bar */}
                <motion.div
                    className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-4">
                        <Zap className="w-3 h-3" />
                        Quick Actions
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <ActionButton onClick={initGame} icon={RefreshCw} label="Init Game" variant="danger" />
                        <ActionButton onClick={seedQuestions} icon={FileQuestion} label="Seed Questions" variant="primary" />
                        <ActionButton onClick={fillBots} icon={Bot} label={`Fill Bots (${30 - teams.length})`} />
                        {botCount > 0 && (
                            <ActionButton onClick={removeBots} icon={Bot} label={`Remove Bots (${botCount})`} variant="warning" />
                        )}
                        {teams.length === 30 && (
                            <ActionButton onClick={shuffleTeams} icon={Shuffle} label="Shuffle Teams" variant="success" />
                        )}
                    </div>
                </motion.div>

                {/* Game Flow Controls */}
                <motion.div
                    className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-4">
                        <Activity className="w-3 h-3" />
                        Game Flow Controls
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <ActionButton onClick={resetScoresForTurn3} icon={RotateCcw} label="Reset Scores (Turn 3)" variant="warning" />
                        <ActionButton onClick={rearrangeDivisions} icon={Layers} label="Rearrange Divisions" variant="primary" />
                        <ActionButton onClick={checkTies} icon={AlertTriangle} label="Check Ties (Sudden Death)" variant="danger" />
                        {botCount > 0 && (
                            <ActionButton onClick={simulateBotScores} icon={Bot} label="Simulate Bot Scores" />
                        )}
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column */}
                    <motion.div
                        className="col-span-12 lg:col-span-4 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <RoundControl
                                rounds={rounds}
                                onSchedule={scheduleRound}
                                onActivate={activateRound}
                                onEnd={endRound}
                                onSelect={setSelectedRound}
                                selectedRoundId={selectedRound}
                            />
                        </div>

                        {selectedRound && (
                            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                                <QuestionManager
                                    selectedRoundId={selectedRound}
                                    questions={questions}
                                    onSetQuestion={setQuestion}
                                />
                            </div>
                        )}

                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <EliminationPanel onRunElimination={runElimination} />
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <ChallengeAlerts
                                challenges={challenges}
                                onDismiss={dismissChallenge}
                            />
                        </div>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div
                        className="col-span-12 lg:col-span-8 space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <GradingQueue
                                pendingAnswers={pendingAnswers}
                                teams={teams}
                                onGrade={gradeAnswer}
                            />
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <LiveStandings
                                teams={teams}
                                activeTeamsCount={activeTeamsCount}
                                onKickPlayer={kickPlayer}
                            />
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden">
                            <AnswerHistory
                                answers={allAnswers}
                                teams={teams}
                                questions={questions}
                            />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
