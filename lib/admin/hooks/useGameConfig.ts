"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { DEFAULT_QUESTION_TIMER } from "@/lib/types";

export interface GameConfig {
    questionTimer: number;
    allowRejoin: boolean;
    maxTeamsPerGroup: number;
}

const DEFAULT_CONFIG: GameConfig = {
    questionTimer: DEFAULT_QUESTION_TIMER,
    allowRejoin: true,
    maxTeamsPerGroup: 6,
};

export function useGameConfig() {
    const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configRef = doc(db, "config", "gameConfig");

        const unsubscribe = onSnapshot(configRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as GameConfig);
            } else {
                // Initialize with defaults if doesn't exist
                setDoc(configRef, DEFAULT_CONFIG);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateConfig = async (newConfig: Partial<GameConfig>) => {
        const configRef = doc(db, "config", "gameConfig");
        await setDoc(configRef, { ...config, ...newConfig }, { merge: true });
    };

    return { config, updateConfig, loading };
}
