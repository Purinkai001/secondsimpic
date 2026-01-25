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
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-accent-blue/60">
                    Modify Scores
                </h1>
                <p className="text-muted mt-1">Force modify team scores</p>
            </div>

            <div className="bg-surface-bg border border-surface-border rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-widest">
                    <Target className="w-3 h-3" /> Modify Options
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setMode("set")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "set"
                                ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20"
                                : "bg-surface-bg border border-surface-border text-muted hover:bg-surface-bg/80"
                        )}
                    >
                        <Target className="w-4 h-4" /> Set To
                    </button>
                    <button
                        onClick={() => setMode("add")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "add"
                                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                                : "bg-surface-bg border border-surface-border text-muted hover:bg-surface-bg/80"
                        )}
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                    <button
                        onClick={() => setMode("subtract")}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            mode === "subtract"
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                : "bg-surface-bg border border-surface-border text-muted hover:bg-surface-bg/80"
                        )}
                    >
                        <Minus className="w-4 h-4" /> Subtract
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-muted font-bold">Value:</label>
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-32 bg-surface-bg/50 border border-surface-border rounded-xl px-4 py-3 text-foreground font-black text-xl text-center focus:outline-none focus:border-accent-blue/30"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || selectedIds.size === 0}
                    className="w-full py-4 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-xl font-black text-lg uppercase tracking-widest text-white disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-accent-blue/10"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Apply to {selectedIds.size} Team{selectedIds.size !== 1 ? "s" : ""}
                </button>

                {result && (
                    <div className={cn(
                        "p-4 rounded-xl text-center font-bold animate-in fade-in slide-in-from-top-2",
                        result.startsWith("✓") ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    )}>
                        {result}
                    </div>
                )}
            </div>

            <div className="bg-surface-bg border border-surface-border rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-widest">
                        <Users className="w-3 h-3" /> Select Teams ({selectedIds.size} selected)
                    </div>
                    <div className="flex gap-2">
                        <button onClick={selectAll} className="px-3 py-1 bg-surface-bg hover:bg-surface-bg/80 border border-surface-border rounded-lg text-xs font-bold text-muted transition-colors">
                            Select All
                        </button>
                        <button onClick={deselectAll} className="px-3 py-1 bg-surface-bg hover:bg-surface-bg/80 border border-surface-border rounded-lg text-xs font-bold text-muted transition-colors">
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
                                <span className="text-muted font-black text-sm uppercase tracking-widest">
                                    Division {div} {div === 6 ? "(Graveyard)" : ""}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => selectDivision(div)}
                                        className="px-2 py-1 bg-surface-bg hover:bg-surface-bg/80 border border-surface-border rounded text-[10px] font-bold text-muted transition-colors"
                                    >
                                        Select
                                    </button>
                                    <button
                                        onClick={() => deselectDivision(div)}
                                        className="px-2 py-1 bg-surface-bg hover:bg-surface-bg/80 border border-surface-border rounded text-[10px] font-bold text-muted transition-colors"
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
                                            "p-3 rounded-xl border transition-all text-left group/card",
                                            selectedIds.has(team.id)
                                                ? "bg-accent-blue/10 border-accent-blue text-foreground"
                                                : "bg-surface-bg/50 border-surface-border text-muted hover:bg-surface-bg hover:border-accent-blue/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={cn("font-bold text-sm truncate", selectedIds.has(team.id) ? "text-accent-blue" : "text-foreground/80 group-hover/card:text-foreground")}>{team.name}</span>
                                            {selectedIds.has(team.id) && <Check className="w-4 h-4 text-accent-blue shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted/40">Score:</span>
                                            <span className="text-xs font-bold text-foreground/60">{team.score}</span>
                                            {team.isBot && <span className="text-[8px] px-1 bg-muted/10 text-muted rounded">BOT</span>}
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
