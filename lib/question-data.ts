import { Question, QuestionType } from "@/lib/types";

type QuestionKeyData = {
    type?: QuestionType;
    correctChoiceIndex?: number | null;
    correctChoiceIndices?: number[] | null;
    statementTruths?: boolean[] | null;
    correctAnswer?: string | null;
    alternateAnswers?: string[] | null;
};

export function buildPublicQuestionData(question: Partial<Question> & { id: string; roundId: string; type: QuestionType; difficulty: Question["difficulty"]; order: number; }) {
    return {
        id: question.id,
        roundId: question.roundId,
        text: question.text || "",
        type: question.type,
        difficulty: question.difficulty,
        order: question.order,
        imageUrl: question.imageUrl || null,
        choices: question.choices || null,
        statements: question.statements?.map((statement) => ({ text: statement.text })) || null,
    };
}

export function buildQuestionKeyData(question: Partial<Question> & { type: QuestionType; }) {
    return {
        type: question.type,
        correctChoiceIndex: question.correctChoiceIndex ?? null,
        correctChoiceIndices: question.correctChoiceIndices || null,
        statementTruths: question.statements?.map((statement) => Boolean(statement.isTrue)) || null,
        correctAnswer: question.correctAnswer || null,
        alternateAnswers: question.alternateAnswers || null,
    };
}

export function mergeQuestionWithKey(
    questionData: Record<string, unknown>,
    keyData?: QuestionKeyData | null
): Question {
    const merged = { ...questionData } as Question;

    if (!keyData) {
        return merged;
    }

    if (merged.type === "mtf" && Array.isArray(merged.statements) && Array.isArray(keyData.statementTruths)) {
        merged.statements = merged.statements.map((statement, index) => ({
            ...statement,
            isTrue: keyData.statementTruths?.[index] ?? false,
        }));
    }

    if (typeof keyData.correctChoiceIndex === "number") {
        merged.correctChoiceIndex = keyData.correctChoiceIndex;
    }

    if (Array.isArray(keyData.correctChoiceIndices)) {
        merged.correctChoiceIndices = keyData.correctChoiceIndices;
    }

    if (typeof keyData.correctAnswer === "string") {
        merged.correctAnswer = keyData.correctAnswer;
    }

    if (Array.isArray(keyData.alternateAnswers)) {
        merged.alternateAnswers = keyData.alternateAnswers;
    }

    return merged;
}
