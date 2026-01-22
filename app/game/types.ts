import { QuestionType } from "@/lib/types";

// Re-export centralized types for convenience
export type { CorrectAnswerData, SubmissionResult } from "@/lib/types";

// Answer reveal duration in seconds
export const ANSWER_REVEAL_DURATION = 5;

// Question type labels with colors
export const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; color: string }> = {
    mcq: { label: "Multiple Choice", color: "bg-blue-500/20 text-blue-300" },
    mtf: { label: "Multiple True/False", color: "bg-purple-500/20 text-purple-300" },
    saq: { label: "Short Answer (Admin Graded)", color: "bg-green-500/20 text-green-300" },
    spot: { label: "Spot Diagnosis (Admin Graded)", color: "bg-orange-500/20 text-orange-300" },
};

// Difficulty labels with colors
export const DIFFICULTY_LABELS = {
    easy: { label: "Easy", color: "bg-green-600", points: 1 },
    medium: { label: "Medium", color: "bg-yellow-600", points: 2 },
    difficult: { label: "Difficult", color: "bg-red-600", points: 3 },
};

// Game state type
export type GameState = "waiting" | "countdown" | "playing" | "answer_reveal" | "waiting_grading";

// Check if question type requires manual grading
export const requiresManualGrading = (type: QuestionType): boolean => {
    return type === "saq" || type === "spot";
};
