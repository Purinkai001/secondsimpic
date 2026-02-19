import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus, Loader2 } from "lucide-react";
import { QuestionType, Difficulty, MTFStatement, Question } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";
import { MCQChoicesEditor } from "./MCQChoicesEditor";
import { MTFStatementsEditor } from "./MTFStatementsEditor";
import { SAQFields } from "./SAQFields";
import { cn } from "@/lib/utils";

interface QuestionModalProps {
    isOpen: boolean;
    editingQuestion?: Question | null;
    onClose: () => void;
    onSave: (question: Partial<Question>) => Promise<void>;
}

export function QuestionModal({ isOpen, editingQuestion, onClose, onSave }: QuestionModalProps) {
    const [type, setType] = useState<QuestionType>("mcq");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [roundId, setRoundId] = useState("round-1");
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [order, setOrder] = useState(1);

    const [choices, setChoices] = useState([{ text: "" }, { text: "" }]);
    const [correctChoiceIndices, setCorrectChoiceIndices] = useState<number[]>([0]);
    const [statements, setStatements] = useState<MTFStatement[]>([
        { text: "", isTrue: true },
        { text: "", isTrue: false },
    ]);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [alternateAnswers, setAlternateAnswers] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingQuestion) {
            setType(editingQuestion.type);
            setDifficulty(editingQuestion.difficulty);
            setRoundId(editingQuestion.roundId);
            setText(editingQuestion.text || "");
            setImageUrl(editingQuestion.imageUrl || "");
            setOrder(editingQuestion.order || 1);
            if (editingQuestion.type === "mcq") {
                setChoices(editingQuestion.choices || [{ text: "" }, { text: "" }]);
                const indices = editingQuestion.correctChoiceIndices ||
                    (editingQuestion.correctChoiceIndex !== undefined ? [editingQuestion.correctChoiceIndex] : [0]);
                setCorrectChoiceIndices(indices);
            } else if (editingQuestion.type === "mtf") {
                setStatements(editingQuestion.statements || [{ text: "", isTrue: true }, { text: "", isTrue: false }]);
            } else {
                setCorrectAnswer(editingQuestion.correctAnswer || "");
                setAlternateAnswers((editingQuestion.alternateAnswers || []).join("\n"));
            }
        } else {
            setType("mcq"); setDifficulty("easy"); setRoundId("round-1");
            setText(""); setImageUrl(""); setOrder(1);
            setChoices([{ text: "" }, { text: "" }]); setCorrectChoiceIndices([0]);
            setStatements([{ text: "", isTrue: true }, { text: "", isTrue: false }]);
            setCorrectAnswer(""); setAlternateAnswers("");
        }
    }, [editingQuestion, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setSaving(true);
        try {
            const questionData: Partial<Question> = { type, difficulty, roundId, text, imageUrl, order };
            if (type === "mcq") {
                questionData.choices = choices;
                questionData.correctChoiceIndices = correctChoiceIndices;
            } else if (type === "mtf") {
                questionData.statements = statements;
            } else {
                questionData.correctAnswer = correctAnswer;
                questionData.alternateAnswers = alternateAnswers.split("\n").map(s => s.trim()).filter(s => s.length > 0);
            }
            await onSave(questionData);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/90 dark:bg-black/90 backdrop-blur-xl"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-surface-bg border border-surface-border rounded-[2.5rem] overflow-x-auto shadow-2xl transition-colors duration-300"
            >
                <div className="flex justify-between items-center p-8 border-b border-surface-border bg-surface-bg/50">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-foreground">
                        <div className="p-2 bg-accent-blue/20 rounded-xl">
                            <Plus className={`w-5 h-5 text-accent-blue ${editingQuestion ? "rotate-45" : ""}`} />
                        </div>
                        {editingQuestion ? "Modify Inquiry" : "Initiate Question"}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-surface-bg/80 rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-muted group-hover:text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Round + Order */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Target Phase</label>
                            <select value={roundId} onChange={(e) => setRoundId(e.target.value)}
                                className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent-blue/30 text-foreground font-bold appearance-none cursor-pointer transition-colors">
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={`round-${r}`} className="bg-surface-bg text-foreground">Round {r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Sequence Order</label>
                            <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent-blue/30 font-black text-xl text-accent-blue transition-colors" />
                        </div>
                    </div>

                    {/* Type + Difficulty */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Classification</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["mcq", "mtf", "saq", "spot"] as QuestionType[]).map((t) => (
                                    <button key={t} type="button" onClick={() => setType(t)}
                                        className={cn("py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            type === t ? "bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20" : "bg-surface-bg/50 border-surface-border text-muted hover:bg-surface-bg/80")}>
                                        {t === 'saq' ? 'Short Ans' : t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Challenge Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["easy", "medium", "difficult"] as Difficulty[]).map((d) => (
                                    <button key={d} type="button" onClick={() => setDifficulty(d)}
                                        className={cn("py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            difficulty === d
                                                ? (d === 'easy' ? 'bg-green-600 border-green-500 text-white' : d === 'medium' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-red-600 border-red-500 text-white')
                                                : "bg-surface-bg/50 border-surface-border text-muted hover:bg-surface-bg/80")}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Content Specification</label>
                        <textarea value={text} onChange={(e) => setText(e.target.value)}
                            placeholder="Specify the inquiry parameters..."
                            className="w-full bg-surface-bg/50 border border-surface-border rounded-[2rem] px-6 py-5 focus:outline-none focus:border-accent-blue/30 min-h-[120px] text-lg font-bold leading-relaxed resize-none text-foreground transition-colors" />
                    </div>

                    {/* Image */}
                    <ImageUploader imageUrl={imageUrl} uploading={uploading} setImageUrl={setImageUrl} setUploading={setUploading} />

                    {/* Type-specific editors */}
                    <div className="pt-8 border-t border-surface-border">
                        {type === "mcq" && (
                            <MCQChoicesEditor
                                choices={choices} correctChoiceIndices={correctChoiceIndices}
                                setChoices={setChoices} setCorrectChoiceIndices={setCorrectChoiceIndices}
                            />
                        )}
                        {type === "mtf" && (
                            <MTFStatementsEditor statements={statements} setStatements={setStatements} />
                        )}
                        {(type === "saq" || type === "spot") && (
                            <SAQFields
                                correctAnswer={correctAnswer} alternateAnswers={alternateAnswers}
                                setCorrectAnswer={setCorrectAnswer} setAlternateAnswers={setAlternateAnswers}
                            />
                        )}
                    </div>
                </form>

                <div className="p-8 border-t border-surface-border bg-surface-bg/50 flex gap-4">
                    <button type="button" onClick={onClose}
                        className="flex-1 py-5 bg-surface-bg hover:bg-surface-bg/80 text-foreground border border-surface-border rounded-3xl font-black uppercase text-[12px] tracking-widest transition-all">
                        Cancel
                    </button>
                    <button onClick={() => handleSubmit()} disabled={saving}
                        className="flex-[2] py-5 bg-accent-blue hover:bg-accent-blue/80 rounded-3xl font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-accent-blue/20 active:scale-95">
                        {saving ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : <Check className="w-6 h-6" />}
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
