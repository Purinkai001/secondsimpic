import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus, Loader2, FileQuestion } from "lucide-react";
import { QuestionType, Difficulty, MTFStatement, Question } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";
import { MCQChoicesEditor } from "./MCQChoicesEditor";
import { MTFStatementsEditor } from "./MTFStatementsEditor";
import { SAQFields } from "./SAQFields";
import { cn } from "@/lib/utils";
import { AdminBadge } from "../AdminPrimitives";
import TlCorner from "@/vectors/TlCorner";
import BrCorner from "@/vectors/BrCorner";

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
            setType("mcq");
            setDifficulty("easy");
            setRoundId("round-1");
            setText("");
            setImageUrl("");
            setOrder(1);
            setChoices([{ text: "" }, { text: "" }]);
            setCorrectChoiceIndices([0]);
            setStatements([{ text: "", isTrue: true }, { text: "", isTrue: false }]);
            setCorrectAnswer("");
            setAlternateAnswers("");
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
                questionData.alternateAnswers = alternateAnswers.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-[#020817]/90 backdrop-blur-xl"
            />
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="admin-panel admin-panel-strong relative w-full max-w-4xl overflow-hidden rounded-[2.75rem]"
            >
                <div className="pointer-events-none absolute left-3 top-3 opacity-28">
                    <TlCorner className="h-28 w-28" />
                </div>
                <div className="pointer-events-none absolute bottom-3 right-3 opacity-24">
                    <BrCorner className="h-24 w-24" />
                </div>

                <div className="relative flex items-center justify-between border-b border-white/8 bg-white/[0.04] p-6 md:p-8">
                    <div>
                        <AdminBadge tone="accent">{editingQuestion ? "Modify Question" : "Create Question"}</AdminBadge>
                        <h2 className="mt-4 flex items-center gap-3 font-atsanee text-4xl font-black uppercase italic text-gold">
                            <div className="rounded-2xl border border-gold/15 bg-gold/10 p-2.5 text-gold">
                                {editingQuestion ? <FileQuestion className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </div>
                            {editingQuestion ? "Modify Inquiry" : "Initiate Question"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-admin-muted transition-all hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="custom-scrollbar relative max-h-[75vh] space-y-8 overflow-y-auto p-6 md:p-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Target Phase</label>
                            <select
                                value={roundId}
                                onChange={(e) => setRoundId(e.target.value)}
                                className="admin-input w-full appearance-none rounded-[1.5rem] px-5 py-4 font-bold"
                            >
                                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={`round-${r}`} className="bg-surface-bg text-foreground">Round {r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Sequence Order</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="admin-input w-full rounded-[1.5rem] px-5 py-4 text-2xl font-black text-gold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Classification</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["mcq", "mtf", "saq", "spot"] as QuestionType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "rounded-[1rem] border px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all",
                                            type === t ? "border-admin-cyan/20 bg-admin-cyan/12 text-admin-cyan" : "border-white/8 bg-white/[0.04] text-admin-muted hover:text-white"
                                        )}
                                    >
                                        {t === "saq" ? "Short Ans" : t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Challenge Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["easy", "medium", "difficult"] as Difficulty[]).map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDifficulty(d)}
                                        className={cn(
                                            "rounded-[1rem] border px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all",
                                            difficulty === d
                                                ? (d === "easy" ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-100" : d === "medium" ? "border-amber-300/20 bg-amber-300/12 text-amber-100" : "border-rose-300/20 bg-rose-300/12 text-rose-100")
                                                : "border-white/8 bg-white/[0.04] text-admin-muted hover:text-white"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Content Specification</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Specify the inquiry parameters..."
                            className="admin-input min-h-[140px] w-full rounded-[2rem] px-6 py-5 text-lg font-bold leading-relaxed resize-none"
                        />
                    </div>

                    <ImageUploader imageUrl={imageUrl} uploading={uploading} setImageUrl={setImageUrl} setUploading={setUploading} />

                    <div className="border-t border-white/8 pt-8">
                        {type === "mcq" && (
                            <MCQChoicesEditor
                                choices={choices}
                                correctChoiceIndices={correctChoiceIndices}
                                setChoices={setChoices}
                                setCorrectChoiceIndices={setCorrectChoiceIndices}
                            />
                        )}
                        {type === "mtf" && (
                            <MTFStatementsEditor statements={statements} setStatements={setStatements} />
                        )}
                        {(type === "saq" || type === "spot") && (
                            <SAQFields
                                correctAnswer={correctAnswer}
                                alternateAnswers={alternateAnswers}
                                setCorrectAnswer={setCorrectAnswer}
                                setAlternateAnswers={setAlternateAnswers}
                            />
                        )}
                    </div>
                </form>

                <div className="flex gap-4 border-t border-white/8 bg-white/[0.04] p-6 md:p-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-4 font-atsanee text-xl font-black uppercase italic text-white/85 transition-all hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="flex-[2] rounded-full bg-shiny px-[1px] py-[1px] disabled:opacity-60"
                    >
                        <span className="flex items-center justify-center gap-3 rounded-full bg-[#04112d] py-4 font-atsanee text-xl font-black uppercase italic text-gold">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                            Confirm
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
