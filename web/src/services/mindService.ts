import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

export interface MoodEntry {
    date: string;
    mood: 'happy' | 'calm' | 'neutral' | 'stressed' | 'anxious';
    value: number; // 0-100 for graph
    note?: string;
}

export interface MindData {
    stats: {
        focusMinutes: number;
        meditationMinutes: number;
        journalStreak: number;
    };
    moodHistory: MoodEntry[];
    quote?: {
        text: string;
        author: string;
    };
}

const getDocRef = (userId: string) => doc(db, `users/${userId}/mind/overview`);

export const getMindData = async (userId: string): Promise<MindData | null> => {
    const docRef = getDocRef(userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as MindData : null;
};

export const subscribeToMindData = (userId: string, callback: (data: MindData) => void) => {
    const docRef = getDocRef(userId);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) callback(snap.data() as MindData);
    });
};

export const addMoodEntry = async (userId: string, entry: MoodEntry) => {
    // Add to history and potentially update stats or daily streak logic
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        moodHistory: arrayUnion(entry)
    });
};

export const updateMindStats = async (userId: string, stats: Partial<MindData['stats']>) => {
    const ref = getDocRef(userId);
    await setDoc(ref, { stats }, { merge: true });
};

export const seedMindData = async (userId: string): Promise<MindData> => {
    const data: MindData = {
        stats: {
            focusMinutes: 0,
            meditationMinutes: 0,
            journalStreak: 0,
        },
        moodHistory: [],
        quote: {
            text: "The journey of a thousand miles begins with a single step.",
            author: "Lao Tzu"
        }
    };

    await setDoc(getDocRef(userId), data);
    return data;
};
