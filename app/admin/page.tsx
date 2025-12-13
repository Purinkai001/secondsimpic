"use client";

import { useState, useEffect } from "react";
import { collection, query, where, doc, updateDoc, getDocs, orderBy, writeBatch, getDoc, deleteDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Loader2, ShieldAlert, LogOut, Bot, RefreshCw, Trash2 } from "lucide-react";
import { Team, Round, Question, Answer, GROUPS } from "@/lib/types";

// Components
import { AdminLogin } from "@/components/admin/AdminLogin";
import { RoundControl } from "@/components/admin/RoundControl";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { EliminationPanel } from "@/components/admin/EliminationPanel";
import { GradingQueue } from "@/components/admin/GradingQueue";
import { LiveStandings } from "@/components/admin/LiveStandings";
import { AnswerHistory } from "@/components/admin/AnswerHistory";

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Answer[]>([]);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [selectedRound, setSelectedRound] = useState<string | null>(null);

    // Stats
    const activeTeamsCount = teams.filter(t => t.status === "active").length;
    const botCount = teams.filter(t => t.isBot).length;

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubAuth();
    }, []);

    // Polling-based data fetching (every 1 second)
    const fetchData = async () => {
        try {
            // Fetch teams
            const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("score", "desc")));
            setTeams(teamsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Team)));

            // Fetch rounds
            const roundsSnap = await getDocs(collection(db, "rounds"));
            const r = roundsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Round));
            r.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
            setRounds(r);

            // Fetch pending answers (essays needing grading)
            const pendingSnap = await getDocs(query(collection(db, "answers"), where("isCorrect", "==", null), where("type", "==", "essay")));
            setPendingAnswers(pendingSnap.docs.map(d => ({ ...d.data(), id: d.id } as Answer)));

            // Fetch ALL answers for history
            const allAnswersSnap = await getDocs(collection(db, "answers"));
            setAllAnswers(allAnswersSnap.docs.map(d => ({ ...d.data(), id: d.id } as Answer)));
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchData();

        // Fetch questions once (they don't change often)
        const fetchQuestions = async () => {
            const qSnap = await getDocs(query(collection(db, "questions"), orderBy("order")));
            setQuestions(qSnap.docs.map(d => ({ ...d.data(), id: d.id } as Question)));
        };
        fetchQuestions();

        // Poll every 3 seconds
        const pollInterval = setInterval(fetchData, 3000);

        return () => clearInterval(pollInterval);
    }, [user]);

    const handleLogout = () => {
        signOut(auth);
    };

    // --- ACTIONS ---

    const initGame = async () => {
        if (!confirm("Initialize Game? This will reset rounds, clear all answers, and reset team scores.")) return;
        try {
            const res = await fetch("/api/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "initGame", key: "admin123" }),
            });
            const data = await res.json();
            alert(data.message || "Game initialized!");
        } catch (e) {
            alert("Failed to initialize game");
        }
    };

    const seedQuestions = async () => {
        try {
            const res = await fetch("/api/seed?key=admin123&action=seed");
            const data = await res.json();
            alert(data.message || "Seeded!");
        } catch (e) {
            alert("Failed to seed");
        }
    };

    const fillBots = async () => {
        try {
            const res = await fetch("/api/seed?key=admin123&action=fillbots");
            const data = await res.json();
            alert(data.message || "Bots added!");
        } catch (e) {
            alert("Failed to add bots");
        }
    };

    const removeBots = async () => {
        if (!confirm("Remove ALL bots from the game?")) return;
        try {
            const res = await fetch("/api/seed?key=admin123&action=removebots");
            const data = await res.json();
            alert(data.message || "Bots removed!");
        } catch (e) {
            alert("Failed to remove bots");
        }
    };

    const kickPlayer = async (teamId: string, teamName: string) => {
        if (!confirm(`Force kick "${teamName}"? This will remove them from the game.`)) return;
        try {
            await deleteDoc(doc(db, "teams", teamId));
            alert(`${teamName} has been removed.`);
        } catch (e) {
            console.error("Failed to kick player:", e);
            alert("Failed to kick player.");
        }
    };

    const scheduleRound = async (roundId: string, startTime: number) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime: startTime,
            currentQuestionIndex: 0
        });
    };

    const activateRound = async (roundId: string) => {
        // Start immediately
        await updateDoc(doc(db, "rounds", roundId), {
            status: "active",
            startTime: Date.now(),
            currentQuestionIndex: 0
        });
    };

    const endRound = async (roundId: string) => {
        await updateDoc(doc(db, "rounds", roundId), {
            status: "completed",
            startTime: null
        });
    };

    const setQuestion = async (roundId: string, qId: string | null) => {
        // Legacy - not used in timer mode but kept for compatibility
        await updateDoc(doc(db, "rounds", roundId), { currentQuestionId: qId });
    };

    const gradeAnswer = async (answer: Answer, correct: boolean) => {
        const POINTS = 10;
        const batch = writeBatch(db);
        const ansRef = doc(db, "answers", answer.id);
        batch.update(ansRef, { isCorrect: correct, points: correct ? POINTS : 0 });

        if (correct) {
            const tRef = doc(db, "teams", answer.teamId);
            const tSnap = await getDoc(tRef);
            if (tSnap.exists()) {
                batch.update(tRef, { score: (tSnap.data().score || 0) + POINTS });
            }
        }
        await batch.commit();
    };

    const runElimination = async (roundNum: number) => {
        if (roundNum < 3) return alert("Elimination starts at Round 3.");
        if (!confirm(`Run Elimination for End of Round ${roundNum}?`)) return;

        const batch = writeBatch(db);

        for (const g of GROUPS) {
            const groupTeams = teams.filter(t => t.group === g && t.status === "active").sort((a, b) => a.score - b.score);

            if (groupTeams.length > 0) {
                const lowest = groupTeams[0];
                batch.update(doc(db, "teams", lowest.id), { status: "eliminated" });
                console.log(`Eliminating: ${lowest.name} (Group ${g})`);
            }
        }

        await batch.commit();
        alert("Elimination complete.");
    };

    if (loadingAuth) {
        return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;
    }

    if (!user) {
        return <AdminLogin />;
    }

    return (
        <div className="min-h-screen bg-gray-100 text-slate-900 p-8 grid grid-cols-12 gap-8 font-sans">
            <div className="col-span-12 flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert /> Admin Dashboard</h1>
                <div className="flex gap-4 items-center flex-wrap">
                    <span className="text-sm text-gray-500">{user.email}</span>
                    <button onClick={initGame} className="bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700 text-sm">Init Game</button>
                    <button onClick={seedQuestions} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" /> Seed Questions
                    </button>
                    <button onClick={fillBots} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm flex items-center gap-1">
                        <Bot className="w-4 h-4" /> Fill Bots ({30 - teams.length})
                    </button>
                    {botCount > 0 && (
                        <button onClick={removeBots} className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 text-sm flex items-center gap-1">
                            <Bot className="w-4 h-4" /> Remove Bots ({botCount})
                        </button>
                    )}
                    <button onClick={handleLogout} className="bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded shadow hover:bg-red-100 flex items-center gap-2 text-sm"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="col-span-12 grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-blue-600">{teams.length}</div>
                    <div className="text-xs text-gray-500 uppercase">Total Teams</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-green-600">{activeTeamsCount}</div>
                    <div className="text-xs text-gray-500 uppercase">Active</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-purple-600">{botCount}</div>
                    <div className="text-xs text-gray-500 uppercase">Bots</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-cyan-600">{questions.length}</div>
                    <div className="text-xs text-gray-500 uppercase">Questions</div>
                </div>
            </div>

            {/* LEFT: Game Controls */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
                <RoundControl
                    rounds={rounds}
                    onSchedule={scheduleRound}
                    onActivate={activateRound}
                    onEnd={endRound}
                    onSelect={setSelectedRound}
                    selectedRoundId={selectedRound}
                />

                {selectedRound && (
                    <QuestionManager
                        selectedRoundId={selectedRound}
                        questions={questions}
                        onSetQuestion={setQuestion}
                    />
                )}

                <EliminationPanel onRunElimination={runElimination} />
            </div>

            {/* RIGHT: Stats & Grading */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                <GradingQueue
                    pendingAnswers={pendingAnswers}
                    teams={teams}
                    onGrade={gradeAnswer}
                />

                <LiveStandings
                    teams={teams}
                    activeTeamsCount={activeTeamsCount}
                    onKickPlayer={kickPlayer}
                />

                <AnswerHistory
                    answers={allAnswers}
                    teams={teams}
                    questions={questions}
                />
            </div>
        </div>
    );
}
