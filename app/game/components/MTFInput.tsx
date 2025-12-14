"use client";

import { cn } from "@/lib/utils";
import { Question } from "@/lib/types";

interface MTFInputProps {
    question: Question;
    answers: boolean[];
    setAnswers: (answers: boolean[]) => void;
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
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                >
                    <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                        {idx + 1}
                    </span>
                    <span className="flex-1 text-lg">{statement.text}</span>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => handleSetAnswer(idx, true)}
                            disabled={submitted}
                            className={cn(
                                "px-4 py-2 rounded-lg font-bold transition-all",
                                answers[idx] === true
                                    ? "bg-green-500 text-white"
                                    : "bg-white/10 text-slate-400 hover:bg-white/20",
                                submitted && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            TRUE
                        </button>
                        <button
                            onClick={() => handleSetAnswer(idx, false)}
                            disabled={submitted}
                            className={cn(
                                "px-4 py-2 rounded-lg font-bold transition-all",
                                answers[idx] === false
                                    ? "bg-red-500 text-white"
                                    : "bg-white/10 text-slate-400 hover:bg-white/20",
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
