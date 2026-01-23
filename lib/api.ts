import { Question, QuestionType } from "./types";
import { auth } from "@/lib/firebase";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    // Ensure auth is ready
    const user = auth.currentUser;
    if (!user) {
        // Double check if we might be in loading state? 
        // For admin usage, we expect them to be logged in.
        throw new Error("Not authenticated. Please log in.");
    }

    const token = await user.getIdToken();

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "API call failed");
    }
    return data;
}

export const api = {

    // Game/Admin Action APIs
    gameAction: (action: string, body: Record<string, unknown> = {}) =>
        fetchWithAuth("/api/game", {
            method: "POST",
            body: JSON.stringify({ action, ...body }),
        }),

    // Answer APIs (Student facing - No change to logic, just separation)
    submitAnswer: async (teamId: string, questionId: string, roundId: string, answer: string | number | (boolean | null)[], type: QuestionType, timeSpent: number) => {
        const res = await fetch("/api/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, questionId, roundId, answer, type, timeSpent }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submission failed");
        return data;
    },

    submitChallenge: async (teamId: string, teamName: string, questionId: string, questionText: string, roundId: string) => {
        const res = await fetch("/api/challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, teamName, questionId, questionText, roundId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Challenge failed");
        return data;
    },

    // Admin APIs (Require Token)
    dismissChallenge: (challengeId: string) =>
        fetchWithAuth("/api/challenge", {
            method: "PATCH",
            body: JSON.stringify({ challengeId }),
        }),


    // Question APIs
    getQuestions: (roundId: string) => fetchWithAuth(`/api/questions?roundId=${roundId}`),

    createQuestion: (question: Partial<Question>) =>
        fetchWithAuth("/api/questions", {
            method: "POST",
            body: JSON.stringify({ question }),
        }),

    updateQuestion: (questionId: string, updates: Partial<Question>) =>
        fetchWithAuth("/api/questions", {
            method: "PUT",
            body: JSON.stringify({ questionId, updates }),
        }),

    deleteQuestion: (questionId: string) =>
        fetchWithAuth("/api/questions", {
            method: "DELETE",
            body: JSON.stringify({ questionId }),
        }),

    // Seed/Bot APIs
    seedAction: (action: "seed" | "fillbots" | "removebots") =>
        fetchWithAuth(`/api/seed?action=${action}`),

    // Grade API
    gradeAnswer: (answerId: string, isCorrect: boolean) =>
        fetchWithAuth("/api/grade", {
            method: "POST",
            body: JSON.stringify({ answerId, isCorrect }),
        }),
};
