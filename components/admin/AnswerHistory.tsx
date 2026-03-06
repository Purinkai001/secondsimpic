import { FileText, Check, X, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Answer, Team, Question } from "@/lib/types";
import { motion } from "framer-motion";
import { AdminEmptyState, AdminPanel } from "./AdminPrimitives";

interface AnswerHistoryProps {
    answers: Answer[];
    teams: Team[];
    questions: Question[];
}

export function AnswerHistory({ answers, teams, questions }: AnswerHistoryProps) {
    const sortedAnswers = [...answers].sort((a, b) => {
        const aTime = (a as { submittedAt?: number }).submittedAt || 0;
        const bTime = (b as { submittedAt?: number }).submittedAt || 0;
        return bTime - aTime;
    });

    const recentAnswers = sortedAnswers.slice(0, 50);

    const getTeamName = (teamId: string) => {
        const team = teams.find((t) => t.id === teamId);
        return team?.name || `Team (${teamId.slice(0, 6)}...)`;
    };

    const getQuestionText = (questionId: string) => {
        const q = questions.find((question) => question.id === questionId);
        return q?.text?.substring(0, 40) + (q?.text && q.text.length > 40 ? "..." : "") || questionId;
    };

    return (
        <AdminPanel
            title="Answer History"
            description={`Recent answer feed (${answers.length} total).`}
            icon={FileText}
        >
            <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-1">
                {recentAnswers.length === 0 ? (
                    <AdminEmptyState
                        icon={MessageSquare}
                        title="No Answers"
                        description="No answers have been submitted yet."
                        className="px-6 py-10"
                    />
                ) : (
                    recentAnswers.map((a, idx) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                                "rounded-[1.4rem] border p-4 text-sm transition-all",
                                a.isCorrect === true
                                    ? "border-emerald-300/18 bg-emerald-300/10"
                                    : a.isCorrect === false
                                        ? "border-rose-300/18 bg-rose-300/10"
                                        : "border-amber-300/18 bg-amber-300/10"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "mt-0.5 rounded-xl p-2",
                                    a.isCorrect === true
                                        ? "bg-emerald-300/14"
                                        : a.isCorrect === false
                                            ? "bg-rose-300/14"
                                            : "bg-amber-300/14"
                                )}>
                                    {a.isCorrect === true ? (
                                        <Check className="h-3 w-3 text-emerald-100" />
                                    ) : a.isCorrect === false ? (
                                        <X className="h-3 w-3 text-rose-100" />
                                    ) : (
                                        <Clock className="h-3 w-3 text-amber-100" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-admin-muted">
                                        <span className="font-bold text-white/85">{getTeamName(a.teamId)}</span>
                                        <span className="text-white/25">•</span>
                                        <span className={cn(
                                            "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                                            a.type === "mcq" ? "bg-admin-cyan/14 text-admin-cyan" :
                                                a.type === "mtf" ? "bg-gold/12 text-gold" :
                                                    a.type === "saq" ? "bg-emerald-300/14 text-emerald-100" :
                                                        "bg-amber-300/14 text-amber-100"
                                        )}>
                                            {a.type}
                                        </span>
                                        <span className="text-white/25">•</span>
                                        <span className={cn(
                                            "font-bold",
                                            (a as { points?: number }).points && (a as { points?: number }).points! > 0 ? "text-emerald-100" : "text-admin-muted"
                                        )}>
                                            {(a as { points?: number }).points || 0} pts
                                        </span>
                                    </div>
                                    <div className="break-words text-xs text-white/60">{getQuestionText(a.questionId)}</div>
                                    <div className="mt-1 text-xs font-medium text-white/78">
                                        Answer: {typeof a.answer === "number" ? `Choice ${a.answer + 1}` :
                                            Array.isArray(a.answer) ? `[${a.answer.map((v) => v ? "T" : "F").join(", ")}]` :
                                                `"${a.answer}"`}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </AdminPanel>
    );
}
