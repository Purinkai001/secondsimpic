import { motion } from "framer-motion";
import { BadgeCheck, XCircle, Loader2 } from "lucide-react";
import Correct from "@/vectors/Correct";
import { SubmissionResult } from "@/lib/game/types/game";
import { cn } from "@/lib/utils";
import { Question } from "@/lib/types";

interface AnswerRevealViewProps {
    result: SubmissionResult | null;
    countdown: number;
    onChallenge: () => void;
    question: Question | null;
}

export const AnswerRevealView = ({ result, countdown, onChallenge, question }: AnswerRevealViewProps) => {
    const isProcessing = !result;
    if (!question) return null;
    const [, , turnNum, questionNum] = question.id.split('-');

    

    // Fallback content if results are still loading/syncing
    if (isProcessing) {
        return (
            <div className="max-w-4xl mx-auto w-full text-center py-20">
                <div className="p-10 bg-surface-bg border border-surface-border rounded-[3rem] inline-block mb-10 shadow-xl">
                    <Loader2 className="w-20 h-20 text-accent-blue animate-spin" />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-4 uppercase italic tracking-tighter">Synchronizing Results</h2>
                <p className="text-muted text-lg">Finalizing score verification for all teams...</p>
            </div>
        );
    }

    return (
        <div className="w-[90vw] pt-6">
            <h1 className="font-atsanee text-8xl italic font-black bg-shiny bg-clip-text text-transparent uppercase tracking-widerfont-black text-center mb-6">
                TURN {turnNum} QUESTION {questionNum} 
            </h1>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-myBackground border-[3px] border-[#c8a951] rounded-[40px] overflow-hidden shadow-2xl transition-colors duration-300 w-full"
            >
                <div className="p-14 text-center flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                        className="mb-4 flex justify-center"
                    >
                        {result.isCorrect ? (
                            <Correct className="w-32 h-32 text-[#51FF48]"/>
                        ) : (
                            <XCircle className="w-48 h-48 text-[#ff4444]" strokeWidth={2} />
                        )}
                    </motion.div>

                    {/* Result Text */}
                    <h2 className={cn(
                        "text-8xl font-atsanee font-black mb-4 tracking-wide",
                        result.isCorrect ? "text-[#51FF48]" : "text-[#ff4444]"
                    )}>
                        {result.isCorrect ? "CORRECT" : "INCORRECT"}
                    </h2>

                    {/* Stats Row */}
                    <div className="flex flex-row justify-center items-center gap-8 mb-4 w-full">
                        <div className="font-atsanee text-center px-2">
                            <div className="text-xl text-gold font-bold uppercase mb-2">Points Gain</div>
                            <div className="text-3xl font-black text-gold">+{result.points}</div>
                        </div>
                        <div className="font-atsanee text-center px-2">
                            <div className="text-xl text-gold font-bold uppercase mb-2">Current Streak</div>
                            <div className="text-3xl font-black text-gold">{result.streak}</div>
                        </div>
                    </div>

                    {/* Correct Answer Box */}
                    {result.correctAnswer && (
                        <div className="border-[2px] border-[#c8a951] rounded-2xl p-6 w-full max-w-[100%] flex flex-col justify-center items-center bg-transparent mt-2">
                            
                            {/* Reference Image (Maintained functionality, styled to fit) */}
                            {(result as any).imageUrl && (
                                <div className="aspect-video rounded-xl overflow-hidden border border-[#c8a951] mb-6 max-w-lg w-full group cursor-zoom-in">
                                    <img src={(result as any).imageUrl} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" alt="Reference" />
                                </div>
                            )}

                            {/* MCQ Layout mapped to single display line as shown in image */}
                            {result.correctAnswer.type === "mcq" && (() => {
                                const correctIndices = result.correctAnswer?.correctChoiceIndices ||
                                    (result.correctAnswer?.correctChoiceIndex !== undefined ? [result.correctAnswer.correctChoiceIndex] : []);
                                return (
                                    <div className="text-white font-bold text-2xl text-center leading-relaxed">
                                        {result.correctAnswer?.choices?.map((c, i) => {
                                            const isCorrectChoice = correctIndices.includes(i);
                                            if (!isCorrectChoice) return null;
                                            return (
                                                <div key={i} className="text-gold font-atsanee mb-0">
                                                    CORRECT ANSWER: <br /><span className="text-gold">{String.fromCharCode(65 + i)}. {c.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* MTF Layout (Maintained functionality, styled to match the new minimal aesthetics) */}
                            {result.correctAnswer.type === "mtf" && (
                                <div className="w-full space-y-3">
                                    <div className="text-gold font-atsanee font-bold text-4xl text-center mb-4">CORRECT ANSWERS:</div>
                                    {result.correctAnswer.statements?.map((s, i) => (
                                        <div key={i} className="text-2xl flex font-atsanee justify-between items-center px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-gold font-bold">
                                            <span className="text-left">{s.text}</span>
                                            <span className={s.isTrue ? "text-[#51FF48]" : "text-[#ff4444]"}>
                                                {s.isTrue ? "TRUE" : "FALSE"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
            
        </div>
    );
};