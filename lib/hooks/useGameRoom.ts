import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, query, collection, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    const [mtfAnswers, setMtfAnswers] = useState<boolean[]>([]);
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
            setMtfAnswers(new Array(question.statements.length).fill(false));
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

    const fetchRoundData = useCallback(async (skipRevealCheck = false) => {
        if (gameStateRef.current === "answer_reveal" && !skipRevealCheck) {
            return;
        }

        try {
            const data = await api.getRound();
            if (!data.success) return;

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

            if (currentRound?.id !== round.id) {
                resetAnswerState();
                currentQuestionIndex.current = -1;
            }

            setCurrentRound(round);
            setRoundQuestions(questions);

            if (round.pausedAt) {
                setGameState("waiting_grading");
                setInGame(true);
                const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
                const totalTimePerQuestion = questionTimer + ANSWER_REVEAL_DURATION;
                const pauseDuration = round.totalPauseDuration || 0;
                const effectiveElapsed = Math.floor(((round.pausedAt - (round.startTime || round.pausedAt)) - pauseDuration) / 1000);
                const currentQIdx = Math.floor(effectiveElapsed / totalTimePerQuestion);

                if (currentQIdx >= 0 && currentQIdx < questions.length) {
                    const question = questions[currentQIdx];
                    setCurrentQuestion(question);
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
                            message: myAnswer.isCorrect === null ? "Waiting for grading..." : myAnswer.isCorrect ? "Correct!" : "Incorrect.",
                            pendingGrading: myAnswer.isCorrect === null,
                        });
                    }
                }
                return;
            }

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

            const actualElapsedMs = now - startTime;
            const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
            const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
            const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);
            const currentQIdx = Math.floor(elapsedSeconds / totalTimePerQuestion);
            const timeIntoSlot = elapsedSeconds % totalTimePerQuestion;

            const isInQuestionPhase = timeIntoSlot < questionTimer;
            const timeRemainingQuestion = questionTimer - timeIntoSlot;
            const timeRemainingReveal = totalTimePerQuestion - timeIntoSlot;

            if (questions.length === 0) {
                setGameState("playing");
                setCurrentQuestion(null);
                setInGame(true);
                return;
            }

            if (currentQIdx >= questions.length) {
                setGameState("waiting");
                setCurrentQuestion(null);
                setInGame(false);
                currentQuestionIndex.current = -1;
                return;
            }

            const question = questions[currentQIdx];
            if (currentQuestionIndex.current !== currentQIdx) {
                currentQuestionIndex.current = currentQIdx;
                resetAnswerState(question);
            }

            setCurrentQuestion(question);
            setInGame(true);

            if (isInQuestionPhase) {
                setTimeLeft(timeRemainingQuestion);
                setGameState("playing");
                const teamId = localStorage.getItem("medical_quiz_team_id");
                if (teamId && question) {
                    const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
                    if (answerDoc.exists()) {
                        setSubmitted(true);
                        const ansData = answerDoc.data();
                        if (question.type === "mcq") setMcqAnswer(ansData.answer);
                        else if (question.type === "mtf") setMtfAnswers(ansData.answer);
                        else setTextAnswer(ansData.answer);

                        setLastResult({
                            isCorrect: ansData.isCorrect,
                            points: ansData.points || 0,
                            streak: ansData.streak || team?.streak || 0,
                            message: ansData.isCorrect === true ? "Correct!" : ansData.isCorrect === false ? "Incorrect." : "Waiting for grading...",
                            pendingGrading: ansData.isCorrect === null,
                            mtfCorrectCount: ansData.mtfCorrectCount,
                            mtfTotalCount: ansData.mtfTotalCount,
                        });
                        if (requiresManualGrading(question.type) && ansData.isCorrect === null) {
                            setGameState("waiting_grading");
                        }
                    }
                }
            } else {
                setAnswerRevealCountdown(timeRemainingReveal);
                setGameState("answer_reveal");
                const teamId = localStorage.getItem("medical_quiz_team_id");
                if (teamId && question && !lastResult) {
                    const answerDoc = await getDoc(doc(db, "answers", `${teamId}_${question.id}`));
                    if (answerDoc.exists()) {
                        const ansData = answerDoc.data();
                        setSubmitted(true);
                        setLastResult({
                            isCorrect: ansData.isCorrect,
                            points: ansData.points || 0,
                            streak: ansData.streak || team?.streak || 0,
                            message: ansData.isCorrect === true ? "Correct!" : ansData.isCorrect === false ? "Incorrect." : "Waiting for grading...",
                            pendingGrading: ansData.isCorrect === null,
                            mtfCorrectCount: ansData.mtfCorrectCount,
                            mtfTotalCount: ansData.mtfTotalCount,
                            correctAnswer: question.type === "mcq" ? { type: "mcq", correctChoiceIndex: question.correctChoiceIndex, choices: question.choices } : (question.type === "mtf" ? { type: "mtf", statements: question.statements } : undefined)
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching round data:", err);
        }
    }, [currentRound?.id, resetAnswerState, lastResult, team?.streak, checkMyAnswerStatus, setInGame, currentRound?.startTime]);

    // Submission Logic
    const handleSubmit = async (forceEmpty = false) => {
        if (!currentQuestion || !team || !currentRound || submitted) return;

        let answer: string | number | boolean[] | null = null;
        if (currentQuestion.type === "mcq") answer = mcqAnswer;
        else if (currentQuestion.type === "mtf") answer = mtfAnswers;
        else answer = textAnswer;

        if (answer === null && !forceEmpty) return;
        if (answer === null && forceEmpty && (currentQuestion.type === "saq" || currentQuestion.type === "spot")) answer = "";
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

            if (result.pendingGrading && requiresManualGrading(currentQuestion.type)) {
                await api.gameAction("pauseForGrading", { roundId: currentRound.id });
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

    // Effects
    useEffect(() => {
        const init = async () => {
            await fetchTeam();
            await fetchRoundData(true);
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (gameState !== "waiting") return;
        const fetchTeams = async () => {
            try {
                const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("score", "desc")));
                setAllTeams(teamsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));
            } catch (err) { console.error(err); }
        };
        fetchTeams();
        const interval = setInterval(fetchTeams, 5000);
        return () => clearInterval(interval);
    }, [gameState]);

    useEffect(() => {
        if (loading) return;
        const interval = isInGame() ? 3000 : 5000;
        const pollInterval = setInterval(async () => {
            if (!isInGame()) await fetchRoundData(true);
            else await fetchRoundData(false);
        }, interval);
        return () => clearInterval(pollInterval);
    }, [loading, fetchRoundData, gameState, isInGame]);

    useEffect(() => {
        if (gameState === "countdown") {
            const timer = setInterval(() => {
                setCountdownSeconds(prev => {
                    if (prev <= 1) { fetchRoundData(true); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, fetchRoundData]);

    useEffect(() => {
        if (gameState === "answer_reveal") {
            const timer = setInterval(() => {
                setAnswerRevealCountdown(prev => {
                    if (prev <= 1) { fetchRoundData(true); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, fetchRoundData]);

    useEffect(() => {
        if (gameState === "playing" && timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        if (!submitted) handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, timeLeft, submitted]);

    useEffect(() => {
        if (gameState === "playing" && !submitted && questionStartTime.current) {
            const interval = setInterval(() => {
                setTimeSpent((Date.now() - (questionStartTime.current || Date.now())) / 1000);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameState, submitted]);

    return {
        loading, team, setTeam, currentRound, currentQuestion, roundQuestions, allTeams,
        mcqAnswer, setMcqAnswer, mtfAnswers, setMtfAnswers, textAnswer, setTextAnswer,
        gameState, timeLeft, countdownSeconds, answerRevealCountdown, timeSpent,
        submitted, submitting, lastResult,
        fetchTeam, fetchRoundData, handleSubmit, handleChallenge, handleLogout, handleRename
    };
}
