"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Loader2, ArrowRight, Stethoscope, Sparkles, Zap, Trophy, Users, Brain, Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import { FloatingParticles } from "@/components/landing/FloatingParticles";
import { DNAHelix } from "@/components/landing/DNAHelix";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { FeatureCard } from "@/components/landing/FeatureCard";

export default function LoginPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignedGroup, setAssignedGroup] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30 };
  const parallaxX = useSpring(useTransform(mouseX, [-500, 500], [-20, 20]), springConfig);
  const parallaxY = useSpring(useTransform(mouseY, [-500, 500], [-20, 20]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    // Check if team is already logged in
    const storedTeamId = localStorage.getItem("medical_quiz_team_id");
    if (storedTeamId) {
      router.push("/game");
    }
  }, [router]);

  // Auto-hide intro after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      setTimeout(() => inputRef.current?.focus(), 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
      // Ensure user is authenticated anonymously for Firestore rules
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const teamsRef = collection(db, "teams");

      // 1. Check if team name exists anywhere
      const nameQuery = query(teamsRef, where("name", "==", teamName.trim()));
      const nameSnapshot = await getDocs(nameQuery);

      if (!nameSnapshot.empty) {
        // REJOIN LOGIC: If team exists, just log them in
        const existingTeam = nameSnapshot.docs[0];
        const teamData = existingTeam.data();

        localStorage.setItem("medical_quiz_team_id", existingTeam.id);
        localStorage.setItem("medical_quiz_team_name", teamData.name);
        localStorage.setItem("medical_quiz_team_group", teamData.group.toString());

        router.push("/game");
        return;
      }

      // 2. Find group with space
      const groupCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const allTeamsSnapshot = await getDocs(teamsRef);
      allTeamsSnapshot.docs.forEach(doc => {
        const team = doc.data();
        if (team.group >= 1 && team.group <= 5) {
          groupCounts[team.group]++;
        }
      });

      const availableGroups = Object.entries(groupCounts)
        .filter(([_, count]) => count < 6)
        .map(([group, _]) => parseInt(group));

      if (availableGroups.length === 0) {
        setError("All rooms are full.");
        setLoading(false);
        return;
      }

      const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
      setAssignedGroup(randomGroup);

      // 3. Create Team
      const docRef = await addDoc(teamsRef, {
        name: teamName.trim(),
        group: randomGroup,
        score: 0,
        status: "active",
        isBot: false,
        challengesRemaining: 2,
        streak: 0,
        createdAt: new Date(),
      });

      localStorage.setItem("medical_quiz_team_id", docRef.id);
      localStorage.setItem("medical_quiz_team_name", teamName.trim());
      localStorage.setItem("medical_quiz_team_group", randomGroup.toString());

      setTimeout(() => router.push("/game"), 1500);
    } catch (err: any) {
      console.error("Join error details:", err);
      setError("Connection failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-900" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            x: parallaxX,
            y: parallaxY,
          }}
        />
      </div>

      <FloatingParticles />
      <DNAHelix />

      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundSize: "50px 50px", backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)" }} />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center z-10">
            <AnimatedLogo />
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-8 text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">SIMPIC</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }} className="mt-4 text-xl text-blue-300/80">The Ultimate Medical Challenge</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }} className="mt-8 flex gap-6">
              <FeatureCard icon={Brain} title="5 Rounds" delay={1.4} />
              <FeatureCard icon={Users} title="30 Teams" delay={1.6} />
              <FeatureCard icon={Trophy} title="1 Winner" delay={1.8} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-md w-full relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
              <div className="flex flex-col items-center mb-8">
                <motion.div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-4" whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }}><Stethoscope className="w-8 h-8 text-white" /></motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">SIMPIC</h1>
                <p className="text-blue-300/60 text-sm mt-1">Enter the competition</p>
              </div>

              <form onSubmit={handleJoin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-blue-300/80 font-semibold ml-1 flex items-center gap-2"><Users className="w-3 h-3" /> Team Name</label>
                  <input ref={inputRef} type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter your team name..." className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 placeholder-white/20 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-lg" disabled={loading} />
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
                  <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Group Assignment</span>
                  </div>
                  <AnimatePresence mode="wait">
                    {assignedGroup ? (
                      <motion.div key="assigned" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        <div className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Group {assignedGroup}</div>
                      </motion.div>
                    ) : (
                      <p className="text-white/40 text-sm text-center">Randomly assigned upon entry</p>
                    )}
                  </AnimatePresence>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm text-center">{error}</div>}

                <motion.button disabled={loading} type="submit" className="relative w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 overflow-hidden group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Competition <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 text-white/20 text-xs flex items-center gap-2"><Heart className="w-3 h-3 text-red-400/50" /> © 2025 MedSimpic. All rights reserved.</div>
    </div>
  );
}
