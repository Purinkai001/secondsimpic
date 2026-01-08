import { Question, Round, Team, Answer, QuestionType } from "./types";

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "admin123";

async function fetchWithKey(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
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
    // Round APIs
    getRound: () => fetchWithKey("/api/round"),

    // Game/Admin Action APIs
    gameAction: (action: string, body: Record<string, unknown> = {}) =>
        fetchWithKey("/api/game", {
            method: "POST",
            body: JSON.stringify({ action, key: ADMIN_KEY, ...body }),
        }),

    // Answer APIs
    submitAnswer: (teamId: string, questionId: string, roundId: string, answer: string | number | boolean[], type: QuestionType, timeSpent: number) =>
        fetchWithKey("/api/answer", {
            method: "POST",
            body: JSON.stringify({ teamId, questionId, roundId, answer, type, timeSpent }),
        }),

    // Challenge APIs
    submitChallenge: (teamId: string, teamName: string, questionId: string, questionText: string, roundId: string) =>
        fetchWithKey("/api/challenge", {
            method: "POST",
            body: JSON.stringify({ teamId, teamName, questionId, questionText, roundId }),
        }),

    dismissChallenge: (challengeId: string) =>
        fetchWithKey("/api/challenge", {
            method: "PATCH",
            body: JSON.stringify({ challengeId, key: ADMIN_KEY }),
        }),

    // Admin Data API
    getAdminData: () => fetchWithKey(`/api/admin?key=${ADMIN_KEY}`),

    // Question APIs
    getQuestions: (roundId: string) => fetchWithKey(`/api/questions?key=${ADMIN_KEY}&roundId=${roundId}`),

    createQuestion: (question: Partial<Question>) =>
        fetchWithKey("/api/questions", {
            method: "POST",
            body: JSON.stringify({ key: ADMIN_KEY, question }),
        }),

    updateQuestion: (questionId: string, updates: Partial<Question>) =>
        fetchWithKey("/api/questions", {
            method: "PUT",
            body: JSON.stringify({ key: ADMIN_KEY, questionId, updates }),
        }),

    deleteQuestion: (questionId: string) =>
        fetchWithKey("/api/questions", {
            method: "DELETE",
            body: JSON.stringify({ key: ADMIN_KEY, questionId }),
        }),

    // Seed/Bot APIs
    seedAction: (action: "seed" | "fillbots" | "removebots") =>
        fetchWithKey(`/api/seed?key=${ADMIN_KEY}&action=${action}`),

    // Grade API
    gradeAnswer: (answerId: string, isCorrect: boolean) =>
        fetchWithKey("/api/grade", {
            method: "POST",
            body: JSON.stringify({ answerId, isCorrect, key: ADMIN_KEY }),
        }),
};
