import { motion } from "framer-motion";
import { Timer, Zap, Brain, Activity, Image as ImageIcon } from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "../../types";

interface PlayingViewProps {
    question: Question | null;
    timeLeft: number | null;
    timeSpent: number;
    mcqAnswer: number | null;
    setMcqAnswer: (val: number) => void;
    mtfAnswers: boolean[];
    setMtfAnswers: (val: boolean[]) => void;
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
                        <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border border-white/10 shadow-lg", labels.color)}>
                            {labels.label}
                        </span>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">
                            Difficulty: <span className={cn("text-white", difficulty.color)}>{difficulty.label}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest pl-1">
                        <Activity className="w-3 h-3" />
                        Live Feed Status • Question Synchronized
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Response Time</p>
                        <p className="text-2xl font-black italic tracking-tighter text-cyan-400 font-mono leading-none">
                            {timeSpent.toFixed(1)}<span className="text-xs ml-0.5">s</span>
                        </p>
                    </div>

                    <div className={cn(
                        "relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center border backdrop-blur-3xl transition-all duration-500 shadow-2xl",
                        (timeLeft || 0) < 10
                            ? "bg-red-500/20 border-red-500/50 text-red-400 scale-110"
                            : "bg-white/5 border-white/10 text-white"
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
                className="w-full bg-white/[0.02] border border-white/10 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group"
            >
                {question.roundId === 'round-sd' && (
                    <div className="absolute top-0 left-0 right-0 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.5em] text-center italic shadow-2xl z-20 animate-pulse">
                        Sudden Death Elimination • No Room for Error
                    </div>
                )}
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] transform rotate-12">
                    <Brain className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 space-y-12">
                    {question.imageUrl && (
                        <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 group-hover:border-white/20 transition-all duration-700">
                            <img src={question.imageUrl} alt="Case Illustration" className="w-full h-full object-contain" />
                            <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> External Source Material
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-4 text-blue-400/60">
                            <Zap className="w-4 h-4 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Proctor Inquiry</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight italic tracking-tight">
                            {question.text || "Examine the clinical presentation and determine the most likely diagnosis."}
                        </h2>
                    </div>

                    <div className="space-y-4 pt-4">
                        {question.type === "mcq" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {question.choices?.map((choice, idx) => (
                                    <button
                                        key={idx}
                                        disabled={submitted}
                                        onClick={() => setMcqAnswer(idx)}
                                        className={cn(
                                            "group text-left p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                                            mcqAnswer === idx
                                                ? "bg-blue-500 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                                : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic transition-all duration-300",
                                                mcqAnswer === idx ? "bg-white text-blue-600 shadow-xl" : "bg-white/5 text-white/20 group-hover:bg-white/10"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={cn("text-xl font-bold tracking-tight", mcqAnswer === idx ? "text-white" : "text-white/80")}>
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
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl group/item hover:border-white/10 transition-all duration-300">
                                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black italic text-white/20">
                                                {idx + 1}
                                            </div>
                                            <span className="text-white/80 font-bold text-xl tracking-tight leading-snug">{s.text}</span>
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
                                                        ? "bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
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
                                                        ? "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                )}
                                            >False</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(question.type === "saq" || question.type === "spot") && (
                            <div className="relative group/input">
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/20 group-focus-within/input:text-blue-500 transition-all duration-500">
                                    <Brain className="w-full h-full" />
                                </div>
                                <input
                                    disabled={submitted}
                                    type="text"
                                    value={textAnswer}
                                    onChange={(e) => setTextAnswer(e.target.value)}
                                    placeholder="Enter clinical diagnosis..."
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] py-8 pl-20 pr-10 text-2xl font-black text-white italic placeholder:text-white/5 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-500 shadow-2xl"
                                />
                            </div>
                        )}
                    </div>

                    {!submitted && (
                        <div className="pt-8">
                            <button
                                disabled={submitting}
                                onClick={onSubmit}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-8 rounded-[2.5rem] text-2xl uppercase italic tracking-[0.3em] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden relative group/btn"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-current" />}
                                Submit Diagnosis
                            </button>
                            <p className="text-center text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] mt-6">Secure Uplink Established • Encryption Active</p>
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
