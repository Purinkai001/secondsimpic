import { useState, useEffect } from "react";
import { Team, Round, Question, Answer, Challenge } from "@/lib/types";
import { api } from "@/lib/api";

export function useAdminDashboard() {
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [teams, setTeams] = useState<Team[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Answer[]>([]);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    const fetchData = async () => {
        try {
            const data = await api.getAdminData();
            if (data.success) {
                setTeams(data.teams || []);
                setRounds(data.rounds || []);
                setQuestions(data.questions || []);
                setPendingAnswers(data.pendingAnswers || []);
                setAllAnswers(data.allAnswers || []);
                setChallenges(data.challenges || []);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        fetchData();
        const pollInterval = setInterval(fetchData, 3000);
        return () => clearInterval(pollInterval);
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
        lastUpdate, fetchData
    };
}
