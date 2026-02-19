import { motion } from "framer-motion";
import { Timer, Zap, Brain, Activity, Image as ImageIcon } from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/game/types/game";

interface PlayingViewProps {
    question: Question | null;
    timeLeft: number | null;
    timeSpent: number;
    mcqAnswer: number | null;
    setMcqAnswer: (val: number) => void;
    mtfAnswers: (boolean | null)[];
    setMtfAnswers: (val: (boolean | null)[]) => void;
    textAnswer: string;
    setTextAnswer: (val: string) => void;
    submitted: boolean;
    submitting: boolean;
    onSubmit: () => void;
}

export const PlayingView = ({
    question, timeLeft, timeSpent,
    mcqAnswer, setMcqAnswer,
    mtfAnswers, setMtfAnswers,
    textAnswer, setTextAnswer,
    submitted, submitting, onSubmit
}: PlayingViewProps) => {
    if (!question) return null;

    const labels = QUESTION_TYPE_LABELS[question.type] || { label: "Standard", color: "bg-blue-500/20 text-blue-300" };
    const difficultyKey = (question.difficulty || "easy").toLowerCase() as keyof typeof DIFFICULTY_LABELS;
    const difficulty = DIFFICULTY_LABELS[difficultyKey] || DIFFICULTY_LABELS.easy;

    return (
        <div className="max-w-5xl mx-auto w-full px-4">
            {/* Minimalist Status Bar */}
            <div className="flex justify-between items-end mb-8 px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-surface-border shadow-lg", labels.color)}>
                            {labels.label}
                        </span>
                        <div className="h-4 w-[1px] bg-surface-border" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                            Difficulty: <span className={cn("text-foreground", difficulty.color)}>{difficulty.label}</span>
                        </span>
                    </div>

                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Response Time</p>
                        <p className="text-2xl font-black italic tracking-tighter text-accent-cyan font-mono leading-none">
                            {timeSpent.toFixed(1)}<span className="text-xs ml-0.5">s</span>
                        </p>
                    </div>

                    <div className={cn(
                        "relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center border backdrop-blur-3xl transition-all duration-500 shadow-2xl",
                        (timeLeft || 0) < 10
                            ? "bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400 scale-110"
                            : "bg-surface-bg border-surface-border text-foreground"
                    )}>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Limit</p>
                        <span className="text-3xl font-black font-mono leading-none">{timeLeft}</span>
                        {(timeLeft || 0) < 10 && (
                            <div className="absolute inset-0 border-2 border-red-500/50 rounded-2xl animate-ping opacity-20" />
                        )}
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-surface-bg border border-surface-border rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] transform rotate-12">
                    <Brain className="w-64 h-64 text-foreground" />
                </div>

                <div className="relative z-10 space-y-12">
                    {/* DIAGNOSTIC OVERLAY */}
                    <div className="hidden">
                        DEBUG: {question.id} | Image: {question.imageUrl || 'MISSING'} | Keys: {Object.keys(question).join(', ')}
                    </div>

                    {question.imageUrl ? (
                        <div className="relative w-full min-h-[300px] aspect-video rounded-[2.5rem] overflow-hidden border-4 border-dashed border-accent-blue/50 shadow-2xl bg-surface-bg/80 group-hover:border-accent-blue/30 transition-all duration-700">
                            <img
                                src={question.imageUrl}
                                alt="Case Illustration"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    console.error(`[PlayingView] Image failed: ${question.imageUrl}`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        const err = document.createElement('div');
                                        err.className = "absolute inset-0 flex items-center justify-center text-red-500 font-bold bg-red-500/10 p-4 text-center";
                                        err.innerText = `IMAGE LOAD FAILED: ${question.imageUrl}`;
                                        parent.appendChild(err);
                                    }
                                }}
                            />

                        </div>
                    ) : (<div></div>)}

                    <div>
                        <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight break-words hyphens-auto">
                            {question.text || "Examine the clinical presentation and determine the most likely diagnosis."}
                        </h2>
                    </div>

                    <div className="space-y-4 pt-4">
                        {question.type === "mcq" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {question.choices?.map((choice, idx) => (
                                    <button
                                        key={idx}
                                        disabled={submitted}
                                        onClick={() => setMcqAnswer(idx)}
                                        className={cn(
                                            "group text-left p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 relative overflow-hidden min-h-[5rem] flex items-center",
                                            mcqAnswer === idx
                                                ? "bg-accent-blue border-accent-blue shadow-[0_0_30px_rgba(59,130,246,0.2)] text-white"
                                                : "bg-surface-bg border-surface-border text-muted hover:bg-surface-bg/80 hover:border-accent-blue/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 md:gap-5 relative z-10 w-full">
                                            <div className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shrink-0",
                                                mcqAnswer === idx ? "bg-white text-accent-blue shadow-xl" : "bg-surface-bg border border-surface-border text-muted/50 group-hover:bg-surface-bg/50"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={cn("text-base md:text-xl font-bold tracking-tight break-words hyphens-auto", mcqAnswer === idx ? "text-white" : "text-foreground/80 group-hover:text-foreground")}>
                                                {choice.text}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {question.type === "mtf" && (
                            <div className="grid grid-cols-1 gap-4">
                                {question.statements?.map((s, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-bg border border-surface-border rounded-3xl group/item hover:border-accent-blue/20 transition-all duration-300">
                                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                                            <div className="w-10 h-10 rounded-xl bg-surface-bg border border-surface-border flex items-center justify-center text-xs font-black italic text-muted/40">
                                                {idx + 1}
                                            </div>
                                            <span className="text-foreground/80 font-bold text-xl tracking-tight leading-snug group-hover/item:text-foreground">{s.text}</span>
                                        </div>
                                        <div className="flex gap-3 shrink-0">
                                            <button
                                                disabled={submitted}
                                                onClick={() => {
                                                    const newAns = [...mtfAnswers];
                                                    newAns[idx] = true;
                                                    setMtfAnswers(newAns);
                                                }}
                                                className={cn(
                                                    "flex-1 md:flex-none px-8 py-3 rounded-2xl border text-[10px] font-black uppercase italic transition-all duration-300 tracking-widest",
                                                    mtfAnswers[idx] === true
                                                        ? "bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                                        : "bg-surface-bg border-surface-border text-muted hover:bg-surface-bg/80 hover:text-foreground"
                                                )}
                                            >True</button>
                                            <button
                                                disabled={submitted}
                                                onClick={() => {
                                                    const newAns = [...mtfAnswers];
                                                    newAns[idx] = false;
                                                    setMtfAnswers(newAns);
                                                }}
                                                className={cn(
                                                    "flex-1 md:flex-none px-8 py-3 rounded-2xl border text-[10px] font-black uppercase italic transition-all duration-300 tracking-widest",
                                                    mtfAnswers[idx] === false
                                                        ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                                        : "bg-surface-bg border-surface-border text-muted hover:bg-surface-bg/80 hover:text-foreground"
                                                )}
                                            >False</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(question.type === "saq" || question.type === "spot") && (
                            <div className="relative group/input">
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted/20 group-focus-within/input:text-accent-blue transition-all duration-500">
                                    <Brain className="w-full h-full" />
                                </div>
                                <input
                                    disabled={submitted}
                                    type="text"
                                    value={textAnswer}
                                    onChange={(e) => setTextAnswer(e.target.value)}
                                    placeholder="ANSWER HERE BOY"
                                    className="w-full bg-surface-bg/50 border border-surface-border rounded-[2.5rem] py-8 pl-20 pr-10 text-2xl font-bold text-foreground placeholder:text-muted/10 outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 transition-all duration-500 shadow-2xl"
                                />
                            </div>
                        )}
                    </div>

                    {!submitted && (
                        <div className="pt-8">
                            <button
                                disabled={submitting}
                                onClick={onSubmit}
                                className="w-full bg-gradient-to-r from-accent-blue to-indigo-600 hover:opacity-90 text-white font-black py-8 rounded-[2.5rem] text-2xl uppercase italic tracking-[0.3em] shadow-2xl shadow-accent-blue/20 flex items-center justify-center gap-4 transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden relative group/btn"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-current" />}
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
);
