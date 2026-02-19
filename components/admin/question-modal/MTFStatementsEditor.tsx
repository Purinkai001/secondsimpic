import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MTFStatement } from "@/lib/types";

interface MTFStatementsEditorProps {
    statements: MTFStatement[];
    setStatements: (s: MTFStatement[]) => void;
}

export function MTFStatementsEditor({ statements, setStatements }: MTFStatementsEditorProps) {
    const addStatement = () => {
        if (statements.length < 8) setStatements([...statements, { text: "", isTrue: true }]);
    };

    const removeStatement = (idx: number) => {
        if (statements.length > 2) setStatements(statements.filter((_, i) => i !== idx));
    };

    return (
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
                            newS[idx] = { ...newS[idx], isTrue: !newS[idx].isTrue };
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
                                newS[idx] = { ...newS[idx], text: e.target.value };
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
    );
}
