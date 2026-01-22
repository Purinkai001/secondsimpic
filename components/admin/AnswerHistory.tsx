import { FileText, Check, X, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Answer, Team, Question } from "@/lib/types";
import { motion } from "framer-motion";

interface AnswerHistoryProps {
    answers: Answer[];
    teams: Team[];
    questions: Question[];
}

export function AnswerHistory({ answers, teams, questions }: AnswerHistoryProps) {
    // Sort by submittedAt descending
    const sortedAnswers = [...answers].sort((a, b) => {
        const aTime = (a as any).submittedAt || 0;
        const bTime = (b as any).submittedAt || 0;
        return bTime - aTime;
    });

    // Only show last 50 answers
    const recentAnswers = sortedAnswers.slice(0, 50);

    const getTeamName = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || `Team (${teamId.slice(0, 6)}...)`;
    };

    const getQuestionText = (questionId: string) => {
        const q = questions.find(q => q.id === questionId);
        return q?.text?.substring(0, 40) + (q?.text && q.text.length > 40 ? "..." : "") || questionId;
    };

    return (
        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-400" />
                </div>
                Answer History
                <span className="text-sm font-normal text-white/50 ml-2">({answers.length} total)</span>
            </h2>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {recentAnswers.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                        <p className="text-white/30 text-sm">No answers submitted yet</p>
                    </div>
                ) : (
                    recentAnswers.map((a, idx) => (
                        <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                                "p-3 rounded-xl border text-sm flex items-start gap-3 transition-all",
                                a.isCorrect === true
                                    ? "bg-green-500/10 border-green-500/20"
                                    : a.isCorrect === false
                                        ? "bg-red-500/10 border-red-500/20"
                                        : "bg-yellow-500/10 border-yellow-500/20"
                            )}
                        >
                            <div className={cn(
                                "shrink-0 mt-0.5 p-1.5 rounded-lg",
                                a.isCorrect === true
                                    ? "bg-green-500/20"
                                    : a.isCorrect === false
                                        ? "bg-red-500/20"
                                        : "bg-yellow-500/20"
                            )}>
                                {a.isCorrect === true ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                ) : a.isCorrect === false ? (
                                    <X className="w-3 h-3 text-red-400" />
                                ) : (
                                    <Clock className="w-3 h-3 text-yellow-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs text-white/50 mb-1 flex-wrap">
                                    <span className="font-bold text-white/80">{getTeamName(a.teamId)}</span>
                                    <span>•</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                                        a.type === "mcq" ? "bg-blue-500/20 text-blue-400" :
                                            a.type === "mtf" ? "bg-purple-500/20 text-purple-400" :
                                                a.type === "saq" ? "bg-green-500/20 text-green-400" :
                                                    "bg-orange-500/20 text-orange-400"
                                    )}>
                                        {a.type}
                                    </span>
                                    <span>•</span>
                                    <span className={cn(
                                        "font-bold",
                                        (a as any).points > 0 ? "text-green-400" : "text-white/30"
                                    )}>
                                        {(a as any).points || 0} pts
                                    </span>
                                </div>
                                <div className="text-white/40 break-words text-xs">{getQuestionText(a.questionId)}</div>
                                <div className="mt-1 text-white/70 font-medium text-xs">
                                    Answer: {typeof a.answer === "number" ? `Choice ${a.answer + 1}` :
                                        Array.isArray(a.answer) ? `[${a.answer.map(v => v ? "T" : "F").join(", ")}]` :
                                            `"${a.answer}"`}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
