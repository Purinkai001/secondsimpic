export type Team = {
    id: string;
    name: string;
    group: number;
    score: number;
    status: "active" | "eliminated" | "winner";
    isBot?: boolean;
    challengesRemaining: number; // 2 challenges per team across 5 turns
    streak: number; // consecutive correct answers (0-4+)
};

export type Round = {
    id: string;
    status: "waiting" | "active" | "completed";
    startTime: number | null; // Unix timestamp (ms) when round starts
    currentQuestionIndex: number; // 0-indexed
    questionTimer: number; // seconds per question (default 100)
    // For SAQ/Spot grading pauses
    pausedAt?: number | null; // timestamp when paused for grading
    totalPauseDuration?: number; // accumulated pause time in ms
    showResults?: boolean; // whether to reveal the answer to contestants
};

export type QuestionType = "mcq" | "mtf" | "saq" | "spot";
export type Difficulty = "easy" | "medium" | "difficult";

// MTF statement structure
export type MTFStatement = {
    text: string;
    isTrue: boolean;
};

export type Question = {
    id: string;
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    roundId: string;
    order: number;
    imageUrl?: string;
    // For MCQ
    choices?: { text: string }[];
    correctChoiceIndex?: number;
    // For MTF (Multiple True/False)
    statements?: MTFStatement[];
    // For SAQ and Spot - correct answer (must match exactly)
    correctAnswer?: string;
};

export type Answer = {
    id: string;
    teamId: string;
    questionId: string;
    roundId: string;
    answer: string | number | (boolean | null)[]; // boolean[] for MTF answers
    isCorrect: boolean | null;
    type: QuestionType;
    points: number;
    timeSpent: number; // seconds spent answering
    submittedAt: number; // timestamp
    pendingGrading?: boolean;
};

// Challenge alert for admin
export type Challenge = {
    id: string;
    teamId: string;
    teamName: string;
    questionId: string;
    questionText: string;
    roundId: string;
    createdAt: number;
    dismissed: boolean;
};

export const GROUPS = [1, 2, 3, 4, 5];
export const MAX_TEAMS_PER_GROUP = 6;
export const TOTAL_TEAMS = 30;
export const DEFAULT_QUESTION_TIMER = 90; // seconds
