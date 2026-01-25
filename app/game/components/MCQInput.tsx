"use client";

import { cn } from "@/lib/utils";
import { Question } from "@/lib/types";

interface MCQInputProps {
    question: Question;
    answer: number | null;
    setAnswer: (idx: number) => void;
    submitted: boolean;
}

export function MCQInput({ question, answer, setAnswer, submitted }: MCQInputProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.choices?.map((choice, idx) => (
                <button
                    key={idx}
                    onClick={() => setAnswer(idx)}
                    disabled={submitted}
                    className={cn(
                        "p-6 rounded-xl text-left transition-all border-2 text-lg font-medium",
                        answer === idx
                            ? "border-accent-blue bg-accent-blue/10 text-accent-blue shadow-lg shadow-accent-blue/5"
                            : "border-surface-border bg-surface-bg/50 text-foreground/70 hover:bg-surface-bg hover:border-accent-blue/20",
                        submitted && "opacity-60 cursor-not-allowed"
                    )}
                >
                    <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 float-left transition-colors",
                        answer === idx ? "bg-accent-blue text-white" : "bg-surface-bg border border-surface-border text-muted"
                    )}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-foreground">{choice.text}</span>
                </button>
            ))}
        </div>
    );
}
