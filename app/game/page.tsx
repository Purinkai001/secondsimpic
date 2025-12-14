"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, CheckCircle2, Clock, Activity, Timer, XCircle, LogOut, Settings, RefreshCw, Flame, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER, QuestionType } from "@/lib/types";

// Import components
import {
    MCQInput,
    MTFInput,
    TextInput,
    AnswerReveal,
    WaitingScreen,
    WaitingGradingScreen,
    SettingsModal,
    WinnerCelebration
} from "./components";

// Import types and constants
import {
    ANSWER_REVEAL_DURATION,
    QUESTION_TYPE_LABELS,
    DIFFICULTY_LABELS,
    SubmissionResult,
    GameState,
    requiresManualGrading
} from "./types";

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
    const [gameState, setGameState] = useState<GameState>("waiting");
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);
    const [showSettings, setShowSettings] = useState(false);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    // Time tracking for scoring
    const questionStartTime = useRef<number | null>(null);
    const [timeSpent, setTimeSpent] = useState<number>(0);

    // Track current question index to detect changes
    const currentQuestionIndex = useRef<number>(-1);

    // Ref to track gameState without triggering useCallback dependency changes
    const gameStateRef = useRef<GameState>("waiting");

    // Keep the ref synced with the state
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Last submission result for answer reveal
    const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);

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

    // Check if all SAQ/Spot answers for current question have been graded
    const checkAllGradingComplete = useCallback(async (questionId: string): Promise<boolean> => {
        try {
            const answersSnap = await getDocs(
                query(
                    collection(db, "answers"),
                    where("questionId", "==", questionId)
                )
            );

            for (const doc of answersSnap.docs) {
                const data = doc.data();
                if (data.isCorrect === null) {
                    return false;
                }
            }
            return true;
        } catch (err) {
            console.error("Error checking grading status:", err);
            return false;
        }
    }, []);

    // Check answer grading status (for SAQ/Spot)
    const checkMyAnswerStatus = useCallback(async (questionId: string) => {
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId || !questionId) return null;

        try {
            const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${questionId}`));
            if (answerDoc.exists()) {
                return answerDoc.data();
            }
        } catch (err) {
            console.error("Error checking answer status:", err);
        }
        return null;
    }, []);

    // Fetch active round and questions
    const fetchRoundData = useCallback(async (skipRevealCheck = false) => {
        // Don't interrupt answer reveal or waiting_grading phases unless forced
        // Use ref to avoid triggering dependency changes
        if ((gameStateRef.current === "answer_reveal" || gameStateRef.current === "waiting_grading") && !skipRevealCheck) {
            return;
        }

        // Fetch round data via API (bypasses client-side security rules)
        try {
            const res = await fetch("/api/round");
            const data = await res.json();

            if (!data.success) {
                console.error("Failed to fetch round data:", data.error);
                return;
            }

            // Check if there's an active round
            if (!data.hasActiveRound || !data.round) {
                setCurrentRound(null);
                setCurrentQuestion(null);
                setRoundQuestions([]);
                setGameState("waiting");
                setInGame(false);
                resetAnswerState();
                currentQuestionIndex.current = -1;
                return;
            }

            const round = data.round as Round;
            const questions = (data.questions || []) as Question[];

            // Check if round changed - reset state
            const prevRoundId = currentRound?.id;
            if (prevRoundId !== round.id) {
                resetAnswerState();
                currentQuestionIndex.current = -1;
            }

            setCurrentRound(round);
            setRoundQuestions(questions);

            console.log("Fetched round data:", { round: round.id, questionsCount: questions.length });


            // Check if round is paused for grading
            if (round.pausedAt) {
                // Round is paused - stay on waiting_grading state
                setGameState("waiting_grading");
                setInGame(true);

                // Find the current question based on time before pause
                const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
                const totalTimePerQuestion = questionTimer + ANSWER_REVEAL_DURATION;
                const pauseDuration = round.totalPauseDuration || 0;
                const effectiveElapsed = Math.floor(((round.pausedAt - (round.startTime || round.pausedAt)) - pauseDuration) / 1000);
                const currentQIdx = Math.floor(effectiveElapsed / totalTimePerQuestion);

                if (currentQIdx >= 0 && currentQIdx < questions.length) {
                    const question = questions[currentQIdx];
                    setCurrentQuestion(question);

                    // Get our answer status
                    const myAnswer = await checkMyAnswerStatus(question.id);
                    if (myAnswer) {
                        setSubmitted(true);
                        if ((question.type === "saq" || question.type === "spot") && typeof myAnswer.answer === "string") {
                            setTextAnswer(myAnswer.answer);
                        }
                        setLastResult({
                            isCorrect: myAnswer.isCorrect,
                            points: myAnswer.points || 0,
                            streak: myAnswer.streak || team?.streak || 0,
                            message: myAnswer.isCorrect === null
                                ? "Waiting for grading..."
                                : myAnswer.isCorrect ? "Correct!" : "Incorrect.",
                            pendingGrading: myAnswer.isCorrect === null,
                        });
                    }
                }
                return;
            }

            // Determine game state based on time
            const now = Date.now();
            const startTime = round.startTime;
            const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
            const totalTimePerQuestion = questionTimer + ANSWER_REVEAL_DURATION;
            const pauseDuration = round.totalPauseDuration || 0;

            if (!startTime) {
                setGameState("waiting");
                setInGame(false);
                return;
            }

            if (now < startTime) {
                setGameState("countdown");
                setCountdownSeconds(Math.ceil((startTime - now) / 1000));
                setInGame(true);
                return;
            }

            // Calculate effective elapsed time (subtract pause duration)
            // Ensure pause duration doesn't exceed actual elapsed time
            const actualElapsedMs = now - startTime;
            const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
            const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
            const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);
            const currentQIdx = Math.floor(elapsedSeconds / totalTimePerQuestion);
            const timeIntoSlot = elapsedSeconds % totalTimePerQuestion;

            const isInQuestionPhase = timeIntoSlot < questionTimer;
            const timeRemainingQuestion = questionTimer - timeIntoSlot;
            const timeRemainingReveal = totalTimePerQuestion - timeIntoSlot;

            // Debug logging
            console.log("Game state calculation:", {
                round: round.id,
                questionsCount: questions.length,
                currentQIdx,
                elapsedSeconds,
                totalTimePerQuestion,
                isInQuestionPhase,
                pauseDuration: safePauseDuration,
                actualElapsedMs,
            });

            // Handle case when no questions are loaded yet or round is complete
            if (questions.length === 0) {
                console.log("No questions loaded for round:", round.id);
                // Stay in playing state but show loading
                setGameState("playing");
                setCurrentQuestion(null);
                setInGame(true);
                return;
            }

            if (currentQIdx >= questions.length) {
                console.log("Round complete - all questions answered");
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
                setTimeLeft(timeRemainingQuestion);
                setGameState("playing");

                // Check if already answered
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
                            streak: ansData.streak || team?.streak || 0,
                            message: ansData.isCorrect === true ? "Correct!" :
                                ansData.isCorrect === false ? "Incorrect." :
                                    "Waiting for grading...",
                            pendingGrading: ansData.isCorrect === null,
                            mtfCorrectCount: ansData.mtfCorrectCount,
                            mtfTotalCount: ansData.mtfTotalCount,
                        });

                        // If SAQ/Spot and pending, show waiting screen
                        if (requiresManualGrading(question.type) && ansData.isCorrect === null) {
                            setGameState("waiting_grading");
                        }
                    }
                }
            } else {
                // In answer reveal phase
                setAnswerRevealCountdown(timeRemainingReveal);
                setGameState("answer_reveal");

                // Get result data
                const teamId = localStorage.getItem("medical_quiz_team_id");
                if (teamId && question && !lastResult) {
                    const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
                    if (answerDoc.exists()) {
                        const ansData = answerDoc.data();
                        setSubmitted(true);

                        let correctAnswerData: any = undefined;
                        if (question.type === "mcq") {
                            correctAnswerData = {
                                type: "mcq",
                                correctChoiceIndex: question.correctChoiceIndex,
                                choices: question.choices,
                            };
                        } else if (question.type === "mtf") {
                            correctAnswerData = {
                                type: "mtf",
                                statements: question.statements,
                            };
                        }

                        setLastResult({
                            isCorrect: ansData.isCorrect,
                            points: ansData.points || 0,
                            streak: ansData.streak || team?.streak || 0,
                            message: ansData.isCorrect === true ? "Correct!" :
                                ansData.isCorrect === false ? "Incorrect." :
                                    "Waiting for grading...",
                            correctAnswer: correctAnswerData,
                            pendingGrading: ansData.isCorrect === null,
                            mtfCorrectCount: ansData.mtfCorrectCount,
                            mtfTotalCount: ansData.mtfTotalCount,
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching round data:", err);
        }
        // Note: gameState removed from deps since we use gameStateRef
    }, [currentRound?.id, resetAnswerState, lastResult, team?.streak, checkMyAnswerStatus]);

    // Poll for grading updates when round is paused
    useEffect(() => {
        if (gameState !== "waiting_grading" || !currentRound) return;

        const pollInterval = setInterval(async () => {
            // Re-fetch round to check if still paused
            const roundDoc = await getDoc(doc(db, "rounds", currentRound.id));
            if (roundDoc.exists()) {
                const roundData = roundDoc.data();
                if (!roundData.pausedAt) {
                    // Round resumed! Refresh everything
                    await fetchRoundData(true);
                } else if (currentQuestion) {
                    // Still paused - check if my answer was graded
                    const myAnswer = await checkMyAnswerStatus(currentQuestion.id);
                    if (myAnswer && myAnswer.isCorrect !== null) {
                        setLastResult({
                            isCorrect: myAnswer.isCorrect,
                            points: myAnswer.points || 0,
                            streak: myAnswer.streak || team?.streak || 0,
                            message: myAnswer.isCorrect ? "Correct!" : "Incorrect.",
                            pendingGrading: false,
                        });

                        if (myAnswer.isCorrect && myAnswer.points > 0) {
                            setTeam(prev => prev ? {
                                ...prev,
                                score: (prev.score || 0) + myAnswer.points,
                            } : null);
                        }
                    }
                }
            }
        }, 5000); // Poll every 5s during grading wait

        return () => clearInterval(pollInterval);
    }, [gameState, currentRound, currentQuestion, fetchRoundData, checkMyAnswerStatus, team?.streak]);

    // Initial load - run ONLY on mount to prevent infinite loop
    useEffect(() => {
        const init = async () => {
            await fetchTeam();
            await fetchRoundData(true);
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch teams for leaderboard (separate, less frequent)
    useEffect(() => {
        if (gameState !== "waiting") return;

        const fetchTeams = async () => {
            try {
                const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("score", "desc")));
                setAllTeams(teamsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));
            } catch (err) {
                console.error("Error fetching teams:", err);
            }
        };

        fetchTeams(); // Initial fetch
        const teamsInterval = setInterval(fetchTeams, 5000); // Every 5s during waiting

        return () => clearInterval(teamsInterval);
    }, [gameState]);

    // Polling logic - round data only
    useEffect(() => {
        if (loading) return;

        // Poll less frequently - every 3s when in game, every 5s when waiting
        const interval = isInGame() ? 3000 : 5000;

        const pollInterval = setInterval(async () => {
            if (!isInGame()) {
                await fetchRoundData(true);
            } else if (gameState !== "answer_reveal" && gameState !== "waiting_grading") {
                await fetchRoundData(false);
            }
        }, interval);

        return () => clearInterval(pollInterval);
    }, [loading, fetchRoundData, gameState]);

    // Countdown timer for round start
    useEffect(() => {
        if (gameState === "countdown") {
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
    }, [gameState, fetchRoundData]);

    // Answer reveal countdown
    useEffect(() => {
        if (gameState === "answer_reveal") {
            const timer = setInterval(() => {
                setAnswerRevealCountdown(prev => {
                    if (prev <= 1) {
                        fetchRoundData(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, fetchRoundData]);

    // Question timer
    useEffect(() => {
        if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        if (!submitted) {
                            handleSubmit(true); // Force submit on timeout (even empty answers)
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

    const handleRename = async (newName: string) => {
        if (!team) return;
        await updateDoc(doc(db, "teams", team.id), { name: newName });
        localStorage.setItem("medical_quiz_team_name", newName);
        setTeam({ ...team, name: newName });
    };

    const handleRefresh = async () => {
        setLoading(true);
        await fetchTeam();
        await fetchRoundData(true);
        setLoading(false);
    };

    const getCurrentAnswer = (): string | number | boolean[] | null => {
        if (!currentQuestion) return null;
        switch (currentQuestion.type) {
            case "mcq": return mcqAnswer;
            case "mtf": return mtfAnswers;
            case "saq":
            case "spot": return textAnswer;
            default: return null;
        }
    };

    const isAnswerValid = (): boolean => {
        if (!currentQuestion) return false;
        switch (currentQuestion.type) {
            case "mcq": return mcqAnswer !== null;
            case "mtf": return mtfAnswers.length > 0;
            case "saq":
            case "spot": return textAnswer.trim().length > 0;
            default: return false;
        }
    };

    const handleSubmit = async (forceEmpty = false) => {
        if (!currentQuestion || !team || !currentRound) return;
        if (submitted) return;

        let answer = getCurrentAnswer();

        // For SAQ/Spot, allow empty answer on force (timeout auto-submit)
        if (answer === null && !forceEmpty) return;
        if (answer === null && forceEmpty && (currentQuestion.type === "saq" || currentQuestion.type === "spot")) {
            answer = ""; // Submit empty string
        }
        if (answer === null) return;

        const finalTimeSpent = questionStartTime.current
            ? (Date.now() - questionStartTime.current) / 1000
            : 100;

        setSubmitting(true);
        try {
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
            if (result.isCorrect !== null || result.points > 0) {
                setTeam({
                    ...team,
                    score: (team.score || 0) + (result.points || 0),
                    streak: result.streak
                });
            }

            setLastResult({
                isCorrect: result.isCorrect,
                points: result.points,
                streak: result.streak,
                message: result.message,
                correctAnswer: result.correctAnswer,
                pendingGrading: result.pendingGrading,
                mtfCorrectCount: result.mtfCorrectCount,
                mtfTotalCount: result.mtfTotalCount,
            });
            setSubmitted(true);

            // If SAQ/Spot, pause the round and switch to waiting state
            if (result.pendingGrading && requiresManualGrading(currentQuestion.type)) {
                // Call API to pause the round
                await fetch("/api/game", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "pauseForGrading",
                        roundId: currentRound.id,
                        key: "admin123",
                    }),
                });
                setGameState("waiting_grading");
            }
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleChallenge = async () => {
        if (!currentQuestion || !team || !currentRound) return;
        if ((team.challengesRemaining || 0) <= 0) {
            alert("No challenges remaining!");
            return;
        }

        if (!confirm(`Challenge this question? You have ${team.challengesRemaining} remaining.`)) {
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
            alert(err.message || "Failed to submit challenge.");
        }
    };

    const renderAnswerInput = () => {
        if (!currentQuestion) return null;

        switch (currentQuestion.type) {
            case "mcq":
                return <MCQInput question={currentQuestion} answer={mcqAnswer} setAnswer={setMcqAnswer} submitted={submitted} />;
            case "mtf":
                return <MTFInput question={currentQuestion} answers={mtfAnswers} setAnswers={setMtfAnswers} submitted={submitted} />;
            case "saq":
            case "spot":
                return <TextInput type={currentQuestion.type} value={textAnswer} setValue={setTextAnswer} submitted={submitted} />;
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
                    <p className="text-gray-300">Thank you for participating, <strong>{team.name}</strong>.</p>
                    <button onClick={() => router.push("/")} className="mt-6 text-sm text-white/50 hover:text-white underline">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Check if team is a winner
    // Trigger if: team.status === "winner" OR (no active round AND exactly 5 active teams remaining)
    const activeTeams = allTeams.filter(t => t.status === "active");
    const isWinner = team?.status === "winner" ||
        (!currentRound && activeTeams.length === 5 && team?.status === "active");

    if (isWinner && team) {
        // Calculate rank based on score among winners/finalists
        const finalists = team.status === "winner"
            ? allTeams.filter(t => t.status === "winner")
            : activeTeams;
        const rankedFinalists = finalists.sort((a, b) => (b.score || 0) - (a.score || 0));
        const rank = rankedFinalists.findIndex(t => t.id === team.id) + 1;
        return <WinnerCelebration team={team} rank={rank || 1} />;
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
                    {(team?.streak || 0) > 0 && (
                        <span className="text-xs bg-orange-500 px-2 py-1 rounded flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {team?.streak}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    {currentRound && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {currentRound.id}
                            {currentRound.pausedAt && <span className="text-yellow-400 text-xs">(Paused)</span>}
                        </div>
                    )}
                    <div>Score: <span className="text-white font-bold text-lg">{team?.score || 0}</span></div>
                    <div className="flex items-center gap-1 text-yellow-400">
                        <Flag className="w-4 h-4" />
                        <span>{team?.challengesRemaining ?? 2}</span>
                    </div>
                    <button onClick={handleRefresh} className="p-2 hover:bg-white/10 rounded transition-colors" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded transition-colors" title="Settings">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Leave Game">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <SettingsModal team={team} isOpen={showSettings} onClose={() => setShowSettings(false)} onRename={handleRename} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {gameState === "waiting" && <WaitingScreen team={team} allTeams={allTeams} />}

                    {gameState === "countdown" && (
                        <motion.div key="countdown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-4">
                            <div className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-500">
                                <span className="text-6xl font-black text-yellow-400">{countdownSeconds}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-yellow-100">Round Starting Soon!</h2>
                            <p className="text-slate-400">Get Ready...</p>
                        </motion.div>
                    )}

                    {gameState === "waiting_grading" && currentQuestion && (
                        <WaitingGradingScreen
                            questionText={currentQuestion.text || "(Image question)"}
                            userAnswer={textAnswer}
                        />
                    )}

                    {gameState === "answer_reveal" && currentQuestion && (
                        <motion.div key={`reveal-${currentQuestion.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
                                <span className="text-white font-bold text-lg">Answer Reveal</span>
                                <div className="flex items-center gap-2 text-white">
                                    <Timer className="w-5 h-5" />
                                    <span className="font-mono font-bold">Next in {answerRevealCountdown}s</span>
                                </div>
                            </div>
                            <AnswerReveal question={currentQuestion} result={lastResult} countdown={answerRevealCountdown} team={team} userMcqAnswer={mcqAnswer} userMtfAnswers={mtfAnswers} onChallenge={handleChallenge} />
                        </motion.div>
                    )}

                    {/* Loading state when playing but questions not loaded */}
                    {gameState === "playing" && !currentQuestion && (
                        <motion.div
                            key="loading-question"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-blue-100">Loading Question...</h2>
                            <p className="text-slate-400 text-sm">Round: {currentRound?.id}</p>
                        </motion.div>
                    )}

                    {gameState === "playing" && currentQuestion && (
                        <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <div className="bg-slate-700 p-3 flex justify-between items-center flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", QUESTION_TYPE_LABELS[currentQuestion.type]?.color || "bg-gray-500/20 text-gray-300")}>
                                        {QUESTION_TYPE_LABELS[currentQuestion.type]?.label}
                                    </span>
                                    {currentQuestion.difficulty && (
                                        <span className={cn("px-2 py-1 rounded text-xs font-bold text-white", DIFFICULTY_LABELS[currentQuestion.difficulty]?.color)}>
                                            {DIFFICULTY_LABELS[currentQuestion.difficulty]?.label} ({DIFFICULTY_LABELS[currentQuestion.difficulty]?.points}x)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Timer className={cn("w-5 h-5", timeLeft && timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-green-400")} />
                                    <span className={cn("font-mono font-bold text-xl", timeLeft && timeLeft <= 10 ? "text-red-500" : "text-green-400")}>{timeLeft}s</span>
                                </div>
                            </div>

                            {currentQuestion.imageUrl && (
                                <div className="w-full h-64 md:h-80 bg-black/50 overflow-hidden">
                                    <img src={currentQuestion.imageUrl} alt="Question" className="w-full h-full object-contain" />
                                </div>
                            )}

                            <div className="p-8">
                                {currentQuestion.text && <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">{currentQuestion.text}</h2>}

                                {submitted ? (
                                    <div className={cn("rounded-xl p-8 text-center border",
                                        lastResult?.pendingGrading ? "bg-yellow-500/10 border-yellow-500/20" :
                                            currentQuestion.type === "mtf" ? "bg-purple-500/10 border-purple-500/20" :
                                                lastResult?.isCorrect === true ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                                    )}>
                                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg",
                                            lastResult?.pendingGrading ? "bg-yellow-500" :
                                                currentQuestion.type === "mtf" ? "bg-purple-500" :
                                                    lastResult?.isCorrect === true ? "bg-green-500" : "bg-red-500"
                                        )}>
                                            {lastResult?.pendingGrading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> :
                                                currentQuestion.type === "mtf" ? <span className="text-sm font-bold text-white">{lastResult?.mtfCorrectCount}/{lastResult?.mtfTotalCount}</span> :
                                                    lastResult?.isCorrect === true ? <CheckCircle2 className="w-8 h-8 text-white" /> : <XCircle className="w-8 h-8 text-white" />}
                                        </div>
                                        <h3 className={cn("text-xl font-bold mb-2",
                                            lastResult?.pendingGrading ? "text-yellow-400" :
                                                currentQuestion.type === "mtf" ? "text-purple-400" :
                                                    lastResult?.isCorrect === true ? "text-green-400" : "text-red-400"
                                        )}>
                                            {lastResult?.pendingGrading ? "Waiting for Admin" :
                                                currentQuestion.type === "mtf" ? `${lastResult?.mtfCorrectCount}/${lastResult?.mtfTotalCount} Correct` :
                                                    lastResult?.isCorrect === true ? "Correct!" : "Incorrect"}
                                        </h3>
                                        {lastResult?.points ? <p className="text-green-300 font-bold text-2xl">+{lastResult.points} points</p> : null}
                                        <p className="text-white/40 text-sm mt-4">{lastResult?.pendingGrading ? "Timer paused. Waiting for admin grading..." : "Waiting for reveal..."}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {renderAnswerInput()}
                                        <button onClick={() => handleSubmit()} disabled={submitting || !isAnswerValid()} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                                            {submitting ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Submit Answer</>}
                                        </button>
                                        <p className="text-center text-xs text-white/40">Time spent: {timeSpent.toFixed(1)}s</p>
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
