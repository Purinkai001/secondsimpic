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
                            ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20",
                        submitted && "opacity-60 cursor-not-allowed"
                    )}
                >
                    <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 float-left transition-colors",
                        answer === idx ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                    )}>
                        {String.fromCharCode(65 + idx)}
                    </span>
                    {choice.text}
                </button>
            ))}
        </div>
    );
}
