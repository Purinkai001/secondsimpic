"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, onSnapshot, orderBy, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team, Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState } from "@/app/game/types";

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

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setCurrentRound(null);
                setCurrentQuestion(null);
                setGameState("waiting");
                setLoading(false);
                return;
            }

            const round = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Round;
            setCurrentRound(round);

            // If round changed or first time, sync questions
            if (unsubQuestions) unsubQuestions();

            const q2 = query(collection(db, "questions"), where("roundId", "==", round.id), orderBy("order", "asc"));
            unsubQuestions = onSnapshot(q2, (qSnapshot) => {
                const questions = qSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Question));
                processState(round, questions);
                setLoading(false);
            });
        });

        return () => {
            unsubscribe();
            if (unsubQuestions) unsubQuestions();
        };
    }, []);

    const processState = (round: Round, questions: Question[]) => {
        const now = Date.now();
        const startTime = round.startTime;
        const questionTimer = round.questionTimer || DEFAULT_QUESTION_TIMER;
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

        // Manual flow logic
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
        const actualElapsedMs = now - startTime;
        const safePauseDuration = Math.min(pauseDuration, actualElapsedMs);
        const effectiveElapsedMs = Math.max(0, actualElapsedMs - safePauseDuration);
        const elapsedSeconds = Math.floor(effectiveElapsedMs / 1000);

        // In the new flow, we don't calculate index from time, we use the admin's index.
        // We only care if we are in the "playing" time window.
        // But for standings/observer, we just follow the admin's lead.
        // If it's not paused and not revealing, it's playing.
        setGameState("playing");
        const timeRemaining = questionTimer - elapsedSeconds;
        setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
    };

    // UI Timers
    useEffect(() => {
        const timer = setInterval(() => {
            if (currentRound && gameState === "playing") {
                // Approximate local decrement for smooth UI
                setTimeLeft(prev => (prev != null && prev > 0 ? prev - 1 : 0));
            }
            if (currentRound && gameState === "countdown") {
                setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, currentRound]);

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
