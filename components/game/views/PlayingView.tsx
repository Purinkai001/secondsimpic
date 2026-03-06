import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/game/types/game";
import { useState } from "react";
import { X } from "lucide-react";

interface PlayingViewProps {
	question: Question | null;
	timeLeft: number | null;
	timeSpent: number;
	mcqAnswer: number | null;
	setMcqAnswer: (val: number) => void;
	mtfAnswers: (boolean | null)[];
	setMtfAnswers: (val: (boolean | null)[]) => void;
	textAnswer: string;
	setTextAnswer: (val: string) => void;
	submitted: boolean;
	submitting: boolean;
	onSubmit: () => void;
}

export const PlayingView = ({
	question,
	timeLeft,
	timeSpent,
	mcqAnswer,
	setMcqAnswer,
	mtfAnswers,
	setMtfAnswers,
	textAnswer,
	setTextAnswer,
	submitted,
	submitting,
	onSubmit,
}: PlayingViewProps) => {
	if (!question) return null;

	const difficultyKey = (
		question.difficulty || "easy"
	).toLowerCase() as keyof typeof DIFFICULTY_LABELS;
	const difficulty = DIFFICULTY_LABELS[difficultyKey] || DIFFICULTY_LABELS.easy;
	const [, , turnNum, questionNum] = question.id.split("-");

	const [isImageOpen, setIsImageOpen] = useState(false);
	return (
		<div className="w-[90vw] pt-6">
			<h1 className="font-atsanee text-8xl italic font-black bg-shiny bg-clip-text text-transparent uppercase tracking-widerfont-black text-center mb-6">
				TURN {turnNum} QUESTION {questionNum}
			</h1>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="w-full bg-shiny p-1 rounded-[40px] shadow-[0_0_30px_rgba(212,175,55,0.15)] relative flex flex-col gap-6"
			>
				<div className=" bg-myBackground p-6 rounded-[39px] space-y-4">
					{/* Header (Difficulty & Timer) */}
					<div className="flex justify-between items-center w-full border-b pb-4">
						<h3 className="font-atsanee bg-gold bg-clip-text text-transparent uppercase text-5xl font-bold tracking-wide">
							Difficulty: <span className="capitalize">{difficulty.label}</span>
						</h3>
						<div className="text-white text-3xl md:text-2xl font-bold">
							Time Left:{" "}
							<span className="text-3xl md:text-4xl font-black">
								{timeLeft}s
							</span>
						</div>
					</div>

					{/* Question Text / Media Container */}
					<div className="border-2 border-white/20 rounded-2xl p-6 bg-white/5 flex flex-col md:flex-row gap-6">
						<div className="flex-1 font-atsanee text-white text-4xl font-medium leading-[1.2] break-words">
							{question.text ||
								"Examine the clinical presentation and determine the most likely diagnosis."}
						</div>

						{/* SPOT Image Side */}
						{question.type === "spot" && question.imageUrl && (
							<div className="w-full md:w-1/2 flex flex-col items-center gap-2 shrink-0">
								<img
									src={question.imageUrl}
									alt="Case Illustration"
									className="w-full max-h-[250px] object-cover rounded-lg cursor-pointer hover:opacity-90 hover:shadow-[0_0_15px_rgba(0,163,204,0.4)] transition-all duration-300"
									onClick={() => setIsImageOpen(true)}
								/>
								<span className="font-atsanee text-white/70 text-sm italic font-medium">
									Click the image to expand it to full-screen display.
								</span>

								<AnimatePresence>
									{isImageOpen && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#001439]/90 backdrop-blur-md"
											onClick={() => setIsImageOpen(false)}
										>
											<motion.div
												initial={{ scale: 0.9, opacity: 0, y: 20 }}
												animate={{ scale: 1, opacity: 1, y: 0 }}
												exit={{ scale: 0.9, opacity: 0, y: 20 }}
												transition={{
													type: "spring",
													damping: 25,
													stiffness: 500,
												}}
												className="relative max-w-6xl w-full max-h-screen flex flex-col items-center justify-center"
												onClick={(e) => e.stopPropagation()}
											>
												<button
													onClick={() => setIsImageOpen(false)}
													className="absolute -top-4 -right-4 md:-top-6 md:-right-6 z-10 p-2 bg-[#001439] border-2 border-gold/80 text-gold rounded-full hover:bg-gold hover:text-[#001439] hover:shadow-[0_0_15px_rgba(0,163,204,0.6)] transition-all duration-300"
												>
													<X className="w-6 h-6 md:w-8 md:h-8" />
												</button>

												<div className="bg-shiny p-[3px] rounded-[24px] shadow-[0_0_30px_rgba(0,163,204,0.3)] w-full flex justify-center">
													<div className="bg-[#001439] rounded-[21px] overflow-hidden w-full flex items-center justify-center p-2">
														<img
															src={question.imageUrl}
															alt="Expanded Case Illustration"
															className="w-full h-auto max-h-[85vh] object-contain rounded-[16px]"
														/>
													</div>
												</div>
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</div>

					{/* Question Inputs */}
					<div className="w-full flex flex-col gap-4">
						{/* MCQ Layout */}
						{question.type === "mcq" && (
							<div className="flex flex-wrap justify-center gap-4">
								{question.choices?.map((choice, idx) => {
									const isSelected = mcqAnswer === idx;
									const letterLabel = String.fromCharCode(65 + idx);

									return (
										<button
											key={idx}
											disabled={submitted}
											onClick={() => setMcqAnswer(idx)}
											className={cn(
												"flex-1 min-w-[45%] max-w-[50%] py-4 px-6 rounded-2xl border-2 transition-all duration-300 font-bold text-3xl break-words shadow-md flex items-center text-left gap-6 group",
												isSelected
													? "bg-gradient-to-b from-[#EED382] to-[#B88A44] border-transparent text-[#001439]"
													: "bg-[#001439] border-[#D4AF37] text-white hover:bg-white/10",
											)}
										>
											<div
												className={cn(
													"w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300",
													isSelected
														? "bg-[#001439] border-[#001439] text-[#EED382] shadow-inner"
														: "border-white/20 text-white",
												)}
											>
												{letterLabel}
											</div>

											<span className="flex-1 leading-tight py-2">
												{choice.text}
											</span>
										</button>
									);
								})}
							</div>
						)}

						{/* MTF Layout */}
						{question.type === "mtf" && (
							<div className="flex flex-col gap-3 w-full">
								{question.statements?.map((s, idx) => (
									<div
										key={idx}
										className="flex flex-col md:flex-row md:items-center justify-between border-2 border-[#D4AF37]/50 rounded-xl p-4 bg-[#001439] gap-4"
									>
										<span className="text-gold text-2xl font-medium font-atsanee pr-4">
											{s.text}
										</span>
										<div className="flex gap-2 shrink-0">
											<button
												disabled={submitted}
												onClick={() => {
													const newAns = [...mtfAnswers];
													newAns[idx] = true;
													setMtfAnswers(newAns);
												}}
												className={cn(
													"px-6 py-2 rounded-lg font-black font-atsanee text-xl italic border-2 transition-all",
													mtfAnswers[idx] === true
														? "bg-gradient-to-b from-[#EED382] to-[#B88A44] border-transparent text-[#001439]"
														: "border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-white/5",
												)}
											>
												TRUE
											</button>
											<button
												disabled={submitted}
												onClick={() => {
													const newAns = [...mtfAnswers];
													newAns[idx] = false;
													setMtfAnswers(newAns);
												}}
												className={cn(
													"px-6 py-2 rounded-lg font-black font-atsanee text-xl italic border-2 transition-all",
													mtfAnswers[idx] === false
														? "bg-gradient-to-b from-[#EED382] to-[#B88A44] border-transparent text-[#001439]"
														: "border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-white/5",
												)}
											>
												FALSE
											</button>
										</div>
									</div>
								))}
							</div>
						)}

						{/* SAQ & SPOT Text Input Layout */}
						{(question.type === "saq" || question.type === "spot") && (
							<input
								disabled={submitted}
								type="text"
								value={textAnswer}
								onChange={(e) => setTextAnswer(e.target.value)}
								placeholder="TYPE YOUR ANSWER"
								className="w-full placeholder:font-atsanee font-atsanee bg-[#001439]/50 border-2 border-[#D4AF37] rounded-xl py-4 px-6 text-xl md:text-2xl font-bold text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
							/>
						)}
					</div>

					{/* Submit Button */}
					{!submitted && (
						<div className="pt-2 w-full z-20">
							<button
								disabled={submitting}
								onClick={onSubmit}
								className="w-full font-atsanee bg-[image:var(--someBlue)] hover:brightness-110 text-white font-black py-4 rounded-full text-4xl italic tracking-widest shadow-[0_0_20px_rgba(10,98,232,0.4)] flex items-center justify-center gap-4 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
							>
								{submitting ? (
									<>
										<Loader2 className="w-8 h-8 animate-spin" />
										SUBMITTING...
									</>
								) : (
									"SUBMIT"
								)}
							</button>
						</div>
					)}
				</div>
			</motion.div>
		</div>
	);
};
