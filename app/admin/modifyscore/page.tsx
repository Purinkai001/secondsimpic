"use client";

import { useState, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus, Target, Users, RefreshCw } from "lucide-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { AdminBadge, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPrimitives";

type ModifyMode = "set" | "add" | "subtract";

export default function ModifyScorePage() {
    const rawTeams = useTeams();
    const teams = useMemo(() => [...rawTeams].sort((a, b) => {
        if (a.group !== b.group) return a.group - b.group;
        return b.score - a.score;
    }), [rawTeams]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<ModifyMode>("set");
    const [value, setValue] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const toggleTeam = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(teams.map((t) => t.id)));
    const deselectAll = () => setSelectedIds(new Set());
    const selectDivision = (div: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            teams.filter((t) => t.group === div).forEach((t) => next.add(t.id));
            return next;
        });
    };
    const deselectDivision = (div: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            teams.filter((t) => t.group === div).forEach((t) => next.delete(t.id));
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
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    teamIds: Array.from(selectedIds),
                    mode,
                    value,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setResult(`Success: ${data.message}`);
                setSelectedIds(new Set());
            } else {
                setResult(`Error: ${data.error}`);
            }
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : "Failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const divisions = [1, 2, 3, 4, 5, 6];

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Score Override"
                title="Modify Scores"
                description="Apply controlled score overrides across selected teams without changing the underlying admin workflow."
                status={<AdminBadge tone="warning">{selectedIds.size} Selected</AdminBadge>}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <AdminPanel title="Modify Options" description="Choose the adjustment type and value before applying." icon={Target}>
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-3">
                            {[
                                { key: "set", label: "Set To", icon: Target, tone: "accent" },
                                { key: "add", label: "Add", icon: Plus, tone: "success" },
                                { key: "subtract", label: "Subtract", icon: Minus, tone: "danger" },
                            ].map((option) => {
                                const Icon = option.icon;
                                const active = mode === option.key;
                                return (
                                    <button
                                        key={option.key}
                                        onClick={() => setMode(option.key as ModifyMode)}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-5 py-3 font-atsanee text-lg font-black uppercase italic transition-all",
                                            active
                                                ? option.tone === "success"
                                                    ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-100"
                                                    : option.tone === "danger"
                                                        ? "border-rose-300/20 bg-rose-300/12 text-rose-100"
                                                        : "border-admin-cyan/20 bg-admin-cyan/12 text-admin-cyan"
                                                : "border-white/10 bg-white/[0.04] text-admin-muted hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">Value</label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(Number(e.target.value))}
                                className="admin-input w-40 rounded-[1.5rem] px-5 py-4 text-center text-3xl font-black text-gold"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedIds.size === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-shiny px-[1px] py-[1px] disabled:opacity-50"
                        >
                            <span className="flex min-w-[280px] items-center justify-center gap-2 rounded-full bg-[#04112d] px-6 py-4 font-atsanee text-xl font-black uppercase italic text-gold">
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                Apply to {selectedIds.size} Team{selectedIds.size !== 1 ? "s" : ""}
                            </span>
                        </button>

                        {result && (
                            <div className={cn(
                                "rounded-[1.5rem] border px-5 py-4 text-sm font-semibold",
                                result.startsWith("Success:")
                                    ? "border-emerald-300/18 bg-emerald-300/10 text-emerald-100"
                                    : "border-rose-300/18 bg-rose-300/10 text-rose-100"
                            )}>
                                {result}
                            </div>
                        )}
                    </div>
                </AdminPanel>

                <AdminPanel
                    title="Select Teams"
                    description="Pick entire divisions or individual teams for the score override."
                    icon={Users}
                    actions={
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted hover:text-white">Select All</button>
                            <button onClick={deselectAll} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted hover:text-white">Clear</button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        {divisions.map((div) => {
                            const divTeams = teams.filter((t) => t.group === div);
                            if (divTeams.length === 0) return null;

                            return (
                                <div key={div} className="space-y-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="font-atsanee text-2xl font-black uppercase italic text-gold">
                                            Division {div} {div === 6 ? "(Graveyard)" : ""}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectDivision(div)}
                                                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted hover:text-white"
                                            >
                                                Select
                                            </button>
                                            <button
                                                onClick={() => deselectDivision(div)}
                                                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted hover:text-white"
                                            >
                                                Deselect
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {divTeams.map((team) => (
                                            <button
                                                key={team.id}
                                                onClick={() => toggleTeam(team.id)}
                                                className={cn(
                                                    "rounded-[1.5rem] border p-4 text-left transition-all",
                                                    selectedIds.has(team.id)
                                                        ? "border-admin-cyan/22 bg-admin-cyan/10"
                                                        : "border-white/8 bg-white/[0.04] hover:border-admin-cyan/16"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className={cn(
                                                            "truncate font-bold",
                                                            selectedIds.has(team.id) ? "text-admin-cyan" : "text-white/85"
                                                        )}>
                                                            {team.name}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-admin-muted">
                                                            <span>Score {team.score}</span>
                                                            {team.isBot && (
                                                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                                                                    Bot
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedIds.has(team.id) && <Check className="h-4 w-4 shrink-0 text-admin-cyan" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AdminPanel>
            </div>
        </div>
    );
}
