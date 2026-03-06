import { FileQuestion, ArrowRight, StopCircle } from "lucide-react";
import { Question } from "@/lib/types";
import { motion } from "framer-motion";
import { AdminBadge, AdminEmptyState, AdminPanel } from "./AdminPrimitives";

interface QuestionManagerProps {
    selectedRoundId: string;
    questions: Question[];
    onSetQuestion: (roundId: string, qId: string | null) => void;
}

export function QuestionManager({ selectedRoundId, questions, onSetQuestion }: QuestionManagerProps) {
    const roundQuestions = questions
        .filter((q) => q.roundId === selectedRoundId)
        .sort((a, b) => a.order - b.order);

    return (
        <AdminPanel
            title="Question Rail"
            description={`Queued prompts for ${selectedRoundId}. Push the visible question without changing the underlying data model.`}
            icon={FileQuestion}
        >
            <div className="space-y-3">
                <motion.button
                    onClick={() => onSetQuestion(selectedRoundId, null)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-3 font-atsanee text-lg font-black uppercase italic text-amber-100"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <StopCircle className="h-4 w-4" />
                    Stop / Hide Question
                </motion.button>

                <div className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto pr-1">
                    {roundQuestions.map((q, idx) => (
                        <motion.div
                            key={q.id}
                            className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4 transition-all hover:border-admin-cyan/20"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/12 bg-gold/8 text-xs font-black text-gold">
                                            {q.order}
                                        </span>
                                        <AdminBadge tone="accent" className="px-3 py-1">
                                            {q.type}
                                        </AdminBadge>
                                        <AdminBadge
                                            tone={q.difficulty === "easy" ? "success" : q.difficulty === "medium" ? "warning" : "danger"}
                                            className="px-3 py-1"
                                        >
                                            {q.difficulty}
                                        </AdminBadge>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-white/82">
                                        {q.text || "(Image question)"}
                                    </p>
                                </div>
                                <motion.button
                                    onClick={() => onSetQuestion(selectedRoundId, q.id)}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-admin-cyan/20 bg-admin-cyan/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-admin-cyan"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Push <ArrowRight className="h-3 w-3" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}

                    {roundQuestions.length === 0 && (
                        <AdminEmptyState
                            icon={FileQuestion}
                            title="No Questions"
                            description="This round has no queued questions yet."
                            className="px-6 py-12"
                        />
                    )}
                </div>
            </div>
        </AdminPanel>
    );
}
