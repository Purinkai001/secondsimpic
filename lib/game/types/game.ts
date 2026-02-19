// Consolidated into lib/types.ts and lib/constants.ts
// This file is kept for backward compatibility – will be deleted once all imports are updated
export type { GameState, CorrectAnswerData, SubmissionResult } from "@/lib/types";
export { requiresManualGrading } from "@/lib/types";
export { ANSWER_REVEAL_DURATION, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
