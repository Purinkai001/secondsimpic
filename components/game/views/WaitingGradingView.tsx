import { motion } from "framer-motion";
import { SubmissionResult } from "@/lib/game/types/game";
import { Question } from "@/lib/types";
import { time } from "console";
import TlCorner from "@/vectors/TlCorner";
import LineThai from "@/vectors/LineThai";

interface WaitingGradingViewProps {
	result: SubmissionResult | null;
	timeLeft?: number | null;
	timeSpent?: number | null;
	question: Question | null;
}

export const WaitingGradingView = ({
	result,
	timeSpent,
	timeLeft,
	question,
}: WaitingGradingViewProps) => {

	const displayTime = timeSpent != null ? (timeSpent >= 90 ? "90.00" : timeSpent) : "N/A";

	return (
		<div className="w-[90vw]">
			<div className="relative w-full bg-myBackground border-2 border-[#d4af37] rounded-[2rem] p-10 md:p-16 flex flex-col items-center justify-center shadow-2xl overflow-hidden min-h-[450px]">
				<div className="absolute top-2 left-2 flex">
					<TlCorner className="w-32 h-32 md:w-64 md:h-64 lg:w-96 lg:h-96" />
				</div>

				<div className="absolute bottom-2 right-2 flex">
					<TlCorner className="w-16 h-16 md:w-48 md:h-48 lg:w-84 lg:h-84 rotate-180" />
				</div>

				{/* Main Text Content */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col items-center text-center z-10 mt-24"
				>
					<h1 className="text-[200px] font-atsanee font-semibold leading-[0.8] bg-shiny bg-clip-text text-transparent drop-shadow-lg">
						ANSWER <br /> SUBMITTED
					</h1>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2 }}
					className="absolute inset-0 top-36 z-10 flex items-center justify-center pointer-events-none"
				>
					<LineThai className="w-[80%] h-auto" />
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="flex flex-col items-center gap-4 z-10 mt-36"
				>
					<div className="text-center">
						<p className="bg-shiny bg-clip-text text-transparent font-atsanee font-bold text-7xl">
							Time used:
						</p>
						<p className="text-9xl font-atsanee font-bold italic bg-shiny bg-clip-text text-transparent">
							{displayTime} seconds
						</p>
					</div>

					{timeLeft != null && (
						<p className="text-gold font-bold text-3xl font-atsanee mt-2">
							Time Left: <span className="font-bold text-4xl">{timeLeft}s</span>
						</p>
					)}
				</motion.div>
			</div>
		</div>
	);
};
