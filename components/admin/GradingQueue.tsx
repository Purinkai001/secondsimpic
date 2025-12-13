import { Gavel, Check, X } from "lucide-react";
import { Answer, Team } from "@/lib/types";

interface GradingQueueProps {
    pendingAnswers: Answer[];
    teams: Team[];
    onGrade: (answer: Answer, correct: boolean) => void;
}

export function GradingQueue({ pendingAnswers, teams, onGrade }: GradingQueueProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-purple-600" /> Grading Queue ({pendingAnswers.length})
            </h2>
            {pendingAnswers.length === 0 ? (
                <p className="text-gray-400 italic">No pending essays.</p>
            ) : (
                <div className="space-y-4">
                    {pendingAnswers.map((a) => {
                        const t = teams.find((team) => team.id === a.teamId);
                        return (
                            <div
                                key={a.id}
                                className="p-4 border rounded-lg bg-purple-50 flex flex-col md:flex-row gap-4 justify-between items-start"
                            >
                                <div>
                                    <div className="font-bold text-sm text-purple-900 mb-1">
                                        {t?.name || a.teamId} (Group {t?.group})
                                    </div>
                                    <div className="text-gray-700 italic">"{a.answer}"</div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => onGrade(a, true)}
                                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onGrade(a, false)}
                                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
