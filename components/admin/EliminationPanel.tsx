import { Square } from "lucide-react";

interface EliminationPanelProps {
    onRunElimination: (round: number) => void;
}

export function EliminationPanel({ onRunElimination }: EliminationPanelProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100">
            <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <Square className="w-5 h-5" /> Elimination
            </h2>
            <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((r) => (
                    <button
                        key={r}
                        onClick={() => onRunElimination(r)}
                        className="bg-red-50 text-red-600 border border-red-200 p-2 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                        End R{r}
                    </button>
                ))}
            </div>
        </div>
    );
}
