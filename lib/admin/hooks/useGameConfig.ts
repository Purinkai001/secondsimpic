"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { DEFAULT_QUESTION_TIMER } from "@/lib/types";
import { api } from "@/lib/api";

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
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateConfig = async (newConfig: Partial<GameConfig>) => {
        await api.updateGameConfig({ ...config, ...newConfig });
    };

    return { config, updateConfig, loading };
}
