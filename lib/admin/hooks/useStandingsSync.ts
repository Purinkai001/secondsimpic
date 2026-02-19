"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, onSnapshot, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Round, Question, DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { GameState } from "@/lib/types";
import { ANSWER_REVEAL_DURATION } from "@/lib/constants";
import { useServerTime } from "@/lib/hooks/useServerTime";
import { useTeams } from "@/lib/hooks/useTeams";

export function useStandingsSync() {
    const { now, loading: timeLoading } = useServerTime();
    const allTeams = useTeams("score");

    const [loading, setLoading] = useState(true);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [gameState, setGameState] = useState<GameState>("waiting");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
    const [answerRevealCountdown, setAnswerRevealCountdown] = useState<number>(0);

    // Listen for Active Round and its Questions
    useEffect(() => {
        const q = query(collection(db, "rounds"), where("status", "==", "active"), limit(1));
        let unsubQuestions: (() => void) | null = null;
        let latestRound: Round | null = null;
        let latestQuestions: Question[] = [];

        const processState = (round: Round | null, questions: Question[]) => {
            if (!round || !round.startTime) {
                setGameState("waiting");
                setCurrentQuestion(null);
                return;
            }

            const serverNow = now();
            const timer = round.questionTimer || DEFAULT_QUESTION_TIMER;
            const pause = round.totalPauseDuration || 0;

            if (serverNow < round.startTime) {
                setGameState("countdown");
                setCountdownSeconds(Math.ceil((round.startTime - serverNow) / 1000));
                return;
            }

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

            const effective = Math.max(0, (serverNow - round.startTime) - pause);
            const left = timer - Math.floor(effective / 1000);
            setGameState("playing");
            setTimeLeft(left > 0 ? left : 0);
        };

        const unsubRound = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                latestRound = null;
                setCurrentRound(null);
                setCurrentQuestion(null);
                setGameState("waiting");
                setLoading(false);
                if (unsubQuestions) { unsubQuestions(); unsubQuestions = null; }
                return;
            }

            const round = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Round;
            latestRound = round;
            setCurrentRound(round);

            // Re-subscribe to questions if round changed
            if (unsubQuestions) unsubQuestions();
            const q2 = query(collection(db, "questions"), where("roundId", "==", round.id));
            unsubQuestions = onSnapshot(q2, (qSnapshot) => {
                latestQuestions = qSnapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id } as Question))
                    .sort((a, b) => a.order - b.order);
                processState(round, latestQuestions);
                setLoading(false);
            });
        });

        // Poll every 500ms to keep timer smooth
        const interval = setInterval(() => {
            if (latestRound) {
                processState(latestRound, latestQuestions);
            }
        }, 500);

        return () => {
            unsubRound();
            if (unsubQuestions) unsubQuestions();
            clearInterval(interval);
        };
    }, [now]);

    // Answer-reveal countdown
    useEffect(() => {
        if (gameState !== "answer_reveal") return;
        setAnswerRevealCountdown(ANSWER_REVEAL_DURATION);
        const i = setInterval(() => {
            setAnswerRevealCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(i);
    }, [gameState]);

    return {
        loading: loading || timeLoading,
        currentRound,
        currentQuestion,
        gameState,
        timeLeft,
        countdownSeconds,
        answerRevealCountdown,
        allTeams,
    };
}
