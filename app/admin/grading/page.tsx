"use client";

import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { api } from "@/lib/api";
import { CheckSquare, ShieldCheck, User, BookOpen, Check, X, Users, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GradingPage() {
    const { pendingAnswers, teams, questions } = useAdminDashboard();

    // Grouping by team
    const teamGroups = pendingAnswers.reduce((acc: any, answer) => {
        const teamId = answer.teamId;
        if (!acc[teamId]) {
            acc[teamId] = {
                team: teams.find(t => t.id === teamId),
                answers: []
            };
        }
        acc[teamId].answers.push({
            ...answer,
            question: questions.find(q => q.id === answer.questionId)
        });
        return acc;
    }, {});

    const teamIds = Object.keys(teamGroups);

    const gradeAnswer = async (answerId: string, correct: boolean) => {
        try {
            await api.gradeAnswer(answerId, correct);
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-white via-white to-amber-500 bg-clip-text text-transparent italic tracking-tight">
                        GRADING QUEUE
                    </h1>
                    <p className="text-white/40 mt-2 text-lg font-medium">Manual assessment hub for medical reasoning</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                        <Users className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-2xl font-black leading-none">{teamIds.length}</p>
                            <p className="text-[10px] font-black uppercase text-amber-500/50 mt-1">Teams Waiting</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                <AnimatePresence mode="popLayout">
                    {teamIds.map((teamId, tIdx) => {
                        const group = teamGroups[teamId];
                        return (
                            <motion.div
                                key={teamId}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: tIdx * 0.1 }}
                                className="bg-white/[0.03] border border-white/5 rounded-[3rem] overflow-hidden"
                            >
                                <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white uppercase italic">{group.team?.name || "Unknown Team"}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Group {group.team?.group}</span>
                                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{group.answers.length} Pending Results</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-white/40 border border-white/5">
                                            Awaiting Grade
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-white/5">
                                    {group.answers.map((answer: any, aIdx: number) => (
                                        <div key={answer.id} className="p-8 grid grid-cols-12 gap-8 items-center hover:bg-white/[0.01] transition-all">
                                            <div className="col-span-12 lg:col-span-7 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-white/20 bg-white/5 px-2 py-1 rounded">#{aIdx + 1}</span>
                                                    <BookOpen className="w-4 h-4 text-white/20" />
                                                    <p className="text-lg font-medium text-white/60 italic leading-relaxed">
                                                        {answer.question?.text}
                                                    </p>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MessageCircle className="w-3 h-3 text-white/20" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Student Answer</span>
                                                        </div>
                                                        <p className="text-4xl font-black text-blue-100 tracking-tight leading-none">
                                                            {answer.answer}
                                                        </p>
                                                    </div>

                                                    {answer.question?.correctAnswer && (
                                                        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6 flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <ShieldCheck className="w-3 h-3 text-green-500/30" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-500/30">Reference Key</span>
                                                            </div>
                                                            <p className="text-4xl font-black text-green-400 tracking-tight leading-none italic opacity-70">
                                                                {answer.question.correctAnswer}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-12 lg:col-span-5 flex items-center justify-end gap-4">
                                                <button
                                                    onClick={() => gradeAnswer(answer.id, false)}
                                                    className="flex-1 lg:flex-none h-20 px-10 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-3xl border border-red-500/20 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 shadow-lg shadow-red-500/5"
                                                >
                                                    <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                                                </button>

                                                <button
                                                    onClick={() => gradeAnswer(answer.id, true)}
                                                    className="flex-1 lg:flex-none h-20 px-10 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-3xl border border-green-500/20 transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 shadow-lg shadow-green-500/5"
                                                >
                                                    <Check className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {teamIds.length === 0 && (
                    <div className="py-60 text-center bg-white/[0.02] border-4 border-dashed border-white/[0.03] rounded-[4rem]">
                        <ShieldCheck className="w-24 h-24 text-green-500/10 mx-auto mb-8" />
                        <p className="text-4xl font-black text-white/20 italic uppercase tracking-wider">Queue Clear</p>
                        <p className="text-white/10 mt-2 font-medium">All manual grading points have been processed</p>
                    </div>
                )}
            </div>
        </div>
    );
}
