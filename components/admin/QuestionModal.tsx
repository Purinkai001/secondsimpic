import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Image as ImageIcon, Plus, Trash2, Upload, Loader2, FileQuestion, Search, ChevronRight, Layers } from "lucide-react";
import { QuestionType, Difficulty, MTFStatement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface QuestionModalProps {
    isOpen: boolean;
    editingQuestion?: any;
    onClose: () => void;
    onSave: (question: any) => Promise<void>;
}

export function QuestionModal({ isOpen, editingQuestion, onClose, onSave }: QuestionModalProps) {
    const [type, setType] = useState<QuestionType>("mcq");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [roundId, setRoundId] = useState("round-1");
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [order, setOrder] = useState(1);

    // MCQ specific (min 2, max 6)
    const [choices, setChoices] = useState([{ text: "" }, { text: "" }]);
    const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);

    const addChoice = () => {
        if (choices.length < 6) {
            setChoices([...choices, { text: "" }]);
        }
    };

    const removeChoice = (idx: number) => {
        if (choices.length > 2) {
            const newChoices = choices.filter((_, i) => i !== idx);
            setChoices(newChoices);
            // Adjust correctChoiceIndex if needed
            if (correctChoiceIndex === idx) {
                setCorrectChoiceIndex(0);
            } else if (correctChoiceIndex > idx) {
                setCorrectChoiceIndex(correctChoiceIndex - 1);
            }
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
                setCorrectChoiceIndex(editingQuestion.correctChoiceIndex || 0);
            } else if (editingQuestion.type === "mtf") {
                setStatements(editingQuestion.statements || [
                    { text: "", isTrue: true },
                    { text: "", isTrue: false },
                ]);
            } else {
                setCorrectAnswer(editingQuestion.correctAnswer || "");
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
            setCorrectChoiceIndex(0);
            setStatements([
                { text: "", isTrue: true },
                { text: "", isTrue: false },
            ]);
            setCorrectAnswer("");
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
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            {editingQuestion ? <Plus className="w-5 h-5 text-blue-400 rotate-45" /> : <Plus className="w-5 h-5 text-blue-400" />}
                        </div>
                        {editingQuestion ? "Modify Inquiry" : "Initiate Question"}
                    </h2>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-white/20 group-hover:text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Target Phase</label>
                            <select
                                value={roundId}
                                onChange={(e) => setRoundId(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/30 text-white font-bold appearance-none cursor-pointer"
                            >
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={`round-${r}`} className="bg-[#0a0e1a] text-white">Round {r}</option>)}
                                <option value="round-sd" className="bg-[#0a0e1a] text-white italic">Sudden Death</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Sequence Order</label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/30 font-black text-xl text-blue-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Classification</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["mcq", "mtf", "saq", "spot"].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t as QuestionType)}
                                        className={cn(
                                            "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            type === t ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        {t === 'saq' ? 'Short Ans' : t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Challenge Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["easy", "medium", "difficult"].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDifficulty(d as Difficulty)}
                                        className={cn(
                                            "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border italic",
                                            difficulty === d
                                                ? (d === 'easy' ? 'bg-green-500 border-green-400 text-white' : d === 'medium' ? 'bg-amber-500 border-amber-400 text-white' : 'bg-red-500 border-red-400 text-white')
                                                : "bg-white/5 border-white/5 text-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Content Specification</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Specify the inquiry parameters..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] px-6 py-5 focus:outline-none focus:border-blue-500/30 min-h-[120px] text-lg font-bold leading-relaxed resize-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Visual Documentation</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1 group">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="External Image Endpoint (Direct Link)..."
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500/30 text-sm italic font-medium"
                                />
                                <ImageIcon className="absolute left-4 top-4.5 w-4 h-4 text-white/10 group-focus-within:text-blue-500 transition-colors" />
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
                                className="px-6 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Upload
                            </button>
                        </div>
                        {imageUrl && (
                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-black/40 group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        {type === "mcq" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Response Options ({choices.length}/6)</label>
                                    <button
                                        type="button"
                                        onClick={addChoice}
                                        disabled={choices.length >= 6}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                            choices.length >= 6 ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                                {choices.map((choice, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <button
                                            type="button"
                                            onClick={() => setCorrectChoiceIndex(idx)}
                                            className={cn(
                                                "w-16 h-16 flex flex-col items-center justify-center rounded-2xl border transition-all shrink-0",
                                                correctChoiceIndex === idx
                                                    ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20"
                                                    : "bg-white/5 border-white/5 text-white/10 opacity-40 hover:opacity-100"
                                            )}
                                        >
                                            <span className="text-[8px] font-black uppercase mb-1">Key</span>
                                            <Check className="w-6 h-6" />
                                        </button>
                                        <div className="relative flex-1">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black italic text-white/20">
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
                                                className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 focus:outline-none focus:border-blue-500/30 font-bold text-lg"
                                            />
                                        </div>
                                        {choices.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeChoice(idx)}
                                                className="w-12 h-16 flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
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
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Binary Propositions ({statements.length}/8)</label>
                                    <button
                                        type="button"
                                        onClick={addStatement}
                                        disabled={statements.length >= 8}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                            statements.length >= 8 ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
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
                                                s.isTrue ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
                                            )}
                                        >
                                            {s.isTrue ? "POSITIVE" : "NEGATIVE"}
                                        </button>
                                        <div className="relative flex-1">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black italic text-white/20">
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
                                                className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 focus:outline-none focus:border-blue-500/30 font-bold text-lg"
                                            />
                                        </div>
                                        {statements.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStatement(idx)}
                                                className="w-12 h-16 flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {(type === "saq" || type === "spot") && (
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black italic">Verification Protocol (Key)</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-blue-500/40">
                                        <Check className="w-full h-full" />
                                    </div>
                                    <input
                                        required
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        placeholder="Expected nomenclature/diagnosis..."
                                        className="w-full h-20 bg-blue-500/5 border border-blue-500/20 rounded-3xl pl-16 pr-6 focus:outline-none focus:border-blue-500/50 font-black text-2xl text-blue-400 italic"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-3xl font-black uppercase text-[12px] tracking-widest transition-all">Abort</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 active:scale-95"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : <Check className="w-6 h-6" />}
                        {editingQuestion ? "Seal Modification" : "Publish Inquiry"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
