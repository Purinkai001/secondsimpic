import { Play, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Round } from "@/lib/types";

interface RoundControlProps {
    rounds: Round[];
    onSchedule: (id: string, startTime: number) => void;
    onActivate: (id: string) => void;
    onEnd: (id: string) => void;
    onSelect: (id: string) => void;
    selectedRoundId: string | null;
}

export function RoundControl({ rounds, onSchedule, onActivate, onEnd, onSelect, selectedRoundId }: RoundControlProps) {
    const scheduleRound = (roundId: string) => {
        const minutes = prompt("Start round in how many minutes?", "1");
        if (minutes) {
            const mins = parseInt(minutes, 10);
            if (!isNaN(mins) && mins > 0) {
                const startTime = Date.now() + mins * 60 * 1000;
                onSchedule(roundId, startTime);
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-500" /> Round Control
            </h2>
            <div className="space-y-4">
                {rounds.map((r) => {
                    const startTime = r.startTime ? new Date(r.startTime).toLocaleTimeString() : null;
                    const isScheduled = r.startTime && r.startTime > Date.now();

                    return (
                        <div
                            key={r.id}
                            className={cn(
                                "p-4 rounded-lg border flex flex-col gap-2",
                                r.status === "active" ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold uppercase text-sm">{r.id}</span>
                                    <span
                                        className={cn(
                                            "ml-2 text-xs px-2 py-0.5 rounded-full",
                                            r.status === "active" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"
                                        )}
                                    >
                                        {r.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {r.status === "waiting" && (
                                        <>
                                            <button
                                                onClick={() => scheduleRound(r.id)}
                                                className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors flex items-center gap-1"
                                            >
                                                <Calendar className="w-3 h-3" /> Schedule
                                            </button>
                                            <button
                                                onClick={() => onActivate(r.id)}
                                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                                            >
                                                Start Now
                                            </button>
                                        </>
                                    )}
                                    {r.status === "active" && (
                                        <button
                                            onClick={() => onEnd(r.id)}
                                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                                        >
                                            End
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onSelect(r.id)}
                                        className={cn(
                                            "text-xs px-2 py-1 rounded border transition-colors",
                                            selectedRoundId === r.id ? "bg-slate-800 text-white" : "bg-white hover:bg-gray-100"
                                        )}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                            {startTime && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {isScheduled ? `Starts at ${startTime}` : `Started at ${startTime}`}
                                </div>
                            )}
                            <div className="text-xs text-gray-400">
                                Timer: {r.questionTimer || 10}s per question | Q Index: {r.currentQuestionIndex || 0}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
