"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowRight, Stethoscope, Sparkles, Zap, Trophy, Users, Brain, Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-400/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated DNA helix background
const DNAHelix = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <svg viewBox="0 0 200 800" className="absolute left-10 top-0 h-full w-32">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={100 + Math.sin(i * 0.5) * 40}
              cy={i * 40}
              r="6"
              fill="url(#gradient1)"
              animate={{
                cx: [100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
            />
            <motion.circle
              cx={100 + Math.sin(i * 0.5 + Math.PI) * 40}
              cy={i * 40}
              r="6"
              fill="url(#gradient2)"
              animate={{
                cx: [100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
            />
            <motion.line
              x1={100 + Math.sin(i * 0.5) * 40}
              y1={i * 40}
              x2={100 + Math.sin(i * 0.5 + Math.PI) * 40}
              y2={i * 40}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              animate={{
                x1: [100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40],
                x2: [100 + Math.sin(i * 0.5 + Math.PI) * 40, 100 + Math.sin(i * 0.5) * 40, 100 + Math.sin(i * 0.5 + Math.PI) * 40],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.1 }}
            />
          </motion.g>
        ))}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Animated logo component
const AnimatedLogo = () => {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-50 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Rotating border */}
      <motion.div
        className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner circle with icon */}
      <div className="relative p-5 bg-slate-900 rounded-full shadow-2xl">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Stethoscope className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      {/* Sparkle effects */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [0, Math.cos(angle * Math.PI / 180) * 50, 0],
            y: [0, Math.sin(angle * Math.PI / 180) * 50, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  );
};

// Feature cards for intro
const FeatureCard = ({ icon: Icon, title, delay }: { icon: any; title: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 text-white/60 text-sm"
  >
    <div className="p-1.5 bg-white/10 rounded-lg">
      <Icon className="w-4 h-4" />
    </div>
    <span>{title}</span>
  </motion.div>
);

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
        challengesRemaining: 2,
        streak: 0,
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
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      {/* Animated gradient background */}
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

      {/* Background effects */}
      <FloatingParticles />
      <DNAHelix />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <AnimatePresence mode="wait">
        {showIntro ? (
          // Intro splash screen
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center z-10"
          >
            <AnimatedLogo />

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent tracking-tight"
            >
              SIMPIC
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-4 text-xl text-blue-300/80"
            >
              The Ultimate Medical Challenge
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-8 flex gap-6"
            >
              <FeatureCard icon={Brain} title="5 Rounds" delay={1.4} />
              <FeatureCard icon={Users} title="30 Teams" delay={1.6} />
              <FeatureCard icon={Trophy} title="1 Winner" delay={1.8} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="mt-12 flex items-center gap-2 text-white/40 text-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading arena...
            </motion.div>
          </motion.div>
        ) : (
          // Login form
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full relative z-10"
          >
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl" />

            <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
              {/* Logo and title */}
              <div className="flex flex-col items-center mb-8">
                <motion.div
                  className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-4"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Stethoscope className="w-8 h-8 text-white" />
                </motion.div>

                <motion.h1
                  className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  SIMPIC
                </motion.h1>
                <motion.p
                  className="text-blue-300/60 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Enter the competition
                </motion.p>
              </div>

              <form onSubmit={handleJoin} className="space-y-6">
                {/* Team name input */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="text-xs uppercase tracking-wider text-blue-300/80 font-semibold ml-1 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Team Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name..."
                      className="relative w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 placeholder-white/20 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-lg"
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                {/* Group assignment display */}
                <motion.div
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    <span className="text-xs uppercase tracking-wider font-semibold">Group Assignment</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {assignedGroup ? (
                      <motion.div
                        key="assigned"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <div className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          Group {assignedGroup}
                        </div>
                        <div className="text-green-400/60 text-xs mt-1">Welcome to the arena!</div>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="waiting"
                        className="text-white/40 text-sm text-center"
                      >
                        Your division will be randomly assigned
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm text-center backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.button
                  disabled={loading}
                  type="submit"
                  className="relative w-full overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Button glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />

                  <div className="relative flex items-center justify-center gap-3 py-4 text-white font-bold text-lg">
                    {loading ? (
                      assignedGroup ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Entering Arena...
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Assigning Group...
                        </>
                      )
                    ) : (
                      <>
                        Join Competition
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.button>
              </form>

              {/* Features list */}
              <motion.div
                className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { icon: Zap, label: "Real-time" },
                  { icon: Brain, label: "4 Types" },
                  { icon: Trophy, label: "Rankings" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 text-white/30 text-xs">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        className="absolute bottom-6 text-white/20 text-xs flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Heart className="w-3 h-3 text-red-400/50" />
        © 2025 MedSimpic. All rights reserved.
      </motion.div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
    </div>
  );
}
