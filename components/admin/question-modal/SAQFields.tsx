import { Check } from "lucide-react";

interface SAQFieldsProps {
    correctAnswer: string;
    alternateAnswers: string;
    setCorrectAnswer: (v: string) => void;
    setAlternateAnswers: (v: string) => void;
}

export function SAQFields({ correctAnswer, alternateAnswers, setCorrectAnswer, setAlternateAnswers }: SAQFieldsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Answer Key</label>
                <div className="relative">
                    <div className="absolute left-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-admin-cyan/50">
                        <Check className="w-full h-full" />
                    </div>
                    <input
                        required
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Answer Key"
                        className="admin-input h-20 w-full rounded-[1.75rem] pl-16 pr-6 text-2xl font-black italic text-admin-cyan placeholder:text-admin-cyan/30"
                    />
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Alternative Acceptable Answers</label>
                    <span className="text-[10px] font-bold text-admin-muted">{alternateAnswers.split('\n').filter(s => s.trim().length > 0).length} Variants</span>
                </div>
                <textarea
                    value={alternateAnswers}
                    onChange={(e) => setAlternateAnswers(e.target.value)}
                    placeholder="Enter alternative correct answers, one per line..."
                    className="admin-input min-h-[150px] w-full rounded-[2rem] px-6 py-5 text-lg font-medium leading-relaxed resize-none text-white/80"
                />
            </div>
        </div>
    );
}
