export type Team = {
    id: string;
    name: string;
    group: number;
    score: number;
    status: "active" | "eliminated";
    isBot?: boolean;
};

export type Round = {
    id: string;
    status: "waiting" | "active" | "completed";
    startTime: number | null; // Unix timestamp (ms) when round starts
    currentQuestionIndex: number; // 0-indexed
    questionTimer: number; // seconds per question (default 10)
};

export type Question = {
    id: string;
    text: string;
    type: "mcq" | "essay";
    roundId: string;
    order: number;
    imageUrl?: string;
    choices?: { text: string }[];
    correctChoiceIndex?: number;
};

export type Answer = {
    id: string;
    teamId: string;
    questionId: string;
    answer: string | number;
    isCorrect: boolean | null;
    type: "essay" | "mcq";
    points?: number;
};

export const GROUPS = [1, 2, 3, 4, 5];
export const MAX_TEAMS_PER_GROUP = 6;
export const TOTAL_TEAMS = 30;
export const DEFAULT_QUESTION_TIMER = 10; // seconds
