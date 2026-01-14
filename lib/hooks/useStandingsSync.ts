"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, onSnapshot, orderBy, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState } from "@/app/game/types";
import { useServerTime } from "./useServerTime";

export function useStandingsSync() {
    const { now, loading: timeLoading } = useServerTime();
    const [loading, setLoading] = useState(true);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [gameState, setGameState] = useState<GameState>("waiting");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);
    const [allTeams, setAllTeams] = useState<Team[]>([]);

    // 1. Listen for Teams
    useEffect(() => {
        const q = query(collection(db, "teams"), orderBy("score", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teams = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Team));
            setAllTeams(teams);
        });
        return () => unsubscribe();
    }, []);

    // 2. Listen for Active Round and Questions
    useEffect(() => {
        const q = query(collection(db, "rounds"), where("status", "==", "active"), limit(1));
        let unsubQuestions: (() => void) | null = null;
        let activeRound: Round | null = null;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setCurrentRound(null);
                setCurrentQuestion(null);
                setGameState("waiting");
                setLoading(false);
                return;
            }

            const round = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Round;
            activeRound = round;
            setCurrentRound(round);

            // If round changed or first time, sync questions
            if (unsubQuestions) unsubQuestions();

            const q2 = query(collection(db, "questions"), where("roundId", "==", round.id));
            unsubQuestions = onSnapshot(q2, (qSnapshot) => {
                const questions = qSnapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id } as Question))
                    .sort((a, b) => a.order - b.order);
                processState(round, questions); // Call immediately with whatever time we have
                setLoading(false);
            });
        });

        // Loop to update timer based on server time
        const interval = setInterval(() => {
            if (activeRound) {
                // We don't have questions in this scope easily without ref, but processState is internal. 
                // Actually this loop structure is weak. 
                // Better: trigger a re-render or effect dep on `now()`.
                // But `now()` doesn't change state. 
                // We can use a ticker.
            }
        }, 1000);

        return () => {
            unsubscribe();
            if (unsubQuestions) unsubQuestions();
            clearInterval(interval);
        };
    }, []);

    const processState = (round: Round | null, questions: Question[]) => {
        if (!round) return;

        const serverNow = now();
        const startTime = round.startTime;
        const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
        const pauseDuration = round.totalPauseDuration || 0;

        if (!startTime) {
            setGameState("waiting");
            return;
        }

        if (serverNow < startTime) {
            setGameState("countdown");
            setCountdownSeconds(Math.ceil((startTime - serverNow) / 1000));
            return;
        }

        // Manual flow logic (fallback)
        const qIdx = round.currentQuestionIndex || 0;
        if (qIdx >= questions.length) {
            setGameState("waiting");
            setCurrentQuestion(null);
            return;
        }

        const question = questions[qIdx];
        setCurrentQuestion(question);

        if (round.showResults) {
            setGameState("answer_reveal");
            return;
        }

        if (round.pausedAt) {
            setGameState("waiting_grading");
            return;
        }

        // Timer logic
        const actualElapsedMs = serverNow - startTime;
        const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
        const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
        const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);

        setGameState("playing");
        const timeRemaining = questionTimer - elapsedSeconds;
        setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
    };

    // Re-run process state periodically
    useEffect(() => {
        const interval = setInterval(() => {
            // force update logic... 
            // Actually `useServerTime` doesn't expose a ticking state, intentionally. 
            // But we need to update the UI.
            if (currentRound && currentQuestion) {
                // re-process? We need the questions list. 
                // simpler to just decrement timeLeft locally like before, but synced to serverNow on major events.
                // or just trust the processState logic if we had access to dynamic now.
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [currentRound, currentQuestion]);

    // Better Re-run approach:
    useEffect(() => {
        if (!currentRound) return;
        // poll every 500ms to update time left
        const i = setInterval(() => {
            const serverNow = now();
            const startTime = currentRound.startTime;
            if (startTime && serverNow >= startTime) {
                const effective = Math.max(0, (serverNow - startTime) - (currentRound.totalPauseDuration || 0));
                const elapsed = Math.floor(effective / 1000);
                const left = (currentRound.questionTimer || DEFAULT_QUESTION_TIMER) - elapsed;
                setTimeLeft(left > 0 ? left : 0);
            } else if (startTime && serverNow < startTime) {
                setCountdownSeconds(Math.ceil((startTime - serverNow) / 1000));
            }
        }, 500);
        return () => clearInterval(i);
    }, [currentRound, now]);


    return {
        loading,
        currentRound,
        currentQuestion,
        gameState,
        timeLeft,
        countdownSeconds,
        answerRevealCountdown,
        allTeams
    };
}
