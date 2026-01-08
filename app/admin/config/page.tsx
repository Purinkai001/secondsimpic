"use client";

import { useGameConfig } from "@/lib/hooks/useGameConfig";
import { StatCard } from "@/components/admin/StatCard";
import { Clock, Users, ShieldCheck, Save, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ConfigPage() {
    const { config, updateConfig, loading } = useGameConfig();
    const [localTimer, setLocalTimer] = useState<string>("");
    const [saving, setSaving] = useState(false);

    if (loading) return <div>Loading config...</div>;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const timer = parseInt(localTimer || config.questionTimer.toString());
        await updateConfig({ questionTimer: timer });
        setSaving(false);
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
