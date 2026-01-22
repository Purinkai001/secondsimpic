import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, query, collection, orderBy, updateDoc, onSnapshot, where, limit, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState, SubmissionResult, requiresManualGrading, ANSWER_REVEAL_DURATION } from "@/app/game/types";
import { api } from "@/lib/api";
import { useServerTime } from "./useServerTime";

export function useGameRoom() {
    const router = useRouter();
    const { now, loading: timeLoading } = useServerTime();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    // Answer states
    const [mcqAnswer, setMcqAnswer] = useState<number | null>(null);
    const [mtfAnswers, setMtfAnswers] = useState<(boolean | null)[]>([]);
    const [textAnswer, setTextAnswer] = useState("");

    const [gameState, setGameState] = useState<GameState>("waiting");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);

    // Time tracking for scoring
    const questionStartTime = useRef<number | null>(null);
    const [timeSpent, setTimeSpent] = useState<number>(0);
    const currentQuestionIndex = useRef<number>(-1);
    const gameStateRef = useRef<GameState>("waiting");

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);

    const isInGame = useCallback(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("ingame") === "true";
    }, []);

    const setInGame = useCallback((value: boolean) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ingame", value.toString());
        }
    }, []);

    const resetAnswerState = useCallback((question?: Question) => {
        setMcqAnswer(null);
        setTextAnswer("");
        if (question?.statements) {
            setMtfAnswers(new Array(question.statements.length).fill(null));
        } else {
            setMtfAnswers([]);
        }
        setSubmitted(false);
        setLastResult(null);
        questionStartTime.current = now();
        setTimeSpent(0);
    }, [now]); // Depends on now() but it's stable

    const fetchTeam = useCallback(async () => {
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId) {
            router.push("/");
            return null;
        }
        // Initial fetch only, real updates handle by snapshot below
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
            const teamData = { ...teamDoc.data(), id: teamDoc.id } as Team;
            setTeam(teamData);
            return teamData;
        } else {
            localStorage.removeItem("medical_quiz_team_id");
            localStorage.removeItem("medical_quiz_team_name");
            localStorage.removeItem("medical_quiz_team_group");
            localStorage.removeItem("ingame");
            router.push("/");
            return null;
        }
    }, [router]);

    // State for raw data from Firestore
    const [syncRound, setSyncRound] = useState<Round | null>(null);
    const [syncQuestions, setSyncQuestions] = useState<Question[]>([]);

    // Identity tracking to avoid redundant resets
    const lastProcessedRoundId = useRef<string | null>(null);
    const lastProcessedQIdx = useRef<number | null>(null);
    const hasPausedForQuestion = useRef<boolean>(false);

    const processRoundData = useCallback((round: Round, questions: Question[]) => {
        if (timeLoading) return; // Wait for server time sync

        try {
            // 1. Detection of Round/Question Identity Changes
            // Ensure we reset state if the round finishes or a new one starts
            if (lastProcessedRoundId.current !== round.id) {
                lastProcessedRoundId.current = round.id;
                lastProcessedQIdx.current = -1; // Force question reset
                resetAnswerState();
            }

            const qIdx = round.currentQuestionIndex || 0;
            if (questions.length > 0 && qIdx >= 0 && qIdx < questions.length) {
                const question = questions[qIdx];
                if (lastProcessedQIdx.current !== qIdx) {
                    lastProcessedQIdx.current = qIdx;
                    hasPausedForQuestion.current = false; // Reset pause flag for new question
                    resetAnswerState(question);
                    // Update current question immediately to prevent "ghost" previous question state
                    setCurrentQuestion(question);
                } else {
                    // Same question, just update in case of edits
                    setCurrentQuestion(question);
                }
            } else {
                setCurrentQuestion(null);
            }

            // 2. Time Calculations
            const serverNow = now();
            const startTime = round.startTime;
            const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
            const pauseDuration = round.totalPauseDuration || 0;

            if (!startTime) {
                setGameState("waiting");
                setInGame(false);
                return;
            }

            // Countdown phase
            if (serverNow < startTime) {
                setGameState("countdown");
                setCountdownSeconds(Math.ceil((startTime - serverNow) / 1000));
                setInGame(true);
                return;
            }

            const actualElapsedMs = serverNow - startTime;
            const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
            const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
            const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);

            // Calculate remaining time
            const timeRemaining = Math.max(0, questionTimer - elapsedSeconds);
            setTimeLeft(timeRemaining);

            // 3. Game State Determination
            if (round.showResults) {
                if (gameStateRef.current !== "answer_reveal") {
                    setAnswerRevealCountdown(ANSWER_REVEAL_DURATION);
                }
                setGameState("answer_reveal");
            } else if (round.pausedAt) {
                setGameState("waiting_grading");
            } else if (timeRemaining <= 0) {
                // **CRITICAL FIX**: If time is up, force waiting/grading state locally.
                // We do NOT wait for 'pausedAt' to be set by admin or auto-pause.
                setGameState("waiting_grading");

                // If we haven't flagged this as paused-for-question yet, do so to trigger auto-pause if needed (usually handled by admin/server)
                if (!hasPausedForQuestion.current) {
                    hasPausedForQuestion.current = true;
                    // Optimistically try to pause, but don't rely on it for local UI state
                    api.gameAction("pauseForGrading", { roundId: round.id }).catch(() => { });
                }
            } else {
                // If we have ALREADY submitted, we should stay in waiting_grading, not revert to playing
                if (submitted) {
                    setGameState("waiting_grading");
                } else {
                    setGameState("playing");
                }
            }

            setInGame(true);
        } catch (err) {
            console.error("Error in processRoundData:", err);
        }
    }, [resetAnswerState, setInGame, now, timeLoading, submitted]);


    const handleSubmit = useCallback(async (forceEmpty = false) => {
        if (!currentQuestion || !team || !currentRound || submitted) return;

        let answer: string | number | (boolean | null)[] | null = null;
        if (currentQuestion.type === "mcq") answer = mcqAnswer;
        else if (currentQuestion.type === "mtf") answer = mtfAnswers;
        else answer = textAnswer;

        // If time's up and no answer, provide defaults
        if (answer === null && forceEmpty) {
            if (currentQuestion.type === "mcq") answer = -1;
            else if (currentQuestion.type === "mtf") {
                answer = new Array(currentQuestion.statements?.length || 0).fill(null);
            }
            else answer = "";
        }

        if (answer === null && !forceEmpty) return;
        if (answer === null) return;

        const finalTimeSpent = questionStartTime.current ? (now() - questionStartTime.current) / 1000 : 100;
        setSubmitting(true);

        // **CRITICAL FIX**: Mark as submitted immediately to prevent loops, even if API fails
        setSubmitted(true);

        try {
            const result = await api.submitAnswer(team.id, currentQuestion.id, currentRound.id, answer, currentQuestion.type, Math.min(Math.abs(finalTimeSpent), 100));

            // Note: We don't manually update team score here anymore. 
            // We rely on the Firestore snapshot listener to update the team state to ensure consistency.

            setLastResult(result);
            setGameState("waiting_grading");
        } catch (err) {
            console.error("Error submitting answer:", err);
            // Even if failed, we keep 'submitted' true to avoid retry loop. User can refresh if needed.
            setLastResult({
                isCorrect: null,
                points: 0,
                streak: team.streak || 0,
                message: "Submission failed (Network Error).",
                pendingGrading: true
            });
        } finally {
            setSubmitting(false);
        }
    }, [currentQuestion, team, currentRound, submitted, mcqAnswer, mtfAnswers, textAnswer, now]);

    const latestHandleSubmit = useRef(handleSubmit);
    useEffect(() => {
        latestHandleSubmit.current = handleSubmit;
    }, [handleSubmit]);

    const handleChallenge = async () => {
        if (!currentQuestion || !team || !currentRound) return;
        if ((team.challengesRemaining || 0) <= 0) return alert("No challenges remaining!");
        if (!confirm(`Challenge this question? You have ${team.challengesRemaining} remaining.`)) return;

        try {
            const result = await api.submitChallenge(team.id, team.name, currentQuestion.id, currentQuestion.text, currentRound.id);
            // Optimistic update
            setTeam({ ...team, challengesRemaining: result.challengesRemaining });
            alert(result.message);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit challenge.";
            alert(message);
        }
    };

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
        // Team snapshot will handle update
    };

    // 1. Independent Team Load & Sync
    useEffect(() => {
        // Initial check
        fetchTeam().then(() => setLoading(false));

        // **CRITICAL FIX**: Real-time listener for own team data (Score Sync)
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (teamId) {
            const unsub = onSnapshot(doc(db, "teams", teamId), (doc) => {
                if (doc.exists()) {
                    setTeam({ ...doc.data(), id: doc.id } as Team);
                }
            });
            return () => unsub();
        }
    }, [fetchTeam]);

    // 2. Round Listener
    useEffect(() => {
        const qRounds = query(collection(db, "rounds"), where("status", "==", "active"), limit(1));
        const unsub = onSnapshot(qRounds, (snapshot) => {
            if (snapshot.empty) {
                setSyncRound(null);
                return;
            }
            const doc = snapshot.docs[0];
            setSyncRound({ id: doc.id, ...doc.data() } as Round);
        });
        return () => unsub();
    }, []);

    // 3. Questions Listener
    useEffect(() => {
        if (!syncRound) {
            setSyncQuestions([]);
            return;
        }
        const qQuestions = query(collection(db, "questions"), where("roundId", "==", syncRound.id));
        const unsub = onSnapshot(qQuestions, (snapshot) => {
            setSyncQuestions(snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as Question))
                .sort((a, b) => a.order - b.order)
            );
        });
        return () => unsub();
    }, [syncRound?.id]);

    // 4. Main State Processor
    useEffect(() => {
        if (!syncRound) {
            setCurrentRound(null);
            setCurrentQuestion(null);
            setRoundQuestions([]);
            setGameState("waiting");
            setInGame(false);
            lastProcessedRoundId.current = null;
            return;
        }
        processRoundData(syncRound, syncQuestions);
        setCurrentRound(syncRound);
        setRoundQuestions(syncQuestions);
    }, [syncRound, syncQuestions, processRoundData, setInGame]);

    // 5. Team rankings listener for Lobby (Optional, mostly for waiting screen)
    useEffect(() => {
        if (gameState !== "waiting") return;
        const qTeams = query(collection(db, "teams"), orderBy("score", "desc"));
        const unsubscribe = onSnapshot(qTeams, (snap) => {
            setAllTeams(snap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));
        });
        return () => unsubscribe();
    }, [gameState]);

    // 6. Answer listener for current question
    useEffect(() => {
        if (loading || !currentQuestion) return;
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId) return;

        const unsubscribe = onSnapshot(doc(db, "answers", `${teamId}_${currentQuestion.id}`), (doc) => {
            if (doc.exists()) {
                const ansData = doc.data();
                setSubmitted(true); // Should already be true from handleSubmit, but ensures reloads work
                if (currentQuestion.type === "mcq") setMcqAnswer(ansData.answer);
                else if (currentQuestion.type === "mtf") setMtfAnswers(ansData.answer);
                else setTextAnswer(ansData.answer);

                setLastResult({
                    isCorrect: ansData.isCorrect,
                    points: ansData.points || 0,
                    streak: ansData.streak || team?.streak || 0,
                    message: ansData.isCorrect === true ? "Correct!" : ansData.isCorrect === false ? "Incorrect." : "Waiting for grading...",
                    pendingGrading: ansData.isCorrect === null,
                    mtfCorrectCount: ansData.mtfCorrectCount,
                    mtfTotalCount: ansData.mtfTotalCount,
                    correctAnswer: currentQuestion.type === "mcq" ? { type: "mcq", correctChoiceIndex: currentQuestion.correctChoiceIndex, choices: currentQuestion.choices } : (currentQuestion.type === "mtf" ? { type: "mtf", statements: currentQuestion.statements } : undefined)
                });
            } else {
                // Determine if we should really reset. If we are 'submitting', finding no document is expected briefly.
                // But if we are clearly in a new question or round, it's fine.
                // Generally safe to reset if NOT currently submitting.
                if (!submitting) {
                    setSubmitted(false);
                }
            }
        });
        return () => unsubscribe();
    }, [loading, currentQuestion, team?.streak, submitting]); // added submitting to deps

    // Force evaluation screen if submitted while playing
    useEffect(() => {
        if (submitted && gameState === "playing") {
            setGameState("waiting_grading");
        }
    }, [submitted, gameState]);

    // 7. Local timers & Auto-Submission & Game Loop
    useEffect(() => {
        const interval = setInterval(() => {
            // Re-run processRoundData periodically to update based on server time
            if (currentRound && roundQuestions.length > 0) {
                processRoundData(currentRound, roundQuestions);
            }
        }, 500); // Check every 500ms for responsiveness
        return () => clearInterval(interval);
    }, [currentRound, roundQuestions, processRoundData]);


    useEffect(() => {
        if (gameState === "countdown") {
            // pure UI decrement for smoothness, state is corrected by processRoundData
            // no-op, processRoundData handles it
        }
    }, [gameState]);

    useEffect(() => {
        // Auto-submit trigger
        // processRoundData sets timeLeft. If it hits 0, we must submit.
        if (gameState === "waiting_grading" && timeLeft !== null && timeLeft <= 0 && !submitted && !submitting) {
            latestHandleSubmit.current(true);
        }
    }, [gameState, timeLeft, submitted, submitting]);

    // Smooth UI timer decrement (optional, but good for UX between 500ms ticks)
    useEffect(() => {
        if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(t => t && t > 0 ? t - 1 : 0);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, timeLeft]);


    useEffect(() => {
        if (gameState === "playing" && !submitted && questionStartTime.current) {
            const interval = setInterval(() => setTimeSpent((now() - (questionStartTime.current || now())) / 1000), 100);
            return () => clearInterval(interval);
        }
    }, [gameState, submitted, now]);

    // --- HEARTBEAT / LOGIN TRACKING ---
    useEffect(() => {
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId) return;

        const reportPresence = async () => {
            try {
                await setDoc(doc(db, "presence", teamId), {
                    lastSeen: Date.now(),
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
                    connected: true,
                    teamId: teamId // redundant but helpful
                }, { merge: true });
            } catch (e) {
                console.error("Heartbeat fail", e);
            }
        };

        // Report immediately
        reportPresence();

        // Then every 30s
        const interval = setInterval(reportPresence, 30000);
        return () => clearInterval(interval);
    }, [team?.id]); // Re-run if team changes ID (e.g. login)

    return {
        loading, team, setTeam, currentRound, currentQuestion, roundQuestions, allTeams,
        mcqAnswer, setMcqAnswer, mtfAnswers, setMtfAnswers, textAnswer, setTextAnswer,
        gameState, timeLeft, countdownSeconds, answerRevealCountdown, timeSpent,
        submitted, submitting, lastResult,
        fetchTeam, handleSubmit, handleChallenge, handleLogout, handleRename
    };
}
