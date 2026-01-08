"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { QuestionType, Difficulty, MTFStatement } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: any) => Promise<void>;
}

export function QuestionModal({ isOpen, onClose, onSave }: QuestionModalProps) {
    const [type, setType] = useState<QuestionType>("mcq");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [roundId, setRoundId] = useState("round-1");
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [order, setOrder] = useState(1);

    // MCQ specific
    const [choices, setChoices] = useState([{ text: "" }, { text: "" }, { text: "" }, { text: "" }]);
    const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);

    // MTF specific
    const [statements, setStatements] = useState<MTFStatement[]>([
        { text: "", isTrue: true },
        { text: "", isTrue: false },
        { text: "", isTrue: true },
        { text: "", isTrue: false },
    ]);

    // SAQ/Spot specific
    const [correctAnswer, setCorrectAnswer] = useState("");

    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const questionData: any = {
                type,
                difficulty,
                roundId,
                text,
                imageUrl,
                order,
            };

            if (type === "mcq") {
                questionData.choices = choices;
                questionData.correctChoiceIndex = correctChoiceIndex;
            } else if (type === "mtf") {
                questionData.statements = statements;
            } else {
                questionData.correctAnswer = correctAnswer;
            }

            await onSave(questionData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-500" />
                        New Question
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Round</label>
                            <select
                                value={roundId}
                                onChange={(e) => setRoundId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 text-white"
                            >
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={`round-${r}`} className="bg-[#0a0e1a] text-white">Round {r}</option>)}
                                <option value="round-sd" className="bg-[#0a0e1a] text-white">Sudden Death</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Order</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["mcq", "mtf", "saq", "spot"].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t as QuestionType)}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border",
                                            type === t ? "bg-blue-500 border-blue-400 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Difficulty</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["easy", "medium", "difficult"].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDifficulty(d as Difficulty)}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border",
                                            difficulty === d
                                                ? (d === 'easy' ? 'bg-green-500 border-green-400' : d === 'medium' ? 'bg-amber-500 border-amber-400' : 'bg-red-500 border-red-400')
                                                : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Question Text</label>
                        <textarea
                            required
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter question text..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 min-h-[100px]"
                        />
                    </div>

                    {type === "spot" && (
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Image URL</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50"
                                />
                                <ImageIcon className="absolute left-3 top-3.5 w-4 h-4 text-white/20" />
                            </div>
                        </div>
                    )}

                    {/* TYPE SPECIFIC INPUTS */}
                    <div className="pt-4 border-t border-white/5">
                        {type === "mcq" && (
                            <div className="space-y-4">
                                <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Choices</label>
                                {choices.map((choice, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCorrectChoiceIndex(idx)}
                                            className={cn(
                                                "w-12 flex items-center justify-center rounded-xl border transition-all",
                                                correctChoiceIndex === idx ? "bg-green-500 border-green-400 text-white" : "bg-white/5 border-white/10 text-white/20"
                                            )}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <input
                                            required
                                            value={choice.text}
                                            onChange={(e) => {
                                                const newChoices = [...choices];
                                                newChoices[idx].text = e.target.value;
                                                setChoices(newChoices);
                                            }}
                                            placeholder={`Choice ${idx + 1}`}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {type === "mtf" && (
                            <div className="space-y-4">
                                <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Statements</label>
                                {statements.map((s, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newS = [...statements];
                                                newS[idx].isTrue = !newS[idx].isTrue;
                                                setStatements(newS);
                                            }}
                                            className={cn(
                                                "w-20 text-[10px] font-bold uppercase rounded-xl border transition-all",
                                                s.isTrue ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
                                            )}
                                        >
                                            {s.isTrue ? "TRUE" : "FALSE"}
                                        </button>
                                        <input
                                            required
                                            value={s.text}
                                            onChange={(e) => {
                                                const newS = [...statements];
                                                newS[idx].text = e.target.value;
                                                setStatements(newS);
                                            }}
                                            placeholder={`Statement ${idx + 1}`}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {(type === "saq" || type === "spot") && (
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-white/40 font-bold">Correct Answer</label>
                                <input
                                    required
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    placeholder="Expected answer text..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Question"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
