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
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-admin-muted">Binary Propositions ({statements.length}/8)</label>
                <button
                    type="button"
                    onClick={addStatement}
                    disabled={statements.length >= 8}
                    className={cn(
                        "flex items-center gap-1 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        statements.length >= 8 ? "bg-white/[0.04] text-admin-muted cursor-not-allowed" : "border border-admin-cyan/20 bg-admin-cyan/10 text-admin-cyan hover:bg-admin-cyan/20"
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
                            "h-16 w-28 shrink-0 rounded-[1.25rem] border text-[10px] font-black uppercase tracking-widest transition-all",
                            s.isTrue ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-100" : "border-rose-300/20 bg-rose-300/12 text-rose-100"
                        )}
                    >
                        {s.isTrue ? "TRUE" : "FALSE"}
                    </button>
                    <div className="relative flex-1">
                        <div className="absolute left-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-black text-admin-muted transition-colors">
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
                            className="admin-input h-16 w-full rounded-[1.25rem] pl-16 pr-6 text-lg font-bold"
                        />
                    </div>
                    {statements.length > 2 && (
                        <button
                            type="button"
                            onClick={() => removeStatement(idx)}
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
