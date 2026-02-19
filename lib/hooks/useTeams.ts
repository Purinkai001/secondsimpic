import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team } from "@/lib/types";

/**
 * Shared hook for syncing all teams from Firestore.
 * Replaces repeated inline onSnapshot calls across admin pages.
 */
export function useTeams(sortBy: "score" | "name" = "score") {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, "teams"),
            orderBy(sortBy, sortBy === "score" ? "desc" : "asc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
        });
        return () => unsub();
    }, [sortBy]);

    return teams;
}
