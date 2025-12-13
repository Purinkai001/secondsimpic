"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CheckCircle2, Clock, Activity, Timer, XCircle, LogOut, Settings, X, Edit2, RefreshCw, Flame, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER, GROUPS, QuestionType } from "@/lib/types";

// Answer reveal duration in seconds
const ANSWER_REVEAL_DURATION = 5;

// Question type labels with colors
const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; color: string }> = {
    mcq: { label: "Multiple Choice", color: "bg-blue-500/20 text-blue-300" },
    mtf: { label: "Multiple True/False", color: "bg-purple-500/20 text-purple-300" },
    saq: { label: "Short Answer", color: "bg-green-500/20 text-green-300" },
    spot: { label: "Spot Diagnosis", color: "bg-orange-500/20 text-orange-300" },
};

// Difficulty labels with colors
const DIFFICULTY_LABELS = {
    easy: { label: "Easy", color: "bg-green-600", points: 1 },
    medium: { label: "Medium", color: "bg-yellow-600", points: 2 },
    difficult: { label: "Difficult", color: "bg-red-600", points: 3 },
};

export default function GamePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);

    // Answer states for different question types
    const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
    const [mtfAnswers, setMtfAnswers] = useState<boolean[]>([]);
    const [textAnswer, setTextAnswer] = useState("");

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [gameState, setGameState] = useState<"waiting" | "countdown" | "playing" | "answer_reveal">("waiting");
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);
    const [showSettings, setShowSettings] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [renaming, setRenaming] = useState(false);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    // Time tracking for scoring
    const questionStartTime = useRef<number | null>(null);
    const [timeSpent, setTimeSpent] = useState<number>(0);

    // Track current question index to detect changes
    const currentQuestionIndex = useRef<number>(-1);

    // Last submission result for answer reveal
    const [lastResult, setLastResult] = useState<{
        isCorrect: boolean | null;
        points: number;
        streak: number;
        message: string;
        correctAnswer?: string;
    } | null>(null);

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

    // Reset answer state based on question type
    const resetAnswerState = useCallback((question?: Question) => {
        setMcqAnswer(null);
        setTextAnswer("");
        if (question?.statements) {
            setMtfAnswers(new Array(question.statements.length).fill(false));
        } else {
            setMtfAnswers([]);
        }
        setSubmitted(false);
        setLastResult(null);
        questionStartTime.current = Date.now();
        setTimeSpent(0);
    }, []);

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
    const fetchRoundData = useCallback(async (skipRevealCheck = false) => {
        // Don't interrupt answer reveal phase unless forced
        if (gameState === "answer_reveal" && !skipRevealCheck) {
            return;
        }

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
            resetAnswerState();
            currentQuestionIndex.current = -1;
            return;
        }

        const roundDoc = roundsSnap.docs[0];
        const round = { ...roundDoc.data(), id: roundDoc.id } as Round;

        // Check if round changed - reset state
        const prevRoundId = currentRound?.id;
        if (prevRoundId !== round.id) {
            resetAnswerState();
            currentQuestionIndex.current = -1;
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
        // Total time per question = question time + reveal time
        const totalTimePerQuestion = questionTimer + ANSWER_REVEAL_DURATION;

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

        // Game has started - calculate current question with reveal phases
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const currentQIdx = Math.floor(elapsedSeconds / totalTimePerQuestion);
        const timeIntoSlot = elapsedSeconds % totalTimePerQuestion;

        // Are we in question phase or reveal phase?
        const isInQuestionPhase = timeIntoSlot < questionTimer;
        const timeRemainingQuestion = questionTimer - timeIntoSlot;
        const timeRemainingReveal = totalTimePerQuestion - timeIntoSlot;

        if (currentQIdx >= questions.length) {
            // Round is over
            setGameState("waiting");
            setCurrentQuestion(null);
            setInGame(false);
            currentQuestionIndex.current = -1;
            return;
        }

        const question = questions[currentQIdx];

        // Check if question changed
        if (currentQuestionIndex.current !== currentQIdx) {
            currentQuestionIndex.current = currentQIdx;
            resetAnswerState(question);
        }

        setCurrentQuestion(question);
        setInGame(true);

        if (isInQuestionPhase) {
            // In question answering phase
            setTimeLeft(timeRemainingQuestion);
            setGameState("playing");
        } else {
            // In answer reveal phase
            setAnswerRevealCountdown(timeRemainingReveal);
            setGameState("answer_reveal");

            // Check if already answered this question
            const teamId = localStorage.getItem("medical_quiz_team_id");
            if (teamId && question && !lastResult) {
                const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
                if (answerDoc.exists()) {
                    const ansData = answerDoc.data();
                    setSubmitted(true);
                    setLastResult({
                        isCorrect: ansData.isCorrect,
                        points: ansData.points || 0,
                        streak: ansData.streak || 0,
                        message: ansData.isCorrect ? "Correct!" : "Incorrect. Streak reset.",
                    });
                }
            }
        }

        // If in question phase, check if we already answered
        if (isInQuestionPhase) {
            const teamId = localStorage.getItem("medical_quiz_team_id");
            if (teamId && question) {
                const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
                if (answerDoc.exists()) {
                    setSubmitted(true);
                    const ansData = answerDoc.data();
                    if (question.type === "mcq" && typeof ansData.answer === "number") {
                        setMcqAnswer(ansData.answer);
                    } else if (question.type === "mtf" && Array.isArray(ansData.answer)) {
                        setMtfAnswers(ansData.answer);
                    } else if ((question.type === "saq" || question.type === "spot") && typeof ansData.answer === "string") {
                        setTextAnswer(ansData.answer);
                    }
                    setLastResult({
                        isCorrect: ansData.isCorrect,
                        points: ansData.points || 0,
                        streak: ansData.streak || 0,
                        message: ansData.isCorrect ? "Correct!" : "Incorrect. Streak reset.",
                    });
                }
            }
        }
    }, [currentRound?.id, gameState, resetAnswerState, lastResult]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            await fetchTeam();
            await fetchRoundData(true);
            setLoading(false);
        };
        init();
    }, [fetchTeam, fetchRoundData]);

    // Polling logic - runs every second when in game
    useEffect(() => {
        if (loading) return;

        const pollInterval = setInterval(async () => {
            // Always poll when not in game
            // When in game, poll but respect answer reveal phase
            if (!isInGame()) {
                await fetchRoundData(true);
            } else if (gameState !== "answer_reveal") {
                // Refresh the timer calculation
                await fetchRoundData(false);
            }
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [loading, fetchRoundData, gameState]);

    // Countdown timer for round start
    useEffect(() => {
        if (gameState === "countdown" && countdownSeconds > 0) {
            const timer = setInterval(() => {
                setCountdownSeconds(prev => {
                    if (prev <= 1) {
                        fetchRoundData(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, countdownSeconds, fetchRoundData]);

    // Answer reveal countdown
    useEffect(() => {
        if (gameState === "answer_reveal" && answerRevealCountdown > 0) {
            const timer = setInterval(() => {
                setAnswerRevealCountdown(prev => {
                    if (prev <= 1) {
                        // Move to next question
                        fetchRoundData(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, answerRevealCountdown, fetchRoundData]);

    // Question timer - when it hits 0, auto-submit
    useEffect(() => {
        if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        // Time's up
                        if (!submitted) {
                            handleSubmit();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, timeLeft, submitted]);

    // Track time spent
    useEffect(() => {
        if (gameState === "playing" && !submitted && questionStartTime.current) {
            const interval = setInterval(() => {
                setTimeSpent((Date.now() - (questionStartTime.current || Date.now())) / 1000);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameState, submitted]);

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
        await fetchRoundData(true);
        setLoading(false);
    };

    // Get current answer based on question type
    const getCurrentAnswer = (): string | number | boolean[] | null => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case "mcq":
                return mcqAnswer;
            case "mtf":
                return mtfAnswers;
            case "saq":
            case "spot":
                return textAnswer;
            default:
                return null;
        }
    };

    // Check if answer is valid for submission
    const isAnswerValid = (): boolean => {
        if (!currentQuestion) return false;

        switch (currentQuestion.type) {
            case "mcq":
                return mcqAnswer !== null;
            case "mtf":
                return mtfAnswers.length > 0;
            case "saq":
            case "spot":
                return textAnswer.trim().length > 0;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        if (!currentQuestion || !team || !currentRound) return;
        if (submitted) return; // Prevent double submit

        const answer = getCurrentAnswer();
        if (answer === null && !submitted) {
            // Auto-submit with empty answer (time ran out)
            return;
        }

        // Calculate time spent
        const finalTimeSpent = questionStartTime.current
            ? (Date.now() - questionStartTime.current) / 1000
            : 100;

        setSubmitting(true);
        try {
            // Submit via API
            const response = await fetch("/api/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId: team.id,
                    questionId: currentQuestion.id,
                    roundId: currentRound.id,
                    answer: answer,
                    type: currentQuestion.type,
                    timeSpent: Math.min(finalTimeSpent, 100),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit");
            }

            // Update local score and streak
            if (result.points > 0) {
                setTeam({
                    ...team,
                    score: (team.score || 0) + result.points,
                    streak: result.streak
                });
            } else if (result.isCorrect === false) {
                setTeam({ ...team, streak: 0 });
            }

            setLastResult(result);
            setSubmitted(true);
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle challenge submission
    const handleChallenge = async () => {
        if (!currentQuestion || !team || !currentRound) return;
        if ((team.challengesRemaining || 0) <= 0) {
            alert("No challenges remaining!");
            return;
        }

        if (!confirm(`Are you sure you want to challenge this question? You have ${team.challengesRemaining} challenge(s) remaining.`)) {
            return;
        }

        try {
            const response = await fetch("/api/challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId: team.id,
                    teamName: team.name,
                    questionId: currentQuestion.id,
                    questionText: currentQuestion.text,
                    roundId: currentRound.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit challenge");
            }

            setTeam({ ...team, challengesRemaining: result.challengesRemaining });
            alert(result.message);
        } catch (err: any) {
            console.error("Error submitting challenge:", err);
            alert(err.message || "Failed to submit challenge.");
        }
    };

    // Render answer input based on question type
    const renderAnswerInput = () => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case "mcq":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.choices?.map((choice, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMcqAnswer(idx)}
                                disabled={submitted}
                                className={cn(
                                    "p-6 rounded-xl text-left transition-all border-2 text-lg font-medium",
                                    mcqAnswer === idx
                                        ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20"
                                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20",
                                    submitted && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                <span className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 float-left transition-colors",
                                    mcqAnswer === idx ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {choice.text}
                            </button>
                        ))}
                    </div>
                );

            case "mtf":
                return (
                    <div className="space-y-3">
                        {currentQuestion.statements?.map((statement, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                            >
                                <span className="flex-1 text-lg">{statement.text}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const newAnswers = [...mtfAnswers];
                                            newAnswers[idx] = true;
                                            setMtfAnswers(newAnswers);
                                        }}
                                        disabled={submitted}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold transition-all",
                                            mtfAnswers[idx] === true
                                                ? "bg-green-500 text-white"
                                                : "bg-white/10 text-slate-400 hover:bg-white/20",
                                            submitted && "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        TRUE
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newAnswers = [...mtfAnswers];
                                            newAnswers[idx] = false;
                                            setMtfAnswers(newAnswers);
                                        }}
                                        disabled={submitted}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold transition-all",
                                            mtfAnswers[idx] === false && mtfAnswers.length > idx
                                                ? "bg-red-500 text-white"
                                                : "bg-white/10 text-slate-400 hover:bg-white/20",
                                            submitted && "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        FALSE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case "saq":
                return (
                    <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your answer here (must be spelled correctly)..."
                        disabled={submitted}
                        className={cn(
                            "w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg",
                            submitted && "opacity-60 cursor-not-allowed"
                        )}
                        autoComplete="off"
                    />
                );

            case "spot":
                return (
                    <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Identify the diagnosis (must be spelled correctly)..."
                        disabled={submitted}
                        className={cn(
                            "w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg",
                            submitted && "opacity-60 cursor-not-allowed"
                        )}
                        autoComplete="off"
                    />
                );

            default:
                return null;
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
                    {/* Streak indicator */}
                    {(team?.streak || 0) > 0 && (
                        <span className="text-xs bg-orange-500 px-2 py-1 rounded flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {team?.streak}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    {currentRound && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {currentRound.id}</div>}
                    <div>Score: <span className="text-white font-bold text-lg">{team?.score || 0}</span></div>
                    {/* Challenges remaining */}
                    <div className="flex items-center gap-1 text-yellow-400">
                        <Flag className="w-4 h-4" />
                        <span>{team?.challengesRemaining ?? 2}</span>
                    </div>
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
                                <p className="text-xs text-gray-500 mb-2">Group: {team?.group}</p>
                                <p className="text-xs text-gray-500 mb-2">Streak: {team?.streak || 0}</p>
                                <p className="text-xs text-gray-500">Challenges Remaining: {team?.challengesRemaining ?? 2}</p>
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

                    {gameState === "answer_reveal" && currentQuestion && (
                        <motion.div
                            key={`reveal-${currentQuestion.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            {/* Header showing next question countdown */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
                                <span className="text-white font-bold text-lg">Answer Reveal</span>
                                <div className="flex items-center gap-2 text-white">
                                    <Timer className="w-5 h-5" />
                                    <span className="font-mono font-bold">Next question in {answerRevealCountdown}s</span>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Question recap */}
                                <p className="text-gray-400 text-sm mb-2">Question:</p>
                                <h2 className="text-xl md:text-2xl font-bold mb-8 text-white/80">
                                    {currentQuestion.text || "(Image question)"}
                                </h2>

                                {/* Result display */}
                                <div className={cn(
                                    "rounded-xl p-8 text-center border-2",
                                    lastResult?.isCorrect === true
                                        ? "bg-green-500/10 border-green-500"
                                        : "bg-red-500/10 border-red-500"
                                )}>
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                                        lastResult?.isCorrect === true
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    )}>
                                        {lastResult?.isCorrect === true
                                            ? <CheckCircle2 className="w-10 h-10 text-white" />
                                            : <XCircle className="w-10 h-10 text-white" />
                                        }
                                    </div>

                                    <h3 className={cn(
                                        "text-3xl font-bold mb-2",
                                        lastResult?.isCorrect === true ? "text-green-400" : "text-red-400"
                                    )}>
                                        {lastResult?.isCorrect === true ? "Correct!" : "Incorrect"}
                                    </h3>

                                    {lastResult?.points ? (
                                        <p className="text-green-300 font-bold text-3xl mb-2">+{lastResult.points} points</p>
                                    ) : null}

                                    {/* Streak display */}
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Flame className={cn(
                                            "w-6 h-6",
                                            (lastResult?.streak || 0) > 0 ? "text-orange-400" : "text-gray-500"
                                        )} />
                                        <span className={cn(
                                            "text-lg font-bold",
                                            (lastResult?.streak || 0) > 0 ? "text-orange-400" : "text-gray-500"
                                        )}>
                                            Streak: {lastResult?.streak || 0}
                                        </span>
                                    </div>

                                    {lastResult?.message && (
                                        <p className="text-white/60 text-sm mt-4">{lastResult.message}</p>
                                    )}

                                    {/* Challenge button for incorrect answers */}
                                    {lastResult?.isCorrect === false && (team?.challengesRemaining ?? 0) > 0 && (
                                        <button
                                            onClick={handleChallenge}
                                            className="mt-6 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-6 py-3 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            <Flag className="w-5 h-5" /> Challenge ({team?.challengesRemaining} left)
                                        </button>
                                    )}
                                </div>
                            </div>
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
                            <div className="bg-slate-700 p-3 flex justify-between items-center flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                        QUESTION_TYPE_LABELS[currentQuestion.type]?.color || "bg-gray-500/20 text-gray-300"
                                    )}>
                                        {QUESTION_TYPE_LABELS[currentQuestion.type]?.label || currentQuestion.type}
                                    </span>
                                    {currentQuestion.difficulty && (
                                        <span className={cn("px-2 py-1 rounded text-xs font-bold text-white",
                                            DIFFICULTY_LABELS[currentQuestion.difficulty]?.color || "bg-gray-600"
                                        )}>
                                            {DIFFICULTY_LABELS[currentQuestion.difficulty]?.label} ({DIFFICULTY_LABELS[currentQuestion.difficulty]?.points}x)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Timer className={cn("w-5 h-5", timeLeft && timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-green-400")} />
                                    <span className={cn("font-mono font-bold text-xl", timeLeft && timeLeft <= 10 ? "text-red-500" : "text-green-400")}>
                                        {timeLeft}s
                                    </span>
                                </div>
                            </div>

                            {/* Question Image */}
                            {currentQuestion.imageUrl && (
                                <div className="w-full h-64 md:h-80 bg-black/50 overflow-hidden relative">
                                    <img src={currentQuestion.imageUrl} alt="Question" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Question Content */}
                            <div className="p-8">
                                {currentQuestion.text && (
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                                        {currentQuestion.text}
                                    </h2>
                                )}

                                {/* Answers Section */}
                                {submitted ? (
                                    <div className={cn(
                                        "rounded-xl p-8 text-center border",
                                        lastResult?.isCorrect === true
                                            ? "bg-green-500/10 border-green-500/20"
                                            : lastResult?.isCorrect === false
                                                ? "bg-red-500/10 border-red-500/20"
                                                : "bg-blue-500/10 border-blue-500/20"
                                    )}>
                                        <div className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg",
                                            lastResult?.isCorrect === true
                                                ? "bg-green-500 shadow-green-500/20"
                                                : lastResult?.isCorrect === false
                                                    ? "bg-red-500 shadow-red-500/20"
                                                    : "bg-blue-500 shadow-blue-500/20"
                                        )}>
                                            {lastResult?.isCorrect === true
                                                ? <CheckCircle2 className="w-8 h-8 text-white" />
                                                : lastResult?.isCorrect === false
                                                    ? <XCircle className="w-8 h-8 text-white" />
                                                    : <CheckCircle2 className="w-8 h-8 text-white" />
                                            }
                                        </div>
                                        <h3 className={cn(
                                            "text-xl font-bold mb-2",
                                            lastResult?.isCorrect === true ? "text-green-400" :
                                                lastResult?.isCorrect === false ? "text-red-400" : "text-blue-400"
                                        )}>
                                            {lastResult?.isCorrect === true ? "Correct!" :
                                                lastResult?.isCorrect === false ? "Incorrect" : "Submitted"}
                                        </h3>
                                        {lastResult?.points ? (
                                            <p className="text-green-300 font-bold text-2xl">+{lastResult.points} points</p>
                                        ) : null}
                                        <p className="text-white/40 text-sm mt-4">
                                            Waiting for answer reveal phase...
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {renderAnswerInput()}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !isAnswerValid()}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Submit All and Finish</>}
                                        </button>

                                        {/* Time spent indicator */}
                                        <p className="text-center text-xs text-white/40">
                                            Time spent: {timeSpent.toFixed(1)}s
                                        </p>
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
