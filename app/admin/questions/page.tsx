"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Plus, Trash2, Edit2, ArrowLeft, Upload, X, Save, Image as ImageIcon } from "lucide-react";
import { Question, QuestionType, Difficulty } from "@/lib/types";
import Link from "next/link";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { cn } from "@/lib/utils";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: "mcq", label: "Multiple Choice (MCQ)" },
    { value: "mtf", label: "Multiple True/False (MTF)" },
    { value: "saq", label: "Short Answer (SAQ)" },
    { value: "spot", label: "Spot Diagnosis" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
    { value: "easy", label: "Easy (1x)", color: "bg-green-500" },
    { value: "medium", label: "Medium (2x)", color: "bg-yellow-500" },
    { value: "difficult", label: "Difficult (3x)", color: "bg-red-500" },
];

const ROUNDS = ["round-1", "round-2", "round-3", "round-4", "round-5", "sudden-death"];

export default function QuestionManagementPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedRound, setSelectedRound] = useState<string>("round-1");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        text: "",
        type: "mcq" as QuestionType,
        difficulty: "easy" as Difficulty,
        imageUrl: "",
        order: 1,
        // MCQ
        choices: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correctChoiceIndex: 0,
        // MTF
        statements: [{ text: "", isTrue: true }],
        // SAQ/Spot
        correctAnswer: "",
    });

    // Image upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubAuth();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/questions?key=admin123&roundId=${selectedRound}`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions || []);
            }
        } catch (err) {
            console.error("Error fetching questions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchQuestions();
        }
    }, [user, selectedRound]);

    const resetForm = () => {
        setFormData({
            text: "",
            type: "mcq",
            difficulty: "easy",
            imageUrl: "",
            order: questions.length + 1,
            choices: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
            correctChoiceIndex: 0,
            statements: [{ text: "", isTrue: true }],
            correctAnswer: "",
        });
    };

    const openCreateModal = () => {
        setEditingQuestion(null);
        resetForm();
        setFormData(prev => ({ ...prev, order: questions.length + 1 }));
        setShowModal(true);
    };

    const openEditModal = (question: Question) => {
        setEditingQuestion(question);
        setFormData({
            text: question.text || "",
            type: question.type,
            difficulty: question.difficulty || "easy",
            imageUrl: question.imageUrl || "",
            order: question.order,
            choices: question.choices || [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
            correctChoiceIndex: question.correctChoiceIndex ?? 0,
            statements: question.statements || [{ text: "", isTrue: true }],
            correctAnswer: question.correctAnswer || "",
        });
        setShowModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            formDataUpload.append("key", "admin123");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formDataUpload,
            });

            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, imageUrl: data.url }));
            } else {
                alert(data.error || "Failed to upload image");
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const questionData: any = {
                roundId: selectedRound,
                text: formData.text,
                type: formData.type,
                difficulty: formData.difficulty,
                order: formData.order,
                imageUrl: formData.imageUrl || null,
            };

            // Add type-specific fields
            if (formData.type === "mcq") {
                questionData.choices = formData.choices.filter(c => c.text.trim());
                questionData.correctChoiceIndex = formData.correctChoiceIndex;
            } else if (formData.type === "mtf") {
                questionData.statements = formData.statements.filter(s => s.text.trim());
            } else if (formData.type === "saq" || formData.type === "spot") {
                questionData.correctAnswer = formData.correctAnswer;
            }

            if (editingQuestion) {
                // Update existing
                const res = await fetch("/api/questions", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: "admin123",
                        questionId: editingQuestion.id,
                        updates: questionData,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            } else {
                // Create new
                const res = await fetch("/api/questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: "admin123",
                        question: questionData,
                    }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            }

            setShowModal(false);
            fetchQuestions();
        } catch (err: any) {
            alert(err.message || "Failed to save question");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm("Delete this question?")) return;

        try {
            const res = await fetch("/api/questions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "admin123", questionId }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            fetchQuestions();
        } catch (err: any) {
            alert(err.message || "Failed to delete question");
        }
    };

    const addChoice = () => {
        setFormData(prev => ({
            ...prev,
            choices: [...prev.choices, { text: "" }],
        }));
    };

    const removeChoice = (index: number) => {
        setFormData(prev => ({
            ...prev,
            choices: prev.choices.filter((_, i) => i !== index),
            correctChoiceIndex: prev.correctChoiceIndex >= index ? Math.max(0, prev.correctChoiceIndex - 1) : prev.correctChoiceIndex,
        }));
    };

    const addStatement = () => {
        setFormData(prev => ({
            ...prev,
            statements: [...prev.statements, { text: "", isTrue: true }],
        }));
    };

    const removeStatement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            statements: prev.statements.filter((_, i) => i !== index),
        }));
    };

    if (loadingAuth) {
        return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
    }

    if (!user) {
        return <AdminLogin />;
    }

    return (
        <div className="min-h-screen bg-gray-100 text-slate-900 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold">Question Management</h1>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Question
                </button>
            </div>

            {/* Round Selector */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {ROUNDS.map(round => (
                        <button
                            key={round}
                            onClick={() => setSelectedRound(round)}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-colors",
                                selectedRound === round
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                            )}
                        >
                            {round.replace("-", " ").toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    </div>
                ) : questions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No questions for this round. Click "Add Question" to create one.
                    </div>
                ) : (
                    <div className="divide-y">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm">
                                    {q.order}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold text-white",
                                            q.type === "mcq" ? "bg-blue-500" :
                                                q.type === "mtf" ? "bg-purple-500" :
                                                    q.type === "saq" ? "bg-green-500" : "bg-orange-500"
                                        )}>
                                            {q.type.toUpperCase()}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-bold text-white",
                                            q.difficulty === "easy" ? "bg-green-600" :
                                                q.difficulty === "medium" ? "bg-yellow-600" : "bg-red-600"
                                        )}>
                                            {q.difficulty}
                                        </span>
                                        {q.imageUrl && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" /> Has image
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-800 line-clamp-2">{q.text || "(No text - image only)"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(q)}
                                        className="p-2 hover:bg-blue-100 rounded text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="p-2 hover:bg-red-100 rounded text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingQuestion ? "Edit Question" : "Create Question"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Type and Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Question Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as QuestionType }))}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        {QUESTION_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        {DIFFICULTIES.map(d => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Order</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                                    className="w-24 border rounded-lg px-3 py-2"
                                    min={1}
                                />
                            </div>

                            {/* Question Text */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Question Text (optional)</label>
                                <textarea
                                    value={formData.text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                                    placeholder="Enter question text..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Image (optional)</label>
                                <div className="flex gap-2 items-start">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Upload Image
                                    </button>
                                    {formData.imageUrl && (
                                        <div className="flex-1">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="h-20 object-contain rounded border"
                                            />
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                                                className="text-xs text-red-500 mt-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Type-specific fields */}
                            {formData.type === "mcq" && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Choices</label>
                                    <div className="space-y-2">
                                        {formData.choices.map((choice, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="radio"
                                                    name="correctChoice"
                                                    checked={formData.correctChoiceIndex === idx}
                                                    onChange={() => setFormData(prev => ({ ...prev, correctChoiceIndex: idx }))}
                                                    className="w-4 h-4"
                                                />
                                                <input
                                                    type="text"
                                                    value={choice.text}
                                                    onChange={(e) => {
                                                        const newChoices = [...formData.choices];
                                                        newChoices[idx] = { text: e.target.value };
                                                        setFormData(prev => ({ ...prev, choices: newChoices }));
                                                    }}
                                                    className="flex-1 border rounded-lg px-3 py-2"
                                                    placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                                                />
                                                {formData.choices.length > 2 && (
                                                    <button
                                                        onClick={() => removeChoice(idx)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={addChoice}
                                        className="mt-2 text-sm text-blue-600 hover:underline"
                                    >
                                        + Add choice
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Select the radio button for the correct answer
                                    </p>
                                </div>
                            )}

                            {formData.type === "mtf" && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Statements</label>
                                    <div className="space-y-2">
                                        {formData.statements.map((statement, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={statement.text}
                                                    onChange={(e) => {
                                                        const newStatements = [...formData.statements];
                                                        newStatements[idx] = { ...newStatements[idx], text: e.target.value };
                                                        setFormData(prev => ({ ...prev, statements: newStatements }));
                                                    }}
                                                    className="flex-1 border rounded-lg px-3 py-2"
                                                    placeholder={`Statement ${idx + 1}`}
                                                />
                                                <select
                                                    value={statement.isTrue ? "true" : "false"}
                                                    onChange={(e) => {
                                                        const newStatements = [...formData.statements];
                                                        newStatements[idx] = { ...newStatements[idx], isTrue: e.target.value === "true" };
                                                        setFormData(prev => ({ ...prev, statements: newStatements }));
                                                    }}
                                                    className="border rounded-lg px-3 py-2"
                                                >
                                                    <option value="true">TRUE</option>
                                                    <option value="false">FALSE</option>
                                                </select>
                                                {formData.statements.length > 1 && (
                                                    <button
                                                        onClick={() => removeStatement(idx)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={addStatement}
                                        className="mt-2 text-sm text-blue-600 hover:underline"
                                    >
                                        + Add statement
                                    </button>
                                </div>
                            )}

                            {(formData.type === "saq" || formData.type === "spot") && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Correct Answer (must match exactly, case-insensitive)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.correctAnswer}
                                        onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Enter correct answer..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
