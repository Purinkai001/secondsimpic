"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, X, Edit2, Loader2, LogOut } from "lucide-react";
import { Team } from "@/lib/types";

interface SettingsModalProps {
    team: Team | null;
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
    onLogout: () => void;
}

export function SettingsModal({ team, isOpen, onClose, onRename, onLogout }: SettingsModalProps) {
    const [newName, setNewName] = useState(team?.name || "");
    const [renaming, setRenaming] = useState(false);

    const handleRename = async () => {
        if (!newName.trim()) return;
        setRenaming(true);
        try {
            await onRename(newName.trim());
            onClose();
        } catch (err) {
            console.error("Error renaming:", err);
        } finally {
            setRenaming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Settings
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Team Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                placeholder="Enter new team name"
                            />
                            <button
                                onClick={handleRename}
                                disabled={renaming || !newName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-500 mb-2">Team ID: {team?.id}</p>
                        <p className="text-xs text-gray-500 mb-2">Group: {team?.group}</p>
                        <p className="text-xs text-gray-500 mb-2">Streak: {team?.streak || 0}</p>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full mt-4 bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Leave Game
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
