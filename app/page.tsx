"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Loader2, ArrowRight, Stethoscope, Sparkles, Trophy, Users, Brain, Heart } from "lucide-react";

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
    const storedTeamId = localStorage.getItem("medical_quiz_team_id");
    if (storedTeamId) router.push("/game");
  }, [router]);

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
      if (!auth.currentUser) await signInAnonymously(auth);

      const teamsRef = collection(db, "teams");
      const nameQuery = query(teamsRef, where("name", "==", teamName.trim()));
      const nameSnapshot = await getDocs(nameQuery);

      if (!nameSnapshot.empty) {
        const existingTeam = nameSnapshot.docs[0];
        const teamData = existingTeam.data();

        if (teamData.status === "eliminated") {
          setError("This team has been eliminated.");
          setLoading(false);
          return;
        }

        localStorage.setItem("medical_quiz_team_id", existingTeam.id);
        localStorage.setItem("medical_quiz_team_name", teamData.name);
        localStorage.setItem("medical_quiz_team_group", teamData.group.toString());
        router.push("/game");
        return;
      }

      const allTeamsSnapshot = await getDocs(teamsRef);
      if (allTeamsSnapshot.size >= 30) {
        setError("All rooms are full.");
        setLoading(false);
        return;
      }

      const groupCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allTeamsSnapshot.docs.forEach(doc => {
        const team = doc.data();
        if (team.group >= 1 && team.group <= 5) groupCounts[team.group]++;
      });

      const availableGroups = Object.entries(groupCounts)
        .filter(([, count]) => count < 6)
        .map(([group]) => parseInt(group));

      const randomGroup = availableGroups.length > 0
        ? availableGroups[Math.floor(Math.random() * availableGroups.length)]
        : parseInt(Object.entries(groupCounts).sort((a, b) => a[1] - b[1])[0][0]);
      setAssignedGroup(randomGroup);

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
    } catch (err) {
      console.error("Join error:", err);
      setError("Connection failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-8 sm:p-6 md:p-8 text-foreground overflow-x-auto relative transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 via-accent-cyan/10 to-background dark:from-accent-blue/40 dark:via-accent-cyan/20 dark:to-background" />
        <motion.div
          className="absolute inset-0 opacity-20 dark:opacity-40"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.4) 0%, transparent 60%)",
            x: parallaxX,
            y: parallaxY,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)"
          }}
        />
      </div>

      {/* Decorative Elements - Hidden on small screens for performance */}
      <div className="hidden sm:block">
        <FloatingParticles />
        <DNAHelix />
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center z-10 px-4"
          >
            <AnimatedLogo />
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-7xl font-black bg-gradient-to-r from-foreground via-accent-blue to-accent-cyan bg-clip-text text-transparent tracking-tight uppercase italic"
            >
              SIMPIC
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-3 sm:mt-4 text-base sm:text-xl text-muted text-center"
            >
              The Ultimate Medical Challenge
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-6"
            >
              <FeatureCard icon={Brain} title="5 Rounds" delay={1.4} />
              <FeatureCard icon={Users} title="30 Teams" delay={1.6} />
              <FeatureCard icon={Trophy} title="5 Winner" delay={1.8} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-[420px] relative z-10"
          >
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-[2rem] blur-2xl opacity-60" />

            <div className="relative bg-surface-bg backdrop-blur-2xl border border-surface-border p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl">
              {/* Header */}
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <motion.div
                  className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 mb-3 sm:mb-4"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-foreground" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl lg:text-6xl tracking-wider font-black bg-gradient-to-r from-foreground to-accent-blue bg-clip-text text-transparent">
                  SIMPIC
                </h1>
                <p className="text-muted text-xs sm:text-sm mt-1">Enter the competition</p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4 sm:space-y-6">
                {/* Team Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider text-muted font-semibold ml-1 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Team Name
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name..."
                    className="w-full bg-black/5 dark:bg-black/40 border border-surface-border rounded-xl px-4 py-3 sm:py-4 placeholder-foreground/25 text-foreground focus:outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 transition-all font-medium text-base sm:text-lg"
                    disabled={loading}
                  />
                </div>

                {/* Group Assignment Box */}
                <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent-blue" />
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-accent-blue">Group Assignment</span>
                  </div>
                  <AnimatePresence mode="wait">
                    {assignedGroup ? (
                      <motion.div
                        key="assigned"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          Group {assignedGroup}
                        </div>
                      </motion.div>
                    ) : (
                      <p className="text-muted text-xs sm:text-sm text-center">Randomly assigned upon entry</p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-xs sm:text-sm text-center font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  disabled={loading}
                  type="submit"
                  className="relative w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 overflow-hidden group shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Join Competition
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-6 text-muted text-[10px] sm:text-xs flex items-center gap-2">
        <Heart className="w-3 h-3 text-red-400/50" />
        <span>© 2025 MedSimpic. All rights reserved.</span>
      </div>
    </div>
  );
}
