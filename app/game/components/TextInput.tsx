"use client";

import { cn } from "@/lib/utils";
import { QuestionType } from "@/lib/types";

interface TextInputProps {
    type: QuestionType;
    value: string;
    setValue: (value: string) => void;
    submitted: boolean;
}

export function TextInput({ type, value, setValue, submitted }: TextInputProps) {
    const isSpot = type === "spot";

    return (
        <div className="space-y-3">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isSpot ? "Identify the diagnosis..." : "Type your answer here..."}
                disabled={submitted}
                className={cn(
                    "w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 text-lg",
                    isSpot ? "focus:ring-orange-500" : "focus:ring-blue-500",
                    submitted && "opacity-60 cursor-not-allowed"
                )}
                autoComplete="off"
            />
            <p className="text-white/40 text-sm text-center">
                ⚠️ Admin will grade this answer manually. Timer will pause until grading is complete.
            </p>
        </div>
    );
}
