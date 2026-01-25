"use client";

import { cn } from "@/lib/utils";
import { Question } from "@/lib/types";

interface MTFInputProps {
    question: Question;
    answers: (boolean | null)[];
    setAnswers: (answers: (boolean | null)[]) => void;
    submitted: boolean;
}

export function MTFInput({ question, answers, setAnswers, submitted }: MTFInputProps) {
    const handleSetAnswer = (idx: number, value: boolean) => {
        const newAnswers = [...answers];
        newAnswers[idx] = value;
        setAnswers(newAnswers);
    };

    return (
        <div className="space-y-3">
            {question.statements?.map((statement, idx) => (
                <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-surface-bg/50 rounded-xl border border-surface-border transition-colors group/row hover:border-accent-blue/20"
                >
                    <span className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-black text-sm shrink-0 border border-accent-blue/20">
                        {idx + 1}
                    </span>
                    <span className="flex-1 text-lg text-foreground group-hover/row:text-foreground/90">{statement.text}</span>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => handleSetAnswer(idx, true)}
                            disabled={submitted}
                            className={cn(
                                "px-4 py-2 rounded-lg font-black transition-all text-xs uppercase italic tracking-widest",
                                answers[idx] === true
                                    ? "bg-green-600 text-white shadow-lg shadow-green-600/20 outline outline-2 outline-green-500/50"
                                    : "bg-surface-bg border border-surface-border text-muted hover:bg-surface-bg/80 hover:text-foreground",
                                submitted && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            TRUE
                        </button>
                        <button
                            onClick={() => handleSetAnswer(idx, false)}
                            disabled={submitted}
                            className={cn(
                                "px-4 py-2 rounded-lg font-black transition-all text-xs uppercase italic tracking-widest",
                                answers[idx] === false
                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20 outline outline-2 outline-red-500/50"
                                    : "bg-surface-bg border border-surface-border text-muted hover:bg-surface-bg/80 hover:text-foreground",
                                submitted && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            FALSE
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
