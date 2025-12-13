"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Users, ArrowRight, ShieldCheck, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignedGroup, setAssignedGroup] = useState<number | null>(null);

  useEffect(() => {
    // Check if team is already logged in
    const storedTeamId = localStorage.getItem("medical_quiz_team_id");
    if (storedTeamId) {
      router.push("/game");
    }
  }, [router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }
    setLoading(true);
    setError("");
    setAssignedGroup(null);

    try {
      const teamsRef = collection(db, "teams");

      // 1. Check if team name exists anywhere
      const nameQuery = query(teamsRef, where("name", "==", teamName.trim()));
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        setError(`Team name "${teamName}" is already taken.`);
        setLoading(false);
        return;
      }

      // 2. Find group with space (randomized selection from available groups)
      const groupCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      const allTeamsSnapshot = await getDocs(teamsRef);
      allTeamsSnapshot.docs.forEach(doc => {
        const team = doc.data();
        if (team.group >= 1 && team.group <= 5) {
          groupCounts[team.group]++;
        }
      });

      // Find groups with available space
      const availableGroups = Object.entries(groupCounts)
        .filter(([_, count]) => count < 6)
        .map(([group, _]) => parseInt(group));

      if (availableGroups.length === 0) {
        setError("All groups are full! Competition is at capacity.");
        setLoading(false);
        return;
      }

      // Randomly select from available groups
      const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
      setAssignedGroup(randomGroup);

      // 3. Create Team
      const docRef = await addDoc(teamsRef, {
        name: teamName.trim(),
        group: randomGroup,
        score: 0,
        status: "active",
        isBot: false,
        createdAt: new Date(),
      });

      localStorage.setItem("medical_quiz_team_id", docRef.id);
      localStorage.setItem("medical_quiz_team_name", teamName.trim());
      localStorage.setItem("medical_quiz_team_group", randomGroup.toString());

      // Short delay to show assigned group before redirecting
      setTimeout(() => {
        router.push("/game");
      }, 1500);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Failed to join. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-5 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 font-sans tracking-tight">MedQuiz Arena</h1>
        <p className="text-center text-blue-200 mb-8 text-sm">Join the ultimate medical challenge</p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-blue-300 font-semibold ml-1">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name..."
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 placeholder-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
              disabled={loading}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
              <Shuffle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Group Assignment</span>
            </div>
            {assignedGroup ? (
              <div className="text-2xl font-bold text-green-400">
                Assigned to Group {assignedGroup}!
              </div>
            ) : (
              <p className="text-white/50 text-sm">Your group will be randomly assigned</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              assignedGroup ? (
                <>Joining Group {assignedGroup}...</>
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )
            ) : (
              <>
                Join Competition <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      <div className="mt-8 text-white/20 text-xs">
        &copy; 2025 MedSimpic. All rights reserved.
      </div>
    </div>
  );
}
