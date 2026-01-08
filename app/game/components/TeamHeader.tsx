import { motion } from "framer-motion";
import { Users, Trophy, LogOut, Edit2 } from "lucide-react";
import { Team } from "@/lib/types";

interface TeamHeaderProps {
    team: Team | null;
    onLogout: () => void;
    onRename: () => void;
}

export const TeamHeader = ({ team, onLogout, onRename }: TeamHeaderProps) => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white leading-none">{team?.name || "Loading..."}</h1>
                    <button onClick={onRename} className="p-1 hover:bg-white/10 rounded transition-colors">
                        <Edit2 className="w-3 h-3 text-white/40" />
                    </button>
                </div>
                <p className="text-blue-400/60 text-sm font-medium uppercase tracking-wider mt-1">Group {team?.group} • {team?.status}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <motion.div
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl"
                whileHover={{ scale: 1.05 }}
            >
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-white/40 font-bold leading-none mb-1">Total Score</span>
                    <span className="text-xl font-black text-white leading-none">{team?.score || 0}</span>
                </div>
            </motion.div>

            <button
                onClick={onLogout}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all"
                title="Logout"
            >
                <LogOut className="w-6 h-6" />
            </button>
        </div>
    </div>
);
