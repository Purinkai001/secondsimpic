import { Difficulty, ScoreResult } from "./types";

/**
 * Calculate the speed factor based on time spent answering
 * Ranges from 1.00 (fastest) to 0.62 (slowest at 100s)
 */
export function calculateSpeedFactor(timeSpent: number): number {
    if (timeSpent < 0) return 1.0;
    if (timeSpent >= 100) return 0.62;

    // Speed factor decreases by 0.02 every 5 seconds
    const bracket = Math.floor(timeSpent / 5);
    const factors = [
        1.00, // 0-4.99s
        0.98, // 5-9.99s
        0.96, // 10-14.99s
        0.94, // 15-19.99s
        0.92, // 20-24.99s
        0.90, // 25-29.99s
        0.88, // 30-34.99s
        0.86, // 35-39.99s
        0.84, // 40-44.99s
        0.82, // 45-49.99s
        0.80, // 50-54.99s
        0.78, // 55-59.99s
        0.76, // 60-64.99s
        0.74, // 65-69.99s
        0.72, // 70-74.99s
        0.70, // 75-79.99s
        0.68, // 80-84.99s
        0.66, // 85-89.99s
        0.64, // 90-94.99s
        0.62, // 95-100s
    ];

    return factors[Math.min(bracket, factors.length - 1)];
}

/**
 * Calculate the streak factor based on consecutive correct answers
 * Max factor is 1.3 at streak of 4+
 */
export function calculateStreakFactor(streak: number): number {
    if (streak <= 0) return 1.0;
    if (streak === 1) return 1.0;
    if (streak === 2) return 1.1;
    if (streak === 3) return 1.2;
    return 1.3; // 4+
}

/**
 * Get the correct factor (points) based on difficulty
 */
export function getDifficultyPoints(difficulty: Difficulty): number {
    switch (difficulty) {
        case "easy":
            return 1;
        case "medium":
            return 2;
        case "difficult":
            return 3;
        default:
            return 1;
    }
}

/**
 * Calculate final score using the formula:
 * Score = 1000 × Correct × Speed × Streak
 * 
 * @param difficulty Question difficulty (determines Correct factor)
 * @param timeSpent Time spent answering in seconds
 * @param streak Current streak count (before this answer)
 * @param isCorrect Whether the answer is correct
 * @returns Calculated score (0 if incorrect)
 */
export function calculateScore(
    difficulty: Difficulty,
    timeSpent: number,
    streak: number,
    isCorrect: boolean
): number {
    if (!isCorrect) return 0;

    const correctFactor = getDifficultyPoints(difficulty);
    const speedFactor = calculateSpeedFactor(timeSpent);
    // For scoring, we use streak + 1 since this correct answer adds to streak
    const streakFactor = calculateStreakFactor(streak + 1);

    const score = 1000 * correctFactor * speedFactor * streakFactor;
    return Math.round(score); // Round to whole number
}

/**
 * Check if SAQ/Spot answer matches correctly (case-insensitive, trimmed)
 */
export function checkSAQAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalized = (s: string) => s.trim().toLowerCase();
    return normalized(userAnswer) === normalized(correctAnswer);
}


/**
 * Check MTF partial score
 */
export function checkMTFPartial(userAnswers: boolean[], correctAnswers: boolean[]): {
    correctCount: number;
    totalCount: number;
    allCorrect: boolean;
} {
    if (userAnswers.length !== correctAnswers.length) {
        return { correctCount: 0, totalCount: correctAnswers.length, allCorrect: false };
    }

    let correctCount = 0;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            correctCount++;
        }
    }

    return {
        correctCount,
        totalCount: correctAnswers.length,
        allCorrect: correctCount === correctAnswers.length,
    };
}



/**
 * Centralized logic to calculate score, streak, and correctness
 */
export function calculateAnswerScore(
    question: any, // Using any to deal with raw Firestore data flexibility
    answer: any,
    type: string,
    difficulty: Difficulty,
    timeSpent: number,
    currentStreak: number
): ScoreResult {
    let isCorrect: boolean | null = null;
    let correctAnswerData: any = null;
    let mtfStats = { correctCount: 0, totalCount: 0 };
    let points = 0;
    let newStreak = currentStreak;

    // 1. Determine Correctness
    switch (type) {
        case "mcq":
            if (question.correctChoiceIndex !== undefined) {
                isCorrect = answer === question.correctChoiceIndex;
                correctAnswerData = {
                    type: "mcq",
                    correctChoiceIndex: question.correctChoiceIndex,
                    choices: question.choices,
                };
            }
            break;
        case "mtf":
            if (question.statements && Array.isArray(answer)) {
                const correctAnswers = question.statements.map((s: { isTrue: boolean }) => s.isTrue);
                const mtfResult = checkMTFPartial(answer, correctAnswers);
                mtfStats = { correctCount: mtfResult.correctCount, totalCount: mtfResult.totalCount };
                isCorrect = mtfResult.allCorrect;
                correctAnswerData = { type: "mtf", statements: question.statements };
            }
            break;
        case "saq":
        case "spot":
            isCorrect = null; // Pending
            correctAnswerData = { type, pendingGrading: true };
            break;
        default:
            isCorrect = null;
    }

    // 2. Calculate Points & Streak
    if (type === "mtf") {
        if (isCorrect) {
            points = calculateScore(difficulty, timeSpent, currentStreak, true);
            newStreak = Math.min(currentStreak + 1, 4);
        } else {
            points = 0;
            newStreak = 0;
        }
    } else if (isCorrect === true) {
        points = calculateScore(difficulty, timeSpent, currentStreak, true);
        newStreak = Math.min(currentStreak + 1, 4);
    } else if (isCorrect === false) {
        newStreak = 0;
    }

    return {
        isCorrect,
        points,
        newStreak,
        mtfStats: type === "mtf" ? mtfStats : undefined,
        correctAnswerData
    };
}
