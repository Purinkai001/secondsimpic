import { motion } from "framer-motion";
import { Users, Trophy, LogOut, Edit2 } from "lucide-react";
import { Team } from "@/lib/types";

interface TeamHeaderProps {
    team: Team | null;
    onLogout: () => void;
    onRename: () => void;
}

export const TeamHeader = ({ team, onLogout, onRename }: TeamHeaderProps) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-8 bg-white/[0.02] md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border border-white/5 md:border-none">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-2 md:p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-white leading-none break-words">{team?.name || "Loading..."}</h1>
                    <button onClick={onRename} className="p-1 hover:bg-white/10 rounded transition-colors shrink-0">
                        <Edit2 className="w-3 h-3 text-white/40" />
                    </button>
                </div>
                <p className="text-blue-400/60 text-xs md:text-sm font-medium uppercase tracking-wider mt-1">Group {team?.group} • {team?.status}</p>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <motion.div
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 md:px-6 py-2 md:py-3 flex items-center justify-between md:justify-start gap-3 shadow-xl flex-1 md:flex-initial"
                whileHover={{ scale: 1.05 }}
            >
                <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                    <div className="flex flex-col text-left">
                        <span className="text-[8px] md:text-[10px] uppercase text-white/40 font-bold leading-none mb-1">Total Score</span>
                        <span className="text-lg md:text-xl font-black text-white leading-none">{team?.score || 0}</span>
                    </div>
                </div>
            </motion.div>

            <button
                onClick={onLogout}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all shrink-0"
                title="Logout"
            >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>
        </div>
    </div>
);
