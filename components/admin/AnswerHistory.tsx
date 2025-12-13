import { FileText, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Answer, Team, Question } from "@/lib/types";

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

    const getTeamName = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || `Team (${teamId.slice(0, 6)}...)`;
    };

    const getQuestionText = (questionId: string) => {
        const q = questions.find(q => q.id === questionId);
        return q?.text?.substring(0, 50) + (q?.text && q.text.length > 50 ? "..." : "") || questionId;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> All Answers ({answers.length})
            </h2>
            <div className="max-h-80 overflow-y-auto space-y-2">
                {sortedAnswers.length === 0 ? (
                    <p className="text-gray-400 italic text-sm">No answers submitted yet.</p>
                ) : (
                    sortedAnswers.map((a) => (
                        <div
                            key={a.id}
                            className={cn(
                                "p-3 rounded-lg border text-sm flex items-start gap-3",
                                a.isCorrect === true ? "bg-green-50 border-green-200" :
                                    a.isCorrect === false ? "bg-red-50 border-red-200" :
                                        "bg-yellow-50 border-yellow-200"
                            )}
                        >
                            <div className="shrink-0 mt-0.5">
                                {a.isCorrect === true ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : a.isCorrect === false ? (
                                    <X className="w-4 h-4 text-red-600" />
                                ) : (
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                    <span className="font-bold text-gray-700">{getTeamName(a.teamId)}</span>
                                    <span>•</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                                        a.type === "mcq" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                    )}>
                                        {a.type}
                                    </span>
                                    <span>•</span>
                                    <span>{(a as any).points || 0} pts</span>
                                </div>
                                <div className="text-gray-600 truncate">{getQuestionText(a.questionId)}</div>
                                <div className="mt-1 text-gray-800 font-medium">
                                    Answer: {typeof a.answer === "number" ? `Choice ${a.answer + 1}` : `"${a.answer}"`}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
