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
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Answer Key</label>
                <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-accent-blue/40">
                        <Check className="w-full h-full" />
                    </div>
                    <input
                        required
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Answer Key"
                        className="w-full h-20 bg-accent-blue/5 border border-accent-blue/20 rounded-3xl pl-16 pr-6 focus:outline-none focus:border-accent-blue/50 font-black text-2xl text-accent-blue italic transition-colors placeholder:text-accent-blue/20"
                    />
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Alternative Acceptable Answers</label>
                    <span className="text-[10px] font-bold text-muted">{alternateAnswers.split('\n').filter(s => s.trim().length > 0).length} Variants</span>
                </div>
                <textarea
                    value={alternateAnswers}
                    onChange={(e) => setAlternateAnswers(e.target.value)}
                    placeholder="Enter alternative correct answers, one per line..."
                    className="w-full bg-surface-bg/50 border border-surface-border rounded-[2rem] px-6 py-5 focus:outline-none focus:border-accent-blue/30 min-h-[150px] text-lg font-medium leading-relaxed resize-none text-foreground/70 transition-colors"
                />
            </div>
        </div>
    );
}
