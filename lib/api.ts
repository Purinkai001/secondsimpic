import { Question, QuestionType } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

async function getAuthenticatedUser(): Promise<User> {
    if (auth.currentUser) {
        return auth.currentUser;
    }

    return await new Promise<User>((resolve, reject) => {
        const timeout = setTimeout(() => {
            unsubscribe();
            reject(new Error("Authentication timed out"));
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                return;
            }

            clearTimeout(timeout);
            unsubscribe();
            resolve(user);
        });
    });
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const user = await getAuthenticatedUser();
    if (!user) {
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
    joinTeam: (teamName: string) =>
        fetchWithAuth("/api/team", {
            method: "POST",
            body: JSON.stringify({ teamName }),
        }),

    renameTeam: (teamId: string, newName: string) =>
        fetchWithAuth("/api/team", {
            method: "PATCH",
            body: JSON.stringify({ teamId, newName }),
        }),

    verifyAdminSession: () => fetchWithAuth("/api/admin/session"),

    updateGameConfig: (config: Record<string, unknown>) =>
        fetchWithAuth("/api/admin/config", {
            method: "PATCH",
            body: JSON.stringify(config),
        }),

    resetScores: () =>
        fetchWithAuth("/api/admin/reset-scores", {
            method: "POST",
        }),

    kickTeam: (teamId: string) =>
        fetchWithAuth("/api/admin/kick", {
            method: "POST",
            body: JSON.stringify({ teamId }),
        }),

    kickAllTeams: () =>
        fetchWithAuth("/api/admin/kick", {
            method: "POST",
            body: JSON.stringify({ kickAll: true }),
        }),

    // Game/Admin Action APIs
    gameAction: (action: string, body: Record<string, unknown> = {}) =>
        fetchWithAuth("/api/game", {
            method: "POST",
            body: JSON.stringify({ action, ...body }),
        }),

    // Answer APIs (Student facing - No change to logic, just separation)
    submitAnswer: async (teamId: string, questionId: string, roundId: string, answer: string | number | (boolean | null)[], type: QuestionType, timeSpent: number) => {
        const data = await fetchWithAuth("/api/answer", {
            method: "POST",
            body: JSON.stringify({ teamId, questionId, roundId, answer, type, timeSpent }),
        });
        return data;
    },

    submitChallenge: async (teamId: string, questionId: string, questionText: string, roundId: string) => {
        const data = await fetchWithAuth("/api/challenge", {
            method: "POST",
            body: JSON.stringify({ teamId, questionId, questionText, roundId }),
        });
        return data;
    },

    // Admin APIs (Require Token)
    dismissChallenge: (challengeId: string) =>
        fetchWithAuth("/api/challenge", {
            method: "PATCH",
            body: JSON.stringify({ challengeId }),
        }),


    // Question APIs
    getQuestions: (roundId?: string) => fetchWithAuth(roundId ? `/api/questions?roundId=${roundId}` : "/api/questions"),

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
