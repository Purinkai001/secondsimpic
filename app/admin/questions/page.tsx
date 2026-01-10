"use client";

import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Image as ImageIcon, Plus, Trash2, Upload, Loader2, FileQuestion, Search, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionModal } from "@/components/admin/QuestionModal";
import { api } from "@/lib/api";

export default function QuestionsPage() {
    const { questions } = useAdminDashboard();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSave = async (questionData: any) => {
        try {
            if (editingQuestion) {
                await api.updateQuestion(editingQuestion.id, questionData);
            } else {
                await api.createQuestion(questionData);
            }
            setIsModalOpen(false);
            setEditingQuestion(null);
        } catch (err) {
            alert(editingQuestion ? "Failed to update question" : "Failed to create question");
        }
    };

    const handleEdit = (q: any) => {
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        try {
            await api.deleteQuestion(id);
        } catch (err) {
            alert("Failed to delete question");
        }
    };

    // Grouping logic
    const rounds = ["round-1", "round-2", "round-3", "round-4", "round-5", "round-sd"];
    const groupedQuestions = rounds.reduce((acc: any, rid) => {
        acc[rid] = questions.filter(q => q.roundId === rid)
            .filter(q => (q.text || "").toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.order - b.order);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-white to-blue-400 bg-clip-text text-transparent italic">
                        QUESTION BANK
                    </h1>
                    <p className="text-white/40 mt-2 font-medium">Manage and organize competition items</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/20" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 transition-all font-medium"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all text-white shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>CREATE</span>
                    </button>
                </div>
            </div>

            <div className="space-y-12 pb-20">
                <AnimatePresence>
                    {rounds.map((rid, idx) => {
                        const roundQs = groupedQuestions[rid] || [];
                        if (roundQs.length === 0 && !searchTerm) return null;

                        return (
                            <motion.div
                                key={rid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4 group">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                    <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full group-hover:bg-white/10 transition-all cursor-default">
                                        <Layers className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">{rid.replace('-', ' ')}</span>
                                        <span className="text-xs text-white/20 font-bold ml-2">{roundQs.length} ITEMS</span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {roundQs.map((q: any) => (
                                        <motion.div
                                            key={q.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => handleEdit(q)}
                                            className="bg-white/[0.03] border border-white/10 hover:border-blue-500/30 p-6 rounded-[2rem] space-y-4 transition-all relative overflow-hidden group cursor-pointer"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                                                    className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-xl text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                    q.type === 'mcq' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        q.type === 'mtf' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                            q.type === 'saq' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                                )}>
                                                    {q.type}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/20">#{q.order}</span>
                                            </div>

                                            <p className="text-lg font-bold line-clamp-2 leading-snug group-hover:text-blue-200 transition-colors">
                                                {q.text || "(Image Question)"}
                                            </p>

                                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        q.difficulty === 'easy' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                            q.difficulty === 'medium' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                                'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                    )} />
                                                    <span className="text-[10px] font-black uppercase text-white/40">{q.difficulty}</span>
                                                </div>
                                                {q.imageUrl && <LocalImageIcon className="w-3 h-3 text-blue-400/50" />}
                                                <span className="text-[10px] font-bold text-white/20">{q.id.split('-').pop()}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {roundQs.length === 0 && (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                            <p className="text-white/20 font-black tracking-widest text-xs">NO QUESTIONS IN THIS SECTION</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <QuestionModal
                isOpen={isModalOpen}
                editingQuestion={editingQuestion}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingQuestion(null);
                }}
                onSave={handleSave}
            />
        </div>
    );
}

const LocalImageIcon = ({ className }: { className?: string }) => (
    <ImageIcon className={className} />
);
