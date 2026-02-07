import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Image as ImageIcon, Plus, Trash2, Upload, Loader2, FileQuestion, Search, ChevronRight, Layers } from "lucide-react";
import { QuestionType, Difficulty, MTFStatement, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
    const [order, setOrder] = useState(1);

    const [choices, setChoices] = useState([{ text: "" }, { text: "" }]);
    const [correctChoiceIndices, setCorrectChoiceIndices] = useState<number[]>([0]);

    const addChoice = () => {
        if (choices.length < 6) {
            setChoices([...choices, { text: "" }]);
        }
    };

    const removeChoice = (idx: number) => {
        if (choices.length > 2) {
            const newChoices = choices.filter((_, i) => i !== idx);
            setChoices(newChoices);
            const newIndices = correctChoiceIndices
                .filter(i => i !== idx)
                .map(i => (i > idx ? i - 1 : i));
            setCorrectChoiceIndices(newIndices.length > 0 ? newIndices : [0]);
        }
    };

    const toggleCorrectChoice = (idx: number) => {
        if (correctChoiceIndices.includes(idx)) {
            if (correctChoiceIndices.length > 1) {
                setCorrectChoiceIndices(correctChoiceIndices.filter(i => i !== idx));
            }
        } else {
            setCorrectChoiceIndices([...correctChoiceIndices, idx].sort((a, b) => a - b));
        }
    };

    // MTF specific (min 2, max 8)
    const [statements, setStatements] = useState<MTFStatement[]>([
        { text: "", isTrue: true },
        { text: "", isTrue: false },
    ]);

    const addStatement = () => {
        if (statements.length < 8) {
            setStatements([...statements, { text: "", isTrue: true }]);
        }
    };

    const removeStatement = (idx: number) => {
        if (statements.length > 2) {
            setStatements(statements.filter((_, i) => i !== idx));
        }
    };

    // SAQ/Spot specific
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [alternateAnswers, setAlternateAnswers] = useState(""); // Textarea input for alternatives

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                const indices = editingQuestion.correctChoiceIndices || (editingQuestion.correctChoiceIndex !== undefined ? [editingQuestion.correctChoiceIndex] : [0]);
                setCorrectChoiceIndices(indices);
            } else if (editingQuestion.type === "mtf") {
                setStatements(editingQuestion.statements || [
                    { text: "", isTrue: true },
                    { text: "", isTrue: false },
                ]);
            } else {
                setCorrectAnswer(editingQuestion.correctAnswer || "");
                // Join array with newlines for editing
                setAlternateAnswers((editingQuestion.alternateAnswers || []).join("\n"));
            }
        } else {
            // Reset for new question
            setType("mcq");
            setDifficulty("easy");
            setRoundId("round-1");
            setText("");
            setImageUrl("");
            setOrder(1);
            setChoices([{ text: "" }, { text: "" }]);
            setCorrectChoiceIndices([0]);
            setStatements([
                { text: "", isTrue: true },
                { text: "", isTrue: false },
            ]);
            setCorrectAnswer("");
            setAlternateAnswers("");
        }
    }, [editingQuestion, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `questions/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            setImageUrl(url);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const questionData: Partial<Question> = {
                type,
                difficulty,
                roundId,
                text,
                imageUrl,
                order,
            };

            if (type === "mcq") {
                questionData.choices = choices;
                questionData.correctChoiceIndices = correctChoiceIndices;
            } else if (type === "mtf") {
                questionData.statements = statements;
            } else {
                questionData.correctAnswer = correctAnswer;
                // Split by newline and filter empty strings
                questionData.alternateAnswers = alternateAnswers
                    .split("\n")
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
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
                            {editingQuestion ? <Plus className="w-5 h-5 text-accent-blue rotate-45" /> : <Plus className="w-5 h-5 text-accent-blue" />}
                        </div>
                        {editingQuestion ? "Modify Inquiry" : "Initiate Question"}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-surface-bg/80 rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-muted group-hover:text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Target Phase</label>
                            <select
                                value={roundId}
                                onChange={(e) => setRoundId(e.target.value)}
                                className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent-blue/30 text-foreground font-bold appearance-none cursor-pointer transition-colors"
                            >
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={`round-${r}`} className="bg-surface-bg text-foreground">Round {r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Sequence Order</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent-blue/30 font-black text-xl text-accent-blue transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Classification</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["mcq", "mtf", "saq", "spot"].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t as QuestionType)}
                                        className={cn(
                                            "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            type === t ? "bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20" : "bg-surface-bg/50 border-surface-border text-muted hover:bg-surface-bg/80"
                                        )}
                                    >
                                        {t === 'saq' ? 'Short Ans' : t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Challenge Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["easy", "medium", "difficult"].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDifficulty(d as Difficulty)}
                                        className={cn(
                                            "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            difficulty === d
                                                ? (d === 'easy' ? 'bg-green-600 border-green-500 text-white' : d === 'medium' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-red-600 border-red-500 text-white')
                                                : "bg-surface-bg/50 border-surface-border text-muted hover:bg-surface-bg/80"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Content Specification</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Specify the inquiry parameters..."
                            className="w-full bg-surface-bg/50 border border-surface-border rounded-[2rem] px-6 py-5 focus:outline-none focus:border-accent-blue/30 min-h-[120px] text-lg font-bold leading-relaxed resize-none text-foreground transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Visual Documentation</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1 group">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="External Image Endpoint (Direct Link)..."
                                    className="w-full bg-surface-bg/50 border border-surface-border rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-accent-blue/30 text-sm italic font-medium text-foreground transition-colors placeholder:text-muted/30"
                                />
                                <ImageIcon className="absolute left-4 top-4.5 w-4 h-4 text-muted/30 group-focus-within:text-accent-blue transition-colors" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-6 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Upload
                            </button>
                        </div>
                        {imageUrl && (
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-surface-border bg-surface-bg/80 group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-surface-border">
                        {type === "mcq" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Response Options ({choices.length}/6)</label>
                                    <button
                                        type="button"
                                        onClick={addChoice}
                                        disabled={choices.length >= 6}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                            choices.length >= 6 ? "bg-surface-bg/50 text-muted cursor-not-allowed" : "bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/20"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                                {choices.map((choice, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <button
                                            type="button"
                                            onClick={() => toggleCorrectChoice(idx)}
                                            className={cn(
                                                "w-16 h-16 flex flex-col items-center justify-center rounded-2xl border transition-all shrink-0",
                                                correctChoiceIndices.includes(idx)
                                                    ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20"
                                                    : "bg-surface-bg/50 border-surface-border text-muted opacity-40 hover:opacity-100"
                                            )}
                                        >
                                            <span className="text-[8px] font-black uppercase mb-1">Key</span>
                                            <Check className="w-6 h-6" />
                                        </button>
                                        <div className="relative flex-1">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center font-black italic text-muted transition-colors">
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <input
                                                required
                                                value={choice.text}
                                                onChange={(e) => {
                                                    const newChoices = [...choices];
                                                    newChoices[idx].text = e.target.value;
                                                    setChoices(newChoices);
                                                }}
                                                placeholder={`Option Parameter ${idx + 1}`}
                                                className="w-full h-16 bg-surface-bg/50 border border-surface-border rounded-2xl pl-16 pr-6 focus:outline-none focus:border-accent-blue/30 font-bold text-lg text-foreground transition-colors"
                                            />
                                        </div>
                                        {choices.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeChoice(idx)}
                                                className="w-12 h-16 flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {type === "mtf" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Binary Propositions ({statements.length}/8)</label>
                                    <button
                                        type="button"
                                        onClick={addStatement}
                                        disabled={statements.length >= 8}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                            statements.length >= 8 ? "bg-surface-bg/50 text-muted cursor-not-allowed" : "bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/20"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                                {statements.map((s, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newS = [...statements];
                                                newS[idx].isTrue = !newS[idx].isTrue;
                                                setStatements(newS);
                                            }}
                                            className={cn(
                                                "w-28 text-[10px] font-black uppercase rounded-2xl border transition-all shrink-0 h-16 italic tracking-widest",
                                                s.isTrue ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                                            )}
                                        >
                                            {s.isTrue ? "TRUE" : "FALSE"}
                                        </button>
                                        <div className="relative flex-1">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center font-black italic text-muted transition-colors">
                                                {idx + 1}
                                            </div>
                                            <input
                                                required
                                                value={s.text}
                                                onChange={(e) => {
                                                    const newS = [...statements];
                                                    newS[idx].text = e.target.value;
                                                    setStatements(newS);
                                                }}
                                                placeholder={`Clinical Statement ${idx + 1}`}
                                                className="w-full h-16 bg-surface-bg/50 border border-surface-border rounded-2xl pl-16 pr-6 focus:outline-none focus:border-accent-blue/30 font-bold text-lg text-foreground transition-colors"
                                            />
                                        </div>
                                        {statements.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStatement(idx)}
                                                className="w-12 h-16 flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {(type === "saq" || type === "spot") && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Answer Key</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-accent-blue/40">
                                            <Check className="w-full h-full" />
                                        </div>
                                        <input
                                            required
                                            value={correctAnswer}
                                            onChange={(e) => setCorrectAnswer(e.target.value)}
                                            placeholder="Answer Key"
                                            className="w-full h-20 bg-accent-blue/5 border border-accent-blue/20 rounded-3xl pl-16 pr-6 focus:outline-none focus:border-accent-blue/50 font-black text-2xl text-accent-blue italic transition-colors placeholder:text-accent-blue/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted font-black italic">Alternative Acceptable Answers</label>
                                        <span className="text-[10px] font-bold text-muted">{alternateAnswers.split('\n').filter(s => s.trim().length > 0).length} Variants</span>
                                    </div>
                                    <textarea
                                        value={alternateAnswers}
                                        onChange={(e) => setAlternateAnswers(e.target.value)}
                                        placeholder="Enter alternative correct answers, one per line..."
                                        className="w-full bg-surface-bg/50 border border-surface-border rounded-[2rem] px-6 py-5 focus:outline-none focus:border-accent-blue/30 min-h-[150px] text-lg font-medium leading-relaxed resize-none text-foreground/70 transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-8 border-t border-surface-border bg-surface-bg/50 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-5 bg-surface-bg hover:bg-surface-bg/80 text-foreground border border-surface-border rounded-3xl font-black uppercase text-[12px] tracking-widest transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] py-5 bg-accent-blue hover:bg-accent-blue/80 rounded-3xl font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-accent-blue/20 active:scale-95"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : <Check className="w-6 h-6" />}
                        {editingQuestion ? "Confirm" : "Confirm"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
