"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus, Target, Users, RefreshCw } from "lucide-react";

type ModifyMode = "set" | "add" | "subtract";

export default function ModifyScorePage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<ModifyMode>("set");
    const [value, setValue] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snap) => {
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Team))
                .sort((a, b) => {
                    if (a.group !== b.group) return a.group - b.group;
                    return b.score - a.score;
                });
            setTeams(data);
        });
        return () => unsub();
    }, []);

    const toggleTeam = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(teams.map(t => t.id)));
    const deselectAll = () => setSelectedIds(new Set());
    const selectDivision = (div: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            teams.filter(t => t.group === div).forEach(t => next.add(t.id));
            return next;
        });
    };
    const deselectDivision = (div: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            teams.filter(t => t.group === div).forEach(t => next.delete(t.id));
            return next;
        });
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) {
            setResult("No teams selected");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/modify-scores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamIds: Array.from(selectedIds),
                    mode,
                    value
                })
            });

            const data = await res.json();
            if (data.success) {
                setResult(`✓ ${data.message}`);
                setSelectedIds(new Set());
            } else {
                setResult(`✗ ${data.error}`);
            }
        } catch (err) {
            setResult(`✗ ${err instanceof Error ? err.message : "Failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const divisions = [1, 2, 3, 4, 5, 6];

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Modify Scores
                </h1>
                <p className="text-white/40 mt-1">Force modify team scores</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-widest">
                    <Target className="w-3 h-3" /> Modify Options
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setMode("set")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "set"
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                    >
                        <Target className="w-4 h-4" /> Set To
                    </button>
                    <button
                        onClick={() => setMode("add")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "add"
                                ? "bg-green-500 text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                    <button
                        onClick={() => setMode("subtract")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "subtract"
                                ? "bg-red-500 text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                    >
                        <Minus className="w-4 h-4" /> Subtract
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-white/60 font-bold">Value:</label>
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xl text-center"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || selectedIds.size === 0}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Apply to {selectedIds.size} Team{selectedIds.size !== 1 ? "s" : ""}
                </button>

                {result && (
                    <div className={cn(
                        "p-4 rounded-xl text-center font-bold",
                        result.startsWith("✓") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {result}
                    </div>
                )}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase font-bold tracking-widest">
                        <Users className="w-3 h-3" /> Select Teams ({selectedIds.size} selected)
                    </div>
                    <div className="flex gap-2">
                        <button onClick={selectAll} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60">
                            Select All
                        </button>
                        <button onClick={deselectAll} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60">
                            Deselect All
                        </button>
                    </div>
                </div>

                {divisions.map(div => {
                    const divTeams = teams.filter(t => t.group === div);
                    if (divTeams.length === 0) return null;

                    const allSelected = divTeams.every(t => selectedIds.has(t.id));

                    return (
                        <div key={div} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-white/60 font-bold text-sm uppercase tracking-widest">
                                    Division {div} {div === 6 ? "(Graveyard)" : ""}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => selectDivision(div)}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-white/40"
                                    >
                                        Select
                                    </button>
                                    <button
                                        onClick={() => deselectDivision(div)}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-white/40"
                                    >
                                        Deselect
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {divTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => toggleTeam(team.id)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all text-left",
                                            selectedIds.has(team.id)
                                                ? "bg-blue-500/20 border-blue-500/50 text-white"
                                                : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm truncate">{team.name}</span>
                                            {selectedIds.has(team.id) && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-white/40">Score:</span>
                                            <span className="text-xs font-bold">{team.score}</span>
                                            {team.isBot && <span className="text-[8px] px-1 bg-white/10 rounded">BOT</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
