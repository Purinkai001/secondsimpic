"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState, ANSWER_REVEAL_DURATION } from "@/app/game/types";
import { api } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export function useStandingsSync() {
    const [loading, setLoading] = useState(true);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [gameState, setGameState] = useState<GameState>("waiting");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    const currentQuestionIndex = useRef<number>(-1);
    const gameStateRef = useRef<GameState>("waiting");

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const fetchTeams = useCallback(async () => {
        try {
            const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("score", "desc")));
            setAllTeams(teamsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));
        } catch (err) { console.error("Error fetching teams for standings:", err); }
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
                setGameState("waiting");
                currentQuestionIndex.current = -1;
                return;
            }

            const round = data.round as Round;
            const questions = (data.questions || []) as Question[];

            setCurrentRound(round);

            if (round.pausedAt) {
                setGameState("waiting_grading");
                const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
                const totalTimePerQuestion = questionTimer + ANSWER_REVEAL_DURATION;
                const pauseDuration = round.totalPauseDuration || 0;
                const effectiveElapsed = Math.floor(((round.pausedAt - (round.startTime || round.pausedAt)) - pauseDuration) / 1000);
                const currentQIdx = Math.floor(effectiveElapsed / totalTimePerQuestion);

                if (currentQIdx >= 0 && currentQIdx < questions.length) {
                    setCurrentQuestion(questions[currentQIdx]);
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
                return;
            }

            if (now < startTime) {
                setGameState("countdown");
                setCountdownSeconds(Math.ceil((startTime - now) / 1000));
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

            if (currentQIdx >= questions.length) {
                setGameState("waiting");
                setCurrentQuestion(null);
                currentQuestionIndex.current = -1;
                return;
            }

            const question = questions[currentQIdx];
            setCurrentQuestion(question);

            if (isInQuestionPhase) {
                setTimeLeft(timeRemainingQuestion);
                setGameState("playing");
            } else {
                setAnswerRevealCountdown(timeRemainingReveal);
                setGameState("answer_reveal");
            }
        } catch (err) {
            console.error("Error fetching round data for standings:", err);
        }
    }, [currentRound?.id, currentRound?.startTime]);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchTeams(), fetchRoundData(true)]);
            setLoading(false);
        };
        init();
    }, [fetchRoundData, fetchTeams]);

    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetchTeams();
            fetchRoundData(false);
        }, 5000);
        return () => clearInterval(pollInterval);
    }, [fetchRoundData, fetchTeams, gameState]);

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
                    if (prev === null || prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, timeLeft]);

    return {
        loading,
        currentRound,
        currentQuestion,
        gameState,
        timeLeft,
        countdownSeconds,
        answerRevealCountdown,
        fetchRoundData,
        allTeams
    };
}
