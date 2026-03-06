"use client";

import { useAdminDashboard } from "@/lib/admin/hooks/useAdminDashboard";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Plus, Trash2, Search, ChevronRight, Layers, FileQuestion } from "lucide-react";
import { QuestionModal } from "@/components/admin/question-modal";
import { api } from "@/lib/api";
import { Question } from "@/lib/types";
import { AdminBadge, AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminPrimitives";

export default function QuestionsPage() {
    const { questions } = useAdminDashboard();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSave = async (questionData: Partial<Question>) => {
        try {
            if (editingQuestion) {
                await api.updateQuestion(editingQuestion.id, questionData);
            } else {
                await api.createQuestion(questionData);
            }
            setIsModalOpen(false);
            setEditingQuestion(null);
        } catch {
            alert(editingQuestion ? "Failed to update question" : "Failed to create question");
        }
    };

    const handleEdit = (q: Question) => {
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
        } catch {
            alert("Failed to delete question");
        }
    };

    const rounds = ["round-1", "round-2", "round-3", "round-4", "round-5"];
    const groupedQuestions = rounds.reduce((acc: Record<string, Question[]>, rid) => {
        acc[rid] = questions.filter((q) => q.roundId === rid)
            .filter((q) => (q.text || "").toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.order - b.order);
        return acc;
    }, {});

    return (
        <div className="space-y-8 pb-10">
            <AdminPageHeader
                eyebrow="Question Forge"
                title="Question Bank"
                description="Manage prompts, ordering, imagery, and answer keys while keeping the data flow unchanged."
                status={<AdminBadge>{questions.length} Total Questions</AdminBadge>}
                actions={
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                        <div className="relative min-w-[260px]">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search questions..."
                                className="admin-input w-full rounded-full py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-admin-muted/65"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-shiny px-[1px] py-[1px]"
                        >
                            <span className="flex items-center gap-2 rounded-full bg-[#04112d] px-6 py-3 font-atsanee text-xl font-black uppercase italic text-gold">
                                <Plus className="h-5 w-5" />
                                Add Question
                            </span>
                        </button>
                    </div>
                }
            />

            <div className="space-y-10">
                <AnimatePresence>
                    {rounds.map((rid, idx) => {
                        const roundQs = groupedQuestions[rid] || [];
                        if (roundQs.length === 0 && !searchTerm) return null;

                        return (
                            <motion.section
                                key={rid}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/12 to-transparent" />
                                    <div className="inline-flex items-center gap-3 rounded-full border border-gold/15 bg-gold/8 px-5 py-2">
                                        <Layers className="h-4 w-4 text-gold" />
                                        <span className="font-atsanee text-xl font-black uppercase italic text-gold">
                                            {rid.replace("-", " ")}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted">
                                            {roundQs.length} Items
                                        </span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/12 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {roundQs.map((q) => (
                                        <motion.div
                                            key={q.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => handleEdit(q)}
                                            className="admin-panel cursor-pointer overflow-hidden rounded-[2rem] p-5 transition-all hover:border-admin-cyan/22"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <AdminBadge tone="accent" className="px-3 py-1">{q.type}</AdminBadge>
                                                    <AdminBadge
                                                        tone={q.difficulty === "easy" ? "success" : q.difficulty === "medium" ? "warning" : "danger"}
                                                        className="px-3 py-1"
                                                    >
                                                        {q.difficulty}
                                                    </AdminBadge>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-admin-muted">#{q.order}</span>
                                            </div>

                                            <p className="mt-5 line-clamp-3 text-xl font-black leading-snug text-white transition-colors group-hover:text-admin-cyan">
                                                {q.text || "(Image Question)"}
                                            </p>

                                            <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                                                <div className="flex items-center gap-2">
                                                    {q.imageUrl && <ImageIcon className="h-4 w-4 text-admin-cyan/70" />}
                                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-admin-muted">
                                                        {q.id.split("-").pop()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                                                        className="rounded-full border border-rose-300/20 bg-rose-300/10 p-2 text-rose-100 transition-all hover:bg-rose-300/18"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <div className="rounded-full border border-admin-cyan/20 bg-admin-cyan/10 p-2 text-admin-cyan">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {roundQs.length === 0 && (
                                        <AdminEmptyState
                                            icon={FileQuestion}
                                            title="No Questions Found"
                                            description="This round currently has no questions matching the active search."
                                            className="col-span-full px-6 py-14"
                                        />
                                    )}
                                </div>
                            </motion.section>
                        );
                    })}
                </AnimatePresence>
            </div>

            {questions.length === 0 && (
                <AdminEmptyState
                    icon={FileQuestion}
                    title="Question Bank Empty"
                    description="Create the first question to populate the round rails."
                />
            )}

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
