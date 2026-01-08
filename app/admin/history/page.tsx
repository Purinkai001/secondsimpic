"use client";

import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { History, Download, User, Search, Filter, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
    const { allAnswers, teams, questions } = useAdminDashboard();
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAnswers = useMemo(() => {
        return allAnswers
            .filter(a => selectedTeamId === "all" || a.teamId === selectedTeamId)
            .filter(a => {
                const team = teams.find(t => t.id === a.teamId);
                const question = questions.find(q => q.id === a.questionId);
                const searchStr = `${team?.name} ${question?.text} ${a.answer}`.toLowerCase();
                return searchStr.includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => b.submittedAt - a.submittedAt);
    }, [allAnswers, selectedTeamId, searchQuery, teams, questions]);

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-white via-white to-blue-500 bg-clip-text text-transparent italic tracking-tight">
                        ANSWER LOG
                    </h1>
                    <p className="text-white/40 mt-2 text-lg font-medium">Real-time audit trail of all submissions</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/20" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search logs..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-blue-500/30 transition-all"
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-4 top-3.5 w-5 h-5 text-white/20" />
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-blue-500/30 transition-all appearance-none cursor-pointer text-white"
                        >
                            <option value="all" className="bg-[#0a0e1a] text-white">All Teams</option>
                            {teams.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                                <option key={t.id} value={t.id} className="bg-[#0a0e1a] text-white">{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredAnswers.map((answer, idx) => {
                        const team = teams.find(t => t.id === answer.teamId);
                        const question = questions.find(q => q.id === answer.questionId);

                        return (
                            <motion.div
                                key={answer.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.05, 1) }}
                                className={cn(
                                    "relative bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] overflow-hidden group transition-all",
                                    answer.isCorrect === true ? "hover:border-green-500/30" :
                                        answer.isCorrect === false ? "hover:border-red-500/30" : "hover:border-amber-500/30"
                                )}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[5rem] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all" />

                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    <div className="flex-shrink-0 flex items-center gap-4">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black",
                                            answer.isCorrect === true ? "bg-green-500/20 text-green-400" :
                                                answer.isCorrect === false ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-white group-hover:text-blue-200 transition-colors tracking-tight uppercase italic">{team?.name || "Unknown Team"}</p>
                                            <p className="text-sm text-white/20 font-bold uppercase tracking-widest mt-1">
                                                {new Date(answer.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-white/20" />
                                            <p className="text-xl font-medium text-white/50 leading-relaxed italic">
                                                {question?.text || "Question data missing..."}
                                            </p>
                                        </div>

                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Team Submission</span>
                                            <p className="text-4xl font-black text-white break-all tracking-tight">
                                                {Array.isArray(answer.answer) ? answer.answer.map(v => v ? "T" : "F").join(", ") : answer.answer.toString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="lg:text-right space-y-2 min-w-[150px]">
                                        <div className={cn(
                                            "inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border",
                                            answer.isCorrect === true ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                answer.isCorrect === false ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        )}>
                                            {answer.isCorrect === true ? "CORRECT" : answer.isCorrect === false ? "INCORRECT" : "PENDING"}
                                        </div>
                                        <p className="text-4xl font-black italic">{answer.points} <span className="text-xs non-italic font-bold text-white/20 uppercase tracking-widest">PTS</span></p>
                                        <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{answer.timeSpent.toFixed(1)}s taken</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredAnswers.length === 0 && (
                    <div className="py-40 text-center border-4 border-dashed border-white/[0.02] rounded-[3rem]">
                        <History className="w-20 h-20 text-white/[0.05] mx-auto mb-6" />
                        <p className="text-3xl font-black text-white/10 uppercase italic tracking-widest">No Logs Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
