"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CheckCircle2, Clock, Activity, Timer, AlertCircle, LogOut, Settings, X, Edit2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER, GROUPS } from "@/lib/types";

export default function GamePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
    const [answer, setAnswer] = useState<string | number>("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [gameState, setGameState] = useState<"waiting" | "countdown" | "playing" | "between_questions">("waiting");
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [showSettings, setShowSettings] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [renaming, setRenaming] = useState(false);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    // Check if ingame from localStorage
    const isInGame = () => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("ingame") === "true";
    };

    const setInGame = (value: boolean) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ingame", value.toString());
        }
    };

    // Fetch team data
    const fetchTeam = useCallback(async () => {
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId) {
            router.push("/");
            return null;
        }
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
            const teamData = { ...teamDoc.data(), id: teamDoc.id } as Team;
            setTeam(teamData);
            return teamData;
        } else {
            router.push("/");
            return null;
        }
    }, [router]);

    // Fetch active round and questions
    const fetchRoundData = useCallback(async () => {
        // Also fetch all teams for leaderboard during waiting
        const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("score", "desc")));
        setAllTeams(teamsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));

        // Get active round
        const roundsQuery = query(collection(db, "rounds"), where("status", "==", "active"));
        const roundsSnap = await getDocs(roundsQuery);

        if (roundsSnap.empty) {
            setCurrentRound(null);
            setCurrentQuestion(null);
            setRoundQuestions([]);
            setGameState("waiting");
            setInGame(false);
            setSubmitted(false);
            setAnswer("");
            return;
        }

        const roundDoc = roundsSnap.docs[0];
        const round = { ...roundDoc.data(), id: roundDoc.id } as Round;

        // Check if round changed - reset state
        const prevRoundId = currentRound?.id;
        if (prevRoundId !== round.id) {
            setSubmitted(false);
            setAnswer("");
        }

        setCurrentRound(round);

        // Fetch questions for this round
        const questionsQuery = query(
            collection(db, "questions"),
            where("roundId", "==", round.id)
        );
        const questionsSnap = await getDocs(questionsQuery);
        const questions = questionsSnap.docs
            .map(d => ({ ...d.data(), id: d.id } as Question))
            .sort((a, b) => a.order - b.order);
        setRoundQuestions(questions);

        // Determine game state based on time
        const now = Date.now();
        const startTime = round.startTime;
        const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;

        if (!startTime) {
            setGameState("waiting");
            setInGame(false);
            return;
        }

        if (now < startTime) {
            // Countdown to start
            setGameState("countdown");
            setCountdownSeconds(Math.ceil((startTime - now) / 1000));
            setInGame(true);
            return;
        }

        // Game has started - calculate current question
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const currentQIndex = Math.floor(elapsedSeconds / questionTimer);
        const timeIntoQuestion = elapsedSeconds % questionTimer;
        const timeRemaining = questionTimer - timeIntoQuestion;

        if (currentQIndex >= questions.length) {
            // Round is over
            setGameState("waiting");
            setCurrentQuestion(null);
            setInGame(false);
            return;
        }

        const question = questions[currentQIndex];

        // Check if question changed - reset answer state
        if (currentQuestion?.id !== question.id) {
            setSubmitted(false);
            setAnswer("");
        }

        setCurrentQuestion(question);
        setTimeLeft(timeRemaining);
        setGameState("playing");
        setInGame(true);

        // Check if already answered this question
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (teamId && question) {
            const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
            if (answerDoc.exists()) {
                setSubmitted(true);
                setAnswer(answerDoc.data().answer);
            }
        }
    }, [currentRound?.id, currentQuestion?.id]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            await fetchTeam();
            await fetchRoundData();
            setLoading(false);
        };
        init();
    }, [fetchTeam, fetchRoundData]);

    // Polling logic
    useEffect(() => {
        if (loading) return;

        // If not in game, poll every 3 seconds
        // If in game, still update timer but less frequent fetch
        const pollInterval = setInterval(async () => {
            if (!isInGame()) {
                await fetchRoundData();
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [loading, fetchRoundData]);

    // Timer countdown
    useEffect(() => {
        if (gameState === "countdown" && countdownSeconds > 0) {
            const timer = setInterval(() => {
                setCountdownSeconds(prev => {
                    if (prev <= 1) {
                        fetchRoundData();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, countdownSeconds, fetchRoundData]);

    // Question timer
    useEffect(() => {
        if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        // Time's up, fetch next question
                        fetchRoundData();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, timeLeft, fetchRoundData]);

    const handleLogout = () => {
        if (confirm("Are you sure you want to leave the game?")) {
            localStorage.removeItem("medical_quiz_team_id");
            localStorage.removeItem("medical_quiz_team_name");
            localStorage.removeItem("medical_quiz_team_group");
            localStorage.removeItem("ingame");
            router.push("/");
        }
    };

    const handleRename = async () => {
        if (!team || !newTeamName.trim()) return;
        setRenaming(true);
        try {
            await updateDoc(doc(db, "teams", team.id), { name: newTeamName.trim() });
            localStorage.setItem("medical_quiz_team_name", newTeamName.trim());
            setTeam({ ...team, name: newTeamName.trim() });
            setShowSettings(false);
            setNewTeamName("");
        } catch (err) {
            console.error("Error renaming team:", err);
            alert("Failed to rename. Try again.");
        } finally {
            setRenaming(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        await fetchTeam();
        await fetchRoundData();
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!currentQuestion || !team || !currentRound) return;
        if (answer === "" || answer === null) return;

        setSubmitting(true);
        try {
            // Submit via API (uses Admin SDK to bypass security rules)
            const response = await fetch("/api/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId: team.id,
                    questionId: currentQuestion.id,
                    roundId: currentRound.id,
                    answer: answer,
                    type: currentQuestion.type,
                    group: team.group,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit");
            }

            // Update local score if points were earned
            if (result.points > 0) {
                setTeam({ ...team, score: (team.score || 0) + result.points });
            }

            setSubmitted(true);
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (team?.status === "eliminated") {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-2xl max-w-lg text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Eliminated</h1>
                    <p className="text-gray-300">
                        Thank you for participating, <strong>{team.name}</strong>.
                        Unfortunately, your journey ends here.
                    </p>
                    <button onClick={() => router.push("/")} className="mt-6 text-sm text-white/50 hover:text-white underline">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 bg-slate-800/50 border-b border-white/10 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-500" />
                    <span className="font-bold text-lg">{team?.name}</span>
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white font-mono">Group {team?.group}</span>
                    {team?.isBot && <span className="text-xs bg-gray-600 px-2 py-1 rounded">BOT</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    {currentRound && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {currentRound.id}</div>}
                    <div>Score: <span className="text-white font-bold text-lg">{team?.score || 0}</span></div>
                    <button onClick={handleRefresh} className="p-2 hover:bg-white/10 rounded transition-colors" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setNewTeamName(team?.name || ""); setShowSettings(true); }} className="p-2 hover:bg-white/10 rounded transition-colors" title="Settings">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Leave Game">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Team Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter new team name"
                                    />
                                    <button
                                        onClick={handleRename}
                                        disabled={renaming || !newTeamName.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-500 mb-2">Team ID: {team?.id}</p>
                                <p className="text-xs text-gray-500">Group: {team?.group}</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full mt-4 bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Leave Game
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {gameState === "waiting" && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full space-y-6"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                </div>
                                <h2 className="text-2xl font-bold text-blue-100">Waiting for round to start...</h2>
                                <p className="text-slate-400 text-sm mt-1">Keep your eyes on the screen!</p>
                            </div>

                            {/* Division Leaderboards */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                {GROUPS.map(g => {
                                    const groupTeams = allTeams
                                        .filter(t => t.group === g)
                                        .sort((a, b) => b.score - a.score);

                                    return (
                                        <div key={g} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                            <h3 className="text-center text-xs uppercase font-bold text-blue-400 mb-2">
                                                Group {g}
                                            </h3>
                                            <div className="space-y-1">
                                                {groupTeams.map((t, idx) => (
                                                    <div
                                                        key={t.id}
                                                        className={cn(
                                                            "flex justify-between items-center text-xs py-1 px-2 rounded",
                                                            t.id === team?.id ? "bg-blue-500/20 text-blue-300" :
                                                                t.status === "eliminated" ? "text-red-400/50 line-through" :
                                                                    "text-white/70"
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-1 truncate max-w-[80px]">
                                                            {idx === 0 && t.status === "active" && <span className="text-yellow-400">👑</span>}
                                                            {t.name}
                                                        </span>
                                                        <span className="font-bold">{t.score}</span>
                                                    </div>
                                                ))}
                                                {groupTeams.length === 0 && (
                                                    <p className="text-white/30 text-[10px] text-center">No teams</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "countdown" && (
                        <motion.div
                            key="countdown"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center space-y-4"
                        >
                            <div className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-500">
                                <span className="text-6xl font-black text-yellow-400">{countdownSeconds}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-yellow-100">Round Starting Soon!</h2>
                            <p className="text-slate-400">Get Ready...</p>
                        </motion.div>
                    )}

                    {gameState === "playing" && currentQuestion && (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            {/* Timer Bar */}
                            <div className="bg-slate-700 p-3 flex justify-between items-center">
                                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {currentQuestion.type === "mcq" ? "Multiple Choice" : "Essay"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Timer className={cn("w-5 h-5", timeLeft && timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-green-400")} />
                                    <span className={cn("font-mono font-bold text-xl", timeLeft && timeLeft <= 3 ? "text-red-500" : "text-green-400")}>
                                        {timeLeft}s
                                    </span>
                                </div>
                            </div>

                            {/* Question Image */}
                            {currentQuestion.imageUrl && (
                                <div className="w-full h-64 bg-black/50 overflow-hidden relative">
                                    <img src={currentQuestion.imageUrl} alt="Question" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Question Content */}
                            <div className="p-8">
                                <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                                    {currentQuestion.text}
                                </h2>

                                {/* Answers Section */}
                                {submitted ? (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
                                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-400 mb-2">Answer Submitted!</h3>
                                        <p className="text-green-200/60">Waiting for next question...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {currentQuestion.type === "mcq" && currentQuestion.choices ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {currentQuestion.choices.map((choice, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setAnswer(idx)}
                                                        className={cn(
                                                            "p-6 rounded-xl text-left transition-all border-2 text-lg font-medium",
                                                            answer === idx
                                                                ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20"
                                                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 float-left transition-colors",
                                                            answer === idx ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        {choice.text}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={answer as string}
                                                onChange={(e) => setAnswer(e.target.value)}
                                                placeholder="Type your answer here..."
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-y"
                                            />
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || answer === ""}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Submit Answer</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
