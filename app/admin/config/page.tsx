"use client";

import { useGameConfig } from "@/lib/admin/hooks/useGameConfig";
import { Clock, Users, ShieldCheck, Save, RefreshCw, Trash2, AlertTriangle, UserX } from "lucide-react";
import { useState, useMemo } from "react";
import { useTeams } from "@/lib/hooks/useTeams";
import { api } from "@/lib/api";
import { AdminBadge, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPrimitives";

export default function ConfigPage() {
    const { config, updateConfig, loading } = useGameConfig();
    const [localTimer, setLocalTimer] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [kicking, setKicking] = useState(false);
    const [kickingAll, setKickingAll] = useState(false);
    const allTeams = useTeams("name");
    const teams = useMemo(() => [...allTeams].sort((a, b) => a.name.localeCompare(b.name)), [allTeams]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmKickAll, setConfirmKickAll] = useState(false);

    if (loading) return <div className="text-admin-muted">Loading config...</div>;

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
            const data = await api.resetScores();
            alert(data.message || "Scores reset!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to reset scores");
        } finally {
            setResetting(false);
            setConfirmReset(false);
        }
    };

    const handleKickTeam = async () => {
        if (!selectedTeamId) return;
        setKicking(true);
        try {
            const data = await api.kickTeam(selectedTeamId);
            alert(data.message || "Team kicked!");
            setSelectedTeamId("");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to kick team");
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
            const data = await api.kickAllTeams();
            alert(data.message || "All teams kicked!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to kick all teams");
        } finally {
            setKickingAll(false);
            setConfirmKickAll(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Rule Deck"
                title="Game Configuration"
                description="Manage timer defaults, session behavior, and destructive recovery operations without altering API contracts."
                status={<AdminBadge tone="accent">Server-Enforced Writes</AdminBadge>}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <AdminPanel title="Timer Settings" description="Default round timing and pacing controls." icon={Clock}>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">
                                Default Question Timer (seconds)
                            </label>
                            <input
                                type="number"
                                value={localTimer === "" ? config.questionTimer : localTimer}
                                onChange={(e) => setLocalTimer(e.target.value)}
                                className="admin-input w-full rounded-[1.5rem] px-5 py-4 text-2xl font-black text-gold"
                            />
                        </div>

                        <button
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-shiny px-[1px] py-[1px]"
                        >
                            <span className="flex items-center gap-2 rounded-full bg-[#04112d] px-6 py-3 font-atsanee text-xl font-black uppercase italic text-gold">
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Rules
                            </span>
                        </button>
                    </form>
                </AdminPanel>

                <AdminPanel title="Session Management" description="Operational settings that affect reconnect and group limits." icon={ShieldCheck}>
                    <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-white/90">Trust-based Rejoining</p>
                                    <p className="mt-1 text-sm text-admin-muted">Allows teams to reuse names if disconnected.</p>
                                </div>
                                <AdminBadge tone="success">Enabled</AdminBadge>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-white/90">Max Teams Per Group</p>
                                    <p className="mt-1 text-sm text-admin-muted">Current limit: {config.maxTeamsPerGroup}</p>
                                </div>
                                <Users className="h-5 w-5 text-gold/70" />
                            </div>
                        </div>
                    </div>
                </AdminPanel>
            </div>

            <AdminPanel
                title="Danger Zone"
                description="High-impact recovery actions for scores and active player sessions."
                icon={AlertTriangle}
                tone="danger"
            >
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-rose-300/18 bg-rose-300/10 p-5">
                        <p className="text-sm font-medium text-rose-100/80">Reset all team scores and streaks to zero.</p>
                        <button
                            onClick={handleResetScores}
                            disabled={resetting}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200/25 px-5 py-3 font-atsanee text-lg font-black uppercase italic text-rose-100 transition-all hover:bg-rose-200/10"
                        >
                            {resetting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            {confirmReset ? "Click Again to Confirm" : "Reset All Scores"}
                        </button>
                    </div>

                    <div className="rounded-[1.75rem] border border-rose-300/18 bg-rose-300/10 p-5">
                        <p className="text-sm font-medium text-rose-100/80">Remove all teams and their answer history.</p>
                        <button
                            onClick={handleKickAll}
                            disabled={kickingAll}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200/25 px-5 py-3 font-atsanee text-lg font-black uppercase italic text-rose-100 transition-all hover:bg-rose-200/10"
                        >
                            {kickingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            {confirmKickAll ? "Click Again to Confirm" : "Kick All Players"}
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">Kick Specific Team</p>
                    <div className="flex flex-col gap-3 md:flex-row">
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="admin-input min-w-0 flex-1 appearance-none rounded-full px-5 py-3 text-sm font-semibold"
                        >
                            <option value="" className="bg-background">Select a team...</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id} className="bg-background">
                                    {team.name} (Group {team.group}) - {team.score} pts
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleKickTeam}
                            disabled={!selectedTeamId || kicking}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300/20 bg-rose-300/10 px-6 py-3 font-atsanee text-xl font-black uppercase italic text-rose-100 transition-all hover:bg-rose-300/18 disabled:opacity-50"
                        >
                            {kicking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            Kick
                        </button>
                    </div>
                </div>
            </AdminPanel>

            <AdminPanel title="Security Note" description="Config writes remain server-enforced and direct client writes should stay blocked." icon={ShieldCheck}>
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-admin-muted">
                        Configuration updates go through the admin API and should remain blocked from direct browser writes in Firestore rules. If saving fails, verify the signed-in account is whitelisted in <code className="rounded bg-white/[0.06] px-1 text-admin-cyan">ADMIN_EMAILS</code>.
                    </p>
                    <pre className="overflow-x-auto rounded-[1.5rem] border border-white/8 bg-black/35 p-4 text-[10px] text-admin-cyan">
{`match /config/{document=**} {
  allow read: if true;
  allow write: if false;
}`}
                    </pre>
                </div>
            </AdminPanel>
        </div>
    );
}
