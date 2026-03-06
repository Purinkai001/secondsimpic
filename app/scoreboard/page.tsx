"use client";

import { useStandingsSync } from "@/lib/admin/hooks/useStandingsSync";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase";
import BgSVG from "@/vectors/bgsvg";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type VisualTeam = any & {
	originalRank?: number;
	isWrapping?: boolean;
	renderKey?: string;
};

export default function ScoreboardPage() {
	const { allTeams } = useStandingsSync();

	const [phase, setPhase] = useState<"idle" | "phase1" | "phase2">("idle");
	const [localTeams, setLocalTeams] = useState<VisualTeam[]>([]);

	useEffect(() => {
		if (phase === "idle") {
			setLocalTeams((prevLocal) => {
				if (!prevLocal || prevLocal.length === 0) {
					return allTeams.map((t) => ({ ...t, renderKey: t.id }));
				}
				return allTeams.map((t) => {
					const existing = prevLocal.find((p) => p.id === t.id);
					return { ...t, renderKey: existing?.renderKey || t.id };
				});
			});
		}
	}, [allTeams, phase]);

	const divisions = useMemo(() => {
		return Array.from({ length: 5 }, (_, i) => {
			const divNum = i + 1;
			const teamsInDiv = localTeams.filter((t) => t.group === divNum);

			if (phase === "phase1") {
				teamsInDiv.sort(
					(a, b) => (a.originalRank || 0) - (b.originalRank || 0),
				);
			} else {
				teamsInDiv.sort((a, b) => (b.score || 0) - (a.score || 0));
			}

			return { divNum, teams: teamsInDiv };
		});
	}, [localTeams, phase]);

	const savePositionsToDatabase = async (finalTeamsArray: VisualTeam[]) => {
		try {
			const user = auth.currentUser;

			if (!user) {
				console.error("No user logged in");
				return;
			}

			const token = await user.getIdToken();

			const payload = finalTeamsArray.map((team) => ({
				id: team.id,
				group: team.group,
			}));

			const response = await fetch("/api/game", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					action: "updateTeamPositions",
					teams: payload,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				console.error(
					"Failed to save positions. Status:",
					response.status,
					"Details:",
					errorData,
				);
			} else {
				console.log("Positions successfully locked in the database!");
			}
		} catch (error) {
			console.error("Error saving positions:", error);
		}
	};

	const handleAdminShuffle = useCallback(async () => {
		if (phase !== "idle") return;

		const currentGroups: Record<number, VisualTeam[]> = {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
		};
		localTeams.forEach((t) => {
			const g = t.group || 1;
			currentGroups[g].push({ ...t });
		});

		const phase1Teams: VisualTeam[] = [];

		Object.keys(currentGroups).forEach((key) => {
			const divNum = Number(key);
			const sortedTeams = currentGroups[divNum].sort(
				(a, b) => (b.score || 0) - (a.score || 0),
			);

			sortedTeams.forEach((team, rankIndex) => {
				const shiftAmount = rankIndex;
				const newDiv = ((divNum - 1 + shiftAmount) % 5) + 1;

				const isWrapping =
					shiftAmount > 0 && divNum + shiftAmount > 7 && rankIndex != 5;

				phase1Teams.push({
					...team,
					group: newDiv,
					originalRank: rankIndex,
					isWrapping,
					renderKey: isWrapping ? `${team.id}-wrap-${Date.now()}` : team.id,
				});
			});
		});

		setLocalTeams(phase1Teams);
		setPhase("phase1");

		const finalTeams = phase1Teams.map((t) => ({
			...t,
			isWrapping: false,
		}));

		setTimeout(() => {
			setLocalTeams(finalTeams);
			setPhase("phase2");
			savePositionsToDatabase(finalTeams);

			setTimeout(() => {
				setPhase("idle");
			}, 1000);
		}, 1000);
	}, [phase, localTeams]);

	const isInitialMount = useRef(true);
	const lastTriggerRef = useRef(0);

	useEffect(() => {
		const unsub = onSnapshot(doc(db, "config", "gameConfig"), (docSnap) => {
			const data = docSnap.data();
			const newTrigger = data?.lastShuffleTrigger;

			if (newTrigger && newTrigger !== lastTriggerRef.current) {
				lastTriggerRef.current = newTrigger;

				if (!isInitialMount.current) {
					console.log(
						"FIREBASE SIGNAL RECEIVED - TRIGGERING SHUFFLE ANIMATION",
					);
					handleAdminShuffle();
				}
			}
			isInitialMount.current = false;
		});

		return () => unsub();
	}, [handleAdminShuffle]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="w-full px-8 md:pt-10 xl:pt-32"
		>
			<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
				<BgSVG className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover" />
			</div>
			<div className="relative bg-shiny p-[3px] rounded-[30px] shadow-2xl overflow-hidden">
				<div className="relative w-full h-full bg-myBackground rounded-[30px] p-6 flex flex-col">
					<div className="text-center w-full xl:pt-6 relative">
						<h1 className="text-[90px] lg:text-[140px] xl:text-[clamp(50px,15vw,210px)] font-atsanee font-black leading-[0.8] bg-shiny bg-clip-text text-transparent uppercase tracking-tight xl:tracking-wider">
							Leaderboard
						</h1>
					</div>
					<LayoutGroup id="scoreboard-shuffle">
						<div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-5 gap-8 z-10 mt-8">
							{divisions.map(({ divNum, teams }) => {
								// Count how many teams in this division have been eliminated
								const eliminatedCount = teams.filter(
									(t) => t?.status === "eliminated",
								).length;

								return (
									<div key={divNum} className="space-y-4">
										<div className="lg:py-2 xl:py-6 px-4 bg-gold text-center shadow-lg sticky top-0 z-20 rounded-t-xl">
											<span className="font-atsanee md:text-xl xl:text-5xl font-black uppercase tracking-wide text-[#001439]">
												Division {divNum}
											</span>
										</div>

										{/* CSS Grid enforces rigid rows so our overlay perfectly covers exactly the slots needed */}
										<div className="grid grid-cols-1 grid-rows-6 gap-3 relative">
											<AnimatePresence mode="popLayout">
												{Array.from({ length: 6 }).map((_, idx) => {
													const t = teams[idx];

													if (!t) {
														return (
															<motion.div
																key={`empty-${divNum}-${idx}`}
																initial={{ opacity: 1 }}
																animate={{ opacity: 1 }}
																exit={{ opacity: 0, scale: 0.95 }}
																transition={{ duration: 0.2 }}
																style={{ gridRow: idx + 1, gridColumn: 1 }} // Explicit grid placement
																className="flex items-center justify-center w-full h-[68px] opacity-10 bg-[#001439] rounded-[16px]"
															>
																<div className="w-2 h-2 bg-white rounded-full" />
															</motion.div>
														);
													}

													const animDuration = 2.5 - idx * 0.5;
													const isSuddenDeath = t.inSuddenDeath;

													let borderStyle = "bg-[#00A3CC]/30 p-[4px]";
													if (isSuddenDeath)
														borderStyle = "bg-red-500 animate-pulse";
													else if (idx === 0)
														borderStyle =
															"bg-[rgb(18,214,195)] shadow-[0_0_15px_rgba(18,214,195,0.4)]";
													else if (idx === 1)
														borderStyle =
															"bg-[rgb(47,128,255)] shadow-[0_0_15px_rgba(47,128,255,0.4)]";
													else if (idx === 2)
														borderStyle =
															"bg-[rgb(110,111,247)] shadow-[0_0_15px_rgba(110,111,247,0.4)]";
													else if (idx === 3)
														borderStyle =
															"bg-[rgb(255,109,174)] shadow-[0_0_15px_rgba(255,109,174,0.4)]";
													else if (idx === 4)
														borderStyle =
															"bg-[rgb(255,77,109)] shadow-[0_0_15px_rgba(255,77,109,0.4)]";
													else if (idx === 5)
														borderStyle =
															"bg-[rgb(255,122,69)] shadow-[0_0_15px_rgba(255,122,69,0.4)]";

													return (
														<motion.div
															layoutId={t.renderKey}
															key={t.renderKey}
															layout
															initial={
																t.isWrapping
																	? { x: -800, opacity: 1 }
																	: { opacity: 1 }
															}
															animate={{ x: 0, opacity: 1 }}
															exit={
																t.isWrapping
																	? { x: 800, opacity: 0 }
																	: {
																			opacity: 0,
																			transition: { duration: 0.2 },
																		}
															}
															transition={{
																layout: {
																	type: "spring",
																	stiffness: 45,
																	damping: 15,
																},
																x: {
																	duration: animDuration,
																	ease: "easeInOut",
																},
																opacity: { duration: animDuration * 0.8 },
															}}
															style={{ gridRow: idx + 1, gridColumn: 1 }} // Explicit grid placement
															className={cn(
																"w-full relative p-[3px] rounded-[16px] transition-colors duration-500",
																borderStyle,
															)}
														>
															<div className="relative flex items-center justify-between px-5 py-4 rounded-[14px] bg-[#001439] h-full w-full overflow-hidden">
																<span className="font-atsanee font-bold text-white md:text-sm xl:text-xl uppercase tracking-wider truncate mr-4">
																	{t.name}
																</span>
																<span className="font-atsanee font-bold text-white md:text-sm xl:text-xl shrink-0">
																	{t.score}
																</span>

																{/* TIE / Sudden Death badge */}
																{isSuddenDeath && t.status !== "eliminated" && (
																	<div className="absolute top-0 left-0 px-3 py-1 bg-red-600 rounded-br-[14px]">
																		<span className="font-atsanee text-[12px] font-black text-white uppercase tracking-widest leading-none block pt-1">
																			TIE
																		</span>
																	</div>
																)}
															</div>
														</motion.div>
													);
												})}
											</AnimatePresence>

											{/* GIANT ELIMINATION OVERLAY */}
											{eliminatedCount > 0 && (
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ duration: 1 }}
													style={{
														gridRow: `${7 - eliminatedCount} / 7`,
														gridColumn: 1,
													}}
													className="w-full h-full bg-[#001439]/80 backdrop-blur-md z-20 flex items-center justify-center rounded-[16px] border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] pointer-events-none overflow-hidden px-2"
												>
													<span className="font-atsanee text-xl lg:text-2xl xl:text-3xl font-black text-red-500 uppercase tracking-widest italic drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] text-center leading-tight w-full">
														ELIMINATED
													</span>
												</motion.div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</LayoutGroup>
				</div>
			</div>
		</motion.div>
	);
}
