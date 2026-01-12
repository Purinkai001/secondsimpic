"use client";

import { useGameConfig } from "@/lib/hooks/useGameConfig";
import { StatCard } from "@/components/admin/StatCard";
import { Clock, Users, ShieldCheck, Save, RefreshCw, Trash2, AlertTriangle, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/lib/types";

export default function ConfigPage() {
    const { config, updateConfig, loading } = useGameConfig();
    const [localTimer, setLocalTimer] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [kicking, setKicking] = useState(false);
    const [kickingAll, setKickingAll] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmKickAll, setConfirmKickAll] = useState(false);

    // Subscribe to teams for kick dropdown
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snap) => {
            const t = snap.docs.map(d => ({ id: d.id, ...d.data() } as Team));
            setTeams(t.sort((a, b) => a.name.localeCompare(b.name)));
        });
        return () => unsub();
    }, []);

    if (loading) return <div>Loading config...</div>;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const timer = parseInt(localTimer || config.questionTimer.toString());
        await updateConfig({ questionTimer: timer });
        setSaving(false);
    };

    const handleResetScores = async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        setResetting(true);
        try {
            const res = await fetch("/api/admin/reset-scores", { method: "POST" });
            const data = await res.json();
            alert(data.message || "Scores reset!");
        } catch (err) {
            alert("Failed to reset scores");
        } finally {
            setResetting(false);
            setConfirmReset(false);
        }
    };

    const handleKickTeam = async () => {
        if (!selectedTeamId) return;
        setKicking(true);
        try {
            const res = await fetch("/api/admin/kick", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId: selectedTeamId }),
            });
            const data = await res.json();
            alert(data.message || "Team kicked!");
            setSelectedTeamId("");
        } catch (err) {
            alert("Failed to kick team");
        } finally {
            setKicking(false);
        }
    };

    const handleKickAll = async () => {
        if (!confirmKickAll) {
            setConfirmKickAll(true);
            return;
        }
        setKickingAll(true);
        try {
            const res = await fetch("/api/admin/kick", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kickAll: true }),
            });
            const data = await res.json();
            alert(data.message || "All teams kicked!");
        } catch (err) {
            alert("Failed to kick all teams");
        } finally {
            setKickingAll(false);
            setConfirmKickAll(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Game Configuration</h1>
                <p className="text-white/40 mt-1">Manage global rules and session behavior</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Timer Settings
                    </h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-white/60">Default Question Timer (seconds)</label>
                            <input
                                type="number"
                                value={localTimer === "" ? config.questionTimer : localTimer}
                                onChange={(e) => setLocalTimer(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                            />
                        </div>

                        <button
                            disabled={saving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Rules
                        </button>
                    </form>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        Session Management
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div>
                                <p className="font-semibold">Trust-based Rejoining</p>
                                <p className="text-xs text-white/40">Allows teams to reuse names if disconnected</p>
                            </div>
                            <div className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-lg text-xs">ENABLED</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div>
                                <p className="font-semibold">Max Teams Per Group</p>
                                <p className="text-xs text-white/40">Current limit: {config.maxTeamsPerGroup}</p>
                            </div>
                            <Users className="w-5 h-5 text-white/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-3 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Reset Scores */}
                    <div className="space-y-3">
                        <p className="text-sm text-white/60">Reset all team scores and streaks to zero</p>
                        <button
                            onClick={handleResetScores}
                            disabled={resetting}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${confirmReset
                                    ? "bg-red-600 hover:bg-red-500 text-white"
                                    : "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                                }`}
                        >
                            {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {confirmReset ? "Click Again to Confirm" : "Reset All Scores"}
                        </button>
                    </div>

                    {/* Kick All */}
                    <div className="space-y-3">
                        <p className="text-sm text-white/60">Remove all teams and their answer history</p>
                        <button
                            onClick={handleKickAll}
                            disabled={kickingAll}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${confirmKickAll
                                    ? "bg-red-600 hover:bg-red-500 text-white"
                                    : "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                                }`}
                        >
                            {kickingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                            {confirmKickAll ? "Click Again to Confirm" : "Kick All Players"}
                        </button>
                    </div>
                </div>

                {/* Kick Individual */}
                <div className="space-y-3 pt-4 border-t border-red-500/10">
                    <p className="text-sm text-white/60">Kick a specific team</p>
                    <div className="flex gap-3">
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 text-white appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#0a0e1a]">Select a team...</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id} className="bg-[#0a0e1a]">
                                    {team.name} (Group {team.group}) - {team.score} pts
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleKickTeam}
                            disabled={!selectedTeamId || kicking}
                            className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {kicking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                            Kick
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl space-y-4">
                <p className="text-amber-400 text-sm flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    Firestore Security Rules Required
                </p>
                <p className="text-white/60 text-xs leading-relaxed">
                    If you see errors saving configuration, ensure your Firestore rules allow access to the <code className="bg-black/40 px-1 rounded text-blue-400">config</code> collection. Copy the rules below into your Firebase Console:
                </p>
                <pre className="bg-black/60 p-4 rounded-xl text-[10px] font-mono text-blue-300 border border-white/5 overflow-x-auto">
                    {`match /config/{document} {
  allow read, write: if request.auth != null;
}`}
                </pre>
            </div>
        </div>
    );
}

