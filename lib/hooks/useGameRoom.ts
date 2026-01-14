import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, query, collection, orderBy, updateDoc, onSnapshot, where, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState, SubmissionResult, requiresManualGrading, ANSWER_REVEAL_DURATION } from "@/app/game/types";
import { api } from "@/lib/api";

export function useGameRoom() {
    const router = useRouter();
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
        questionStartTime.current = Date.now();
        setTimeSpent(0);
    }, []);

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
            // Clear localStorage to prevent redirection loop if the team was deleted in Firestore
            localStorage.removeItem("medical_quiz_team_id");
            localStorage.removeItem("medical_quiz_team_name");
            localStorage.removeItem("medical_quiz_team_group");
            localStorage.removeItem("ingame");
            router.push("/");
            return null;
        }
    }, [router]);

    const checkMyAnswerStatus = useCallback(async (questionId: string) => {
        const teamId = localStorage.getItem("medical_quiz_team_id");
        if (!teamId || !questionId) return null;
        try {
            const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${questionId}`));
            if (answerDoc.exists()) return answerDoc.data();
        } catch (err) {
            console.error("Error checking answer status:", err);
        }
        return null;
    }, []);

    // State for raw data from Firestore
    const [syncRound, setSyncRound] = useState<Round | null>(null);
    const [syncQuestions, setSyncQuestions] = useState<Question[]>([]);

    // Identity tracking to avoid redundant resets
    const lastProcessedRoundId = useRef<string | null>(null);
    const lastProcessedQIdx = useRef<number | null>(null);

    const processRoundData = useCallback((round: Round, questions: Question[]) => {
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
                    resetAnswerState(question);
                }
                setCurrentQuestion(question);
            } else {
                setCurrentQuestion(null);
            }

            // 2. Time Calculations
            const now = Date.now();
            const startTime = round.startTime;
            const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
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

            const actualElapsedMs = now - startTime;
            const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
            const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
            const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);

            const timeRemaining = Math.max(0, questionTimer - elapsedSeconds);
            setTimeLeft(timeRemaining);

            // 3. Game State Determination
            if (round.showResults) {
                if (gameStateRef.current !== "answer_reveal") {
                    setAnswerRevealCountdown(ANSWER_REVEAL_DURATION);
                }
                setGameState("answer_reveal");
            } else if (round.pausedAt || elapsedSeconds >= questionTimer) {
                setGameState("waiting_grading");
                if (elapsedSeconds >= questionTimer && !round.pausedAt) {
                    api.gameAction("pauseForGrading", { roundId: round.id }).catch(console.error);
                }
            } else {
                setGameState("playing");
            }

            setInGame(true);
        } catch (err) {
            console.error("Error in processRoundData:", err);
        }
    }, [resetAnswerState, setInGame]);


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

        const finalTimeSpent = questionStartTime.current ? (Date.now() - questionStartTime.current) / 1000 : 100;
        setSubmitting(true);
        try {
            const result = await api.submitAnswer(team.id, currentQuestion.id, currentRound.id, answer, currentQuestion.type, Math.min(finalTimeSpent, 100));

            if (result.isCorrect !== null || result.points > 0) {
                setTeam({ ...team, score: (team.score || 0) + (result.points || 0), streak: result.streak });
            }

            setLastResult(result);
            setSubmitted(true);

            setGameState("waiting_grading");
            if (result.pendingGrading && requiresManualGrading(currentQuestion.type)) {
                await api.gameAction("pauseForGrading", { roundId: currentRound.id });
            }
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    }, [currentQuestion, team, currentRound, submitted, mcqAnswer, mtfAnswers, textAnswer]);

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
        setTeam({ ...team, name: newName });
    };

    // 1. Independent Team Load
    useEffect(() => {
        fetchTeam().then(() => setLoading(false));
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

    // 3. Questions Listener (Response to syncRound ID change)
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

        // Only process if both round and questions are available for an active round
        // unless it's a transition round with no questions yet
        processRoundData(syncRound, syncQuestions);
        setCurrentRound(syncRound);
        setRoundQuestions(syncQuestions);
    }, [syncRound, syncQuestions, processRoundData, setInGame]);

    // 5. Team rankings listener for Lobby
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
                setSubmitted(true);
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
                // If answer document is deleted (e.g. game reset), reset local submitted state
                // This is crucial for the "Init Game" and "Restart Round" flows
                setSubmitted(false);
            }
        });
        return () => unsubscribe();
    }, [loading, currentQuestion, team?.streak]);

    // Force evaluation screen if submitted while playing
    useEffect(() => {
        if (submitted && gameState === "playing") {
            setGameState("waiting_grading");
        }
    }, [submitted, gameState]);

    // 7. Local timers & Auto-Submission
    useEffect(() => {
        if (gameState === "countdown") {
            const timer = setInterval(() => setCountdownSeconds(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [gameState]);

    useEffect(() => {
        if (gameState === "answer_reveal") {
            const timer = setInterval(() => setAnswerRevealCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [gameState]);

    useEffect(() => {
        const timerActive = (gameState === "playing" || gameState === "waiting_grading") && timeLeft !== null && timeLeft >= 0;
        if (!timerActive) return;

        if (timeLeft <= 0) {
            if (!submitted && !submitting) latestHandleSubmit.current(true);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                const nv = (prev === null || prev <= 1) ? 0 : prev - 1;
                if (nv === 0 && !submitted && !submitting) {
                    latestHandleSubmit.current(true);
                }
                return nv;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, timeLeft === 0, submitted, submitting]);

    useEffect(() => {
        if (gameState === "playing" && !submitted && questionStartTime.current) {
            const interval = setInterval(() => setTimeSpent((Date.now() - (questionStartTime.current || Date.now())) / 1000), 100);
            return () => clearInterval(interval);
        }
    }, [gameState, submitted]);

    return {
        loading, team, setTeam, currentRound, currentQuestion, roundQuestions, allTeams,
        mcqAnswer, setMcqAnswer, mtfAnswers, setMtfAnswers, textAnswer, setTextAnswer,
        gameState, timeLeft, countdownSeconds, answerRevealCountdown, timeSpent,
        submitted, submitting, lastResult,
        fetchTeam, handleSubmit, handleChallenge, handleLogout, handleRename
    };
}

