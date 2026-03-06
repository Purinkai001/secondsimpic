import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MCQChoicesEditorProps {
    choices: { text: string }[];
    correctChoiceIndices: number[];
    setChoices: (c: { text: string }[]) => void;
    setCorrectChoiceIndices: (i: number[]) => void;
}

export function MCQChoicesEditor({ choices, correctChoiceIndices, setChoices, setCorrectChoiceIndices }: MCQChoicesEditorProps) {
    const addChoice = () => {
        if (choices.length < 6) setChoices([...choices, { text: "" }]);
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

    const toggleCorrect = (idx: number) => {
        if (correctChoiceIndices.includes(idx)) {
            if (correctChoiceIndices.length > 1) {
                setCorrectChoiceIndices(correctChoiceIndices.filter(i => i !== idx));
            }
        } else {
            setCorrectChoiceIndices([...correctChoiceIndices, idx].sort((a, b) => a - b));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Response Options ({choices.length}/6)</label>
                <button
                    type="button"
                    onClick={addChoice}
                    disabled={choices.length >= 6}
                    className={cn(
                        "flex items-center gap-1 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        choices.length >= 6 ? "bg-white/[0.04] text-admin-muted cursor-not-allowed" : "border border-admin-cyan/20 bg-admin-cyan/10 text-admin-cyan hover:bg-admin-cyan/20"
                    )}
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            {choices.map((choice, idx) => (
                <div key={idx} className="flex gap-4 group">
                    <button
                        type="button"
                        onClick={() => toggleCorrect(idx)}
                        className={cn(
                            "h-16 w-16 shrink-0 rounded-[1.25rem] border transition-all",
                            correctChoiceIndices.includes(idx)
                                ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-100 shadow-lg shadow-emerald-900/20"
                                : "border-white/8 bg-white/[0.04] text-admin-muted opacity-50 hover:opacity-100"
                        )}
                    >
                        <span className="text-[8px] font-black uppercase mb-1">Key</span>
                        <Check className="w-6 h-6" />
                    </button>
                    <div className="relative flex-1">
                        <div className="absolute left-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-black text-admin-muted transition-colors">
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <input
                            required
                            value={choice.text}
                            onChange={(e) => {
                                const newChoices = [...choices];
                                newChoices[idx] = { text: e.target.value };
                                setChoices(newChoices);
                            }}
                            placeholder={`Option Parameter ${idx + 1}`}
                            className="admin-input h-16 w-full rounded-[1.25rem] pl-16 pr-6 text-lg font-bold"
                        />
                    </div>
                    {choices.length > 2 && (
                        <button
                            type="button"
                            onClick={() => removeChoice(idx)}
                            className="flex h-16 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20 transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
