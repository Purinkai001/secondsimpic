import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Round, Question, Answer, Challenge } from "@/lib/types";
import { useTeams } from "@/lib/hooks/useTeams";

export function useAdminDashboard() {
    const teams = useTeams("score");
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [rounds, setRounds] = useState<Round[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Answer[]>([]);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        const unsubRounds = onSnapshot(collection(db, "rounds"), (snap) => {
            setRounds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Round)));
            setLastUpdate(new Date());
        }, (err) => console.error("Rounds sync error:", err));

        const unsubQuestions = onSnapshot(query(collection(db, "questions"), orderBy("order", "asc")), (snap) => {
            setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
            setLastUpdate(new Date());
        }, (err) => console.error("Questions sync error:", err));

        const unsubAnswers = onSnapshot(query(collection(db, "answers"), orderBy("submittedAt", "desc")), (snap) => {
            const allAns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
            setAllAnswers(allAns);
            setPendingAnswers(allAns.filter(a => a.isCorrect === null));
            setLastUpdate(new Date());
        }, (err) => console.error("Answers sync error:", err));

        const unsubChallenges = onSnapshot(collection(db, "challenges"), (snap) => {
            const challengeData = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setChallenges(challengeData);
            setLastUpdate(new Date());
        }, (err) => {
            console.error("Challenges sync error details:", err);
            alert("Challenges sync error: " + err.message);
        });

        return () => {
            unsubRounds();
            unsubQuestions();
            unsubAnswers();
            unsubChallenges();
        };
    }, []);

    const activeTeamsCount = teams.filter(t => t.status === "active").length;
    const eliminatedCount = teams.filter(t => t.status === "eliminated").length;
    const botCount = teams.filter(t => t.isBot).length;
    const humanCount = teams.filter(t => !t.isBot).length;
    const pendingChallengesCount = challenges.filter(c => !c.dismissed).length;
    const activeRound = rounds.find(r => r.status === "active");

    return {
        teams, rounds, questions, pendingAnswers, allAnswers, challenges,
        activeTeamsCount, eliminatedCount, botCount, humanCount, pendingChallengesCount, activeRound,
        lastUpdate
    };
}
