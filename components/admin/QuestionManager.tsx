import { Question } from "@/lib/types";

interface QuestionManagerProps {
    selectedRoundId: string;
    questions: Question[];
    onSetQuestion: (roundId: string, qId: string | null) => void;
}

export function QuestionManager({ selectedRoundId, questions, onSetQuestion }: QuestionManagerProps) {
    const roundQuestions = questions.filter((q) => q.roundId === selectedRoundId);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Questions ({selectedRoundId})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                <button
                    onClick={() => onSetQuestion(selectedRoundId, null)}
                    className="w-full text-left p-2 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200 rounded hover:bg-yellow-100 mb-2 transition-colors"
                >
                    Stop/Hide Question
                </button>
                {roundQuestions.map((q) => (
                    <div key={q.id} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b">
                        <div className="text-sm truncate w-2/3">
                            <span className="font-bold mr-2 text-xs text-gray-400">#{q.id}</span>
                            {q.text}
                        </div>
                        <button
                            onClick={() => onSetQuestion(selectedRoundId, q.id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                            Push
                        </button>
                    </div>
                ))}
                {roundQuestions.length === 0 && (
                    <p className="text-gray-400 text-sm">No questions for this round.</p>
                )}
            </div>
        </div>
    );
}
