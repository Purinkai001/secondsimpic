"use client";

import { motion } from "framer-motion";
import TlCorner from "@/vectors/TlCorner";
import BgSVG from "@/vectors/bgsvg";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LineThai from "@/vectors/LineThai";
import { TeamHeader } from "../TeamHeader";
import { useGameRoom } from "@/lib/game/hooks/useGameRoom";

export default function EliminationPage() {
	const { handleLogout } = useGameRoom();

	return (
		<div className="flex min-w-screen min-h-screen items-center justify-center">
			<div>
				<BgSVG className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover" />
			</div>
			<div className="w-[90vw]">
				<div className="relative w-full bg-myBackground border-3 border-[#d4af37] rounded-[2rem] flex flex-col items-center justify-center shadow-2xl overflow-hidden min-h-[450px]">
					<motion.div
						initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 2, delay: 1,ease: "easeInOut" }}
						className="flex space-x-4 pt-16"
					>
						<div className="flex items-center justify-center">
							<img
								src="./image/siriraj emblem.png"
								alt="Mahidol Emblem"
								className="flex w-48 h-48 object-contain"
							/>
						</div>
						<div className="flex items-center justify-center">
							<img
								src="./image/simpic anniv.png"
								alt="Mahidol Emblem"
								className="flex w-48 h-48 object-contain"
							/>
						</div>
						<div className="flex items-center justify-center">
							<img
								src="./image/simpic logo.png"
								alt="Mahidol Emblem"
								className="flex w-48 h-48 object-contain"
							/>
						</div>
						<div className="flex items-center justify-center">
							<img
								src="./image/mahidol emblem.png"
								alt="Mahidol Emblem"
								className="flex w-48 h-48 object-contain"
							/>
						</div>
					</motion.div>

                    {/* Top Right */}
					<motion.div 
                        initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                        className="absolute top-2 right-2 flex">
						<TlCorner className="w-32 h-32 lg:w-72 lg:h-72 rotate-90" />
					</motion.div>

                    {/* Bottom Left */}
					<motion.div 
                        initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 2, delay: 5, ease: "easeInOut" }}
                        className="absolute bottom-2 left-2 flex">
						<TlCorner className="w-32 h-32 lg:w-72 lg:h-72 rotate-270" />
					</motion.div>


					{/* Main Text Content */}
					<motion.div
						initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 6, delay: 2, ease: "easeOut" }}
						className="flex flex-col items-center text-center z-10 mt-12"
					>
						<h1 className="text-[200px] font-atsanee font-semibold leading-[0.8] bg-shiny bg-clip-text text-transparent drop-shadow-lg">
							ELIMINATED
						</h1>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 1 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 6, delay: 2, ease: "easeOut" }}
						className="absolute inset-0 top-30 z-10 flex items-center justify-center pointer-events-none"
					>
						<LineThai className="w-[50%] h-auto" />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 0 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 2, delay: 5, ease: "easeInOut" }}
						className="flex flex-col items-center gap-4 z-10 mt-24 mb-12"
					>
						<div className="text-center">
							<p className="bg-shiny bg-clip-text text-transparent font-atsanee font-bold text-7xl">
								We sincerely appreciate <br /> your participation.
							</p>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 4, delay: 7.5, ease: "easeInOut" }}
						className="text-right w-full mb-6 mr-12"
					>
						<h1 className="font-atsanee font-bold text-gold text-6xl">
							SIMPIC 2026 ACADEMIC TEAM
						</h1>
						<p className="font-atsanee font-bold text-gold text-3xl">
							Faculty of Medicine Siriraj Hospital, Mahidol University <br />{" "}
							Bangkok, Thailand
						</p>
					</motion.div>
				</div>
				<TeamHeader team={null} onLogout={handleLogout} onRename={() => {}} />
			</div>
		</div>
	);
}
