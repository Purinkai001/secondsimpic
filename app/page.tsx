"use client";

import { useState, useEffect, useRef } from "react";
import {
	motion,
	AnimatePresence,
	useMotionValue,
	useTransform,
	useSpring,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { api } from "@/lib/api";
import { Loader2, ArrowRight, Stethoscope, Sparkles, Trophy, Users, Brain, Heart } from "lucide-react";
import { db, auth } from "@/lib/firebase";

import { FloatingParticles } from "@/components/landing/FloatingParticles";
import { DNAHelix } from "@/components/landing/DNAHelix";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { FeatureCard } from "@/components/landing/FeatureCard"

import BgSVG from "@/vectors/bgsvg";
import BrCorner from "@/vectors/BrCorner";
import TlCorner from "@/vectors/TlCorner";

export default function LoginPage() {
	const router = useRouter();
	const [teamName, setTeamName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [assignedGroup, setAssignedGroup] = useState<number | null>(null);
	const [showIntro, setShowIntro] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);

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

      const team = await api.joinTeam(teamName.trim());
      setAssignedGroup(team.group);

      localStorage.setItem("medical_quiz_team_id", team.teamId);
      localStorage.setItem("medical_quiz_team_name", team.name);
      localStorage.setItem("medical_quiz_team_group", team.group.toString());

      setTimeout(() => router.push("/game"), 1500);
    } catch (err) {
      console.error("Join error:", err);
      setError(err instanceof Error ? err.message : "Connection failed. Try again.");
      setLoading(false);
    }
  };

return (
	<div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
		<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <BgSVG className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover" />
      	</div>

      	<div className="relative h-[90vh] aspect-[16/9] bg-shiny p-[3px] rounded-[50px] shadow-2xl">
			<div className="relative w-full h-full bg-myBackground rounded-[50px] flex flex-col items-center justify-center p-8 overflow-hidden">
				<div className="absolute top-2 left-2">
					<TlCorner className="w-84 h-84"/>
				</div>
				<div className="absolute bottom-2 right-2">
					<BrCorner className="w-72 h-72" />
				</div>
				<div className="absolute top-12 right-12 flex items-center space-x-2">
					<div className="w-[5vw] flex items-center justify-center">
						<img src="./image/simpic anniv.png" alt="simpic anniversary logo" className="w-full h-full" />
					</div>
					<div className="w-[5vw] flex items-center justify-center">
						<img src="./image/simpic logo.png" alt="simpic logo" className="w-full h-full" />
					</div>
					<div className="w-[5vw] flex items-center justify-center">
						<img src="./image/siriraj emblem.png" alt="mahidol emblem" className="w-full h-full" />
					</div>
					<div className="w-[5vw] flex items-center justify-center">
						<img src="./image/mahidol emblem.png" alt="mahidol emblem" className="w-full h-full" />
					</div>
				</div>
				<div className="text-center mb-10 z-10">
					<h2 className="text-[40px] md:text-[50px] xl:text-[60px] font-atsanee font-bold italic leading-[1.2] bg-shiny bg-clip-text text-transparent">
						ROUND 3 SEMI-FINAL
					</h2>
					<h1 className="px-4 md:px-10 text-[140px] md:text-[160px] xl:text-[200px] font-atsanee font-bold italic leading-[0.8] bg-shiny bg-clip-text text-transparent">
						INFINITY <br /> ROUND
					</h1>
				</div>
				<div className="w-full max-w-5xl space-y-8 z-10">
					<form onSubmit={handleJoin} className="w-full max-w-5xl space-y-8 z-10">
						<div className="space-y-4">
							<div className="relative bg-shiny p-[5px] rounded-[32px]">
							<input
								ref={inputRef}
								type="text"
								value={teamName}
								onChange={(e) => setTeamName(e.target.value)}
								placeholder="LOGIN WITH YOUR TEAM'S NAME"
								className="w-full font-atsanee font-bold text-3xl sm:text-5xl bg-[#001439] rounded-[27px] py-6 sm:py-8 px-6 text-center text-gold-metallic placeholder-white/20 outline-none focus:ring-2 ring-gold-metallic/50 transition-all"
								disabled={loading}
							/>
							</div>
						</div>

						{error && (
							<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-red-900/40 border-2 border-red-500/50 text-red-400 px-6 py-4 rounded-[20px] text-xl sm:text-2xl text-center font-atsanee font-bold uppercase tracking-wider"
							>
							{error}
							</motion.div>
						)}
							<motion.button
								disabled={loading}
								type="submit"
								className="relative w-full py-6 sm:py-8 rounded-[40px] bg-shiny text-[#001439] font-atsanee font-black text-4xl sm:text-6xl uppercase shadow-[0_0_40px_rgba(184,162,95,0.4)] flex items-center justify-center gap-4 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
								whileHover={{ scale: loading ? 1 : 1.02 }}
								whileTap={{ scale: loading ? 1 : 0.98 }}
							>
								<div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
								<span className="relative z-10 flex items-center gap-4">
									{loading ? "LOGGING IN..." : "LOGIN"}
								</span>
							</motion.button>
					</form>
        		</div>
			</div>
		</div>
	</div>
	);
}
