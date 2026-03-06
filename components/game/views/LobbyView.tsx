import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LobbyViewProps {
    allTeams: Team[];
    team: Team | null;
}

export const LobbyView = ({ allTeams, team }: LobbyViewProps) => {
    const [isRearranging, setIsRearranging] = useState(false);
    
    // Group and sort teams by division automatically from the live data
    const divisions = useMemo(() => {
        return [1, 2, 3, 4, 5].map(divNum => {
            const teams = allTeams
                .filter(t => t.group === divNum)
                .sort((a, b) => (b.score || 0) - (a.score || 0));
            return { divNum, teams };
        });
    }, [allTeams]);

    // Firebase Listener to trigger the Blur Overlay
    const isInitialMount = useRef(true);
    const lastTriggerRef = useRef(0);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "config", "gameConfig"), (docSnap) => {
            const data = docSnap.data();
            const newTrigger = data?.lastShuffleTrigger;

            if (newTrigger && newTrigger !== lastTriggerRef.current) {
                lastTriggerRef.current = newTrigger;

                if (!isInitialMount.current) {
                    // Show the overlay
                    setIsRearranging(true);
                    
                    // Hide the overlay after 3 seconds (giving the main scoreboard time to save to DB)
                    setTimeout(() => {
                        setIsRearranging(false);
                    }, 3000); 
                }
            }
            
            isInitialMount.current = false;
        });

        return () => unsub();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full px-8 pt-20"
        >
            <div className="relative bg-shiny p-[3px] rounded-[30px] shadow-2xl">
                <div className="relative w-full h-full bg-myBackground rounded-[30px] p-6 overflow-hidden flex flex-col min-h-[500px]">
                    
                    {/* THE REARRANGING OVERLAY */}
                    <AnimatePresence>
                        {isRearranging && (
                            <motion.div
                                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#001439]/60"
                            >
                                <Loader2 className="w-16 h-16 text-gold animate-spin mb-6 drop-shadow-lg" />
                                <h2 className="font-atsanee font-black text-5xl text-white tracking-[0.1em] uppercase drop-shadow-2xl">
                                    Rearranging Teams...
                                </h2>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="text-center w-full pt-6">
                        <h1 className="text-[clamp(50px,15vw,210px)] font-atsanee font-black leading-[0.8] bg-shiny bg-clip-text text-transparent uppercase tracking-wider">
                            Leaderboard
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 z-10 mt-8">
                        {divisions.map(({ divNum, teams }) => (
                            <div key={divNum} className="space-y-4">
                                <div className="py-6 px-4 bg-gold text-center shadow-lg sticky top-0 z-20 rounded-t-xl">
                                    <span className="font-atsanee text-5xl font-black uppercase tracking-wide text-[#001439]">
                                        Division {divNum}
                                    </span>
                                </div>

                                <div className="space-y-3 relative">
                                    <AnimatePresence mode="popLayout">
                                        {Array.from({ length: 6 }).map((_, idx) => {
                                            const t = teams[idx];
                                            
                                            // Handle Empty States
                                            if (!t) {
                                                return (
                                                    <motion.div
                                                        key={`empty-${divNum}-${idx}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="flex items-center justify-center w-full h-[68px] opacity-10 bg-[#001439] rounded-[16px]"
                                                    >
                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                    </motion.div>
                                                );
                                            }

                                            const isTopTeam = idx === 0;
                                            const isSecondTeam = idx === 1;
                                            const isThirdTeam = idx === 2;
                                            const isFourthTeam = idx === 3;
                                            const isFifthTeam = idx === 4;
                                            const isSixthTeam = idx === 5;
                                            const isYou = t.id === team?.id;
                                            const isSuddenDeath = t.inSuddenDeath;
                                            
                                            let borderStyle = "bg-[#00A3CC]/30 p-[4px]";
                                            if (isSuddenDeath) borderStyle = "bg-red-500 animate-pulse";
                                            else if (isYou) borderStyle = "bg-[image:var(--simpic)] p-[4px]";
                                            else if (isTopTeam) borderStyle = "bg-[rgb(18,214,195)] shadow-[0_0_15px_rgba(18,214,195,0.4)]";        
                                            else if (isSecondTeam) borderStyle = "bg-[rgb(47,128,255)] shadow-[0_0_15px_rgba(47,128,255,0.4)]"; 
                                            else if (isThirdTeam) borderStyle = "bg-[rgb(110,111,247)] shadow-[0_0_15px_rgba(110,111,247,0.4)]";  
                                            else if (isFourthTeam) borderStyle = "bg-[rgb(255,109,174)] shadow-[0_0_15px_rgba(255,109,174,0.4)]"; 
                                            else if (isFifthTeam) borderStyle = "bg-[rgb(255,77,109)] shadow-[0_0_15px_rgba(255,77,109,0.4)]";  
                                            else if (isSixthTeam) borderStyle = "bg-[rgb(255,122,69)] shadow-[0_0_15px_rgba(255,122,69,0.4)]";  
                                            
                                            return (
                                                <motion.div
                                                    key={t.id}
                                                    layout="position"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3 }}
                                                    className={cn(
                                                        "w-full relative p-[3px] rounded-[16px] transition-colors duration-500",
                                                        borderStyle
                                                    )}
                                                >
                                                    <div className="relative flex items-center justify-between px-5 py-4 rounded-[14px] bg-[#001439] h-full w-full overflow-hidden">
                                                        <span className="font-atsanee font-bold text-white text-lg md:text-xl uppercase tracking-wider truncate mr-4">
                                                            {t.name}
                                                        </span>
                                                        <span className="font-atsanee font-bold text-white text-xl md:text-2xl shrink-0">
                                                            {t.score}
                                                        </span>

                                                        {t.status === 'eliminated' && (
                                                            <div className="absolute inset-0 bg-[#001439]/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-[14px]">
                                                                <span className="font-atsanee text-2xl font-black text-red-500 uppercase tracking-[0.2em] italic">Eliminated</span>
                                                            </div>
                                                        )}

                                                        {isSuddenDeath && t.status !== 'eliminated' && (
                                                            <div className="absolute top-0 left-0 px-3 py-1 bg-red-600 rounded-br-[14px]">
                                                                <span className="font-atsanee text-[12px] font-black text-white uppercase tracking-widest leading-none block pt-1">TIE</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};