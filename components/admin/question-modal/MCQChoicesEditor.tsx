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
                        onClick={() => toggleCorrect(idx)}
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
                                newChoices[idx] = { text: e.target.value };
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
    );
}
