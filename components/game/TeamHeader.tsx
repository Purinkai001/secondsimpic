import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, LogOut, Edit2 } from "lucide-react";
import { Team } from "@/lib/types";
import BrCorner from "@/vectors/BrCorner";
import TlCorner from "@/vectors/TlCorner";

interface TeamHeaderProps {
    team: Team | null;
    onLogout: () => void;
    onRename: () => void;
}

export const TeamHeader = ({ team, onLogout, onRename }: TeamHeaderProps) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleConfirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    return (
        <>
            <footer className="fixed bottom-0 w-full flex justify-center items-center py-6 md:py-8 z-10 pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-6 pointer-events-auto"
                >
                    <span className="font-atsanee font-black text-3xl text-gold drop-shadow-lg">
                        TEAM {team?.name || "undefined"}
                    </span>
                    <div className="w-[2px] h-12 bg-gradient-to-b from-gold via-white to-gold shrink-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>

                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        title="Logout"
                        className="group relative text-gold font-atsanee font-bold text-3xl leading-none transition-all hover:brightness-125 shrink-0 drop-shadow-lg"
                    >
                        log out
                        <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-gold group-hover:h-[4px] group-hover:-bottom-2 transition-all duration-300"></span>
                    </button>
                </motion.div>
            </footer>

            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    {/* Modal Box */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-myBackground border border-2 border-gold rounded-[40px] p-8 w-[60vw] h-[35vh] shadow-[0_0_30px_rgba(255,215,0,0.15)] flex flex-col justify-center items-center text-center gap-10"
                    >
                            <div className="absolute top-2 left-2">
                                <TlCorner className="w-32 h-32"/>
                            </div>
                            <div className="absolute top-2 right-2 rotate-270">
                                <BrCorner className="w-32 h-32" />
                            </div>
                        <div className="relative flex flex-col gap-2">
                            
                            <h2 className="font-atsanee font-bold text-7xl text-gold uppercase tracking-wide">
                                Log Out
                            </h2>
                            
                            <p className="text-white/70 text-2xl font-atsanee">
                                Are you sure you want to log out of the current session?
                            </p>
                        </div>
                        
                        <div className="flex w-full gap-6 px-8 mt-4">
                            <button 
                                onClick={handleConfirmLogout}
                                className="font-atsanee font-black text-2xl flex-1 py-4 rounded-2xl bg-red-500/20 text-red-500 border-2 border-red-500/50 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            >
                                CONFIRM
                            </button>
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="font-atsanee font-black text-2xl flex-1 py-4 rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 transition-all"
                            >
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                </div>
                )}
            </AnimatePresence>
        </>
    );
};
