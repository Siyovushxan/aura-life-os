import { db } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, deleteDoc, arrayUnion, onSnapshot, addDoc } from "firebase/firestore";

export interface Interest {
    id: string;
    name: string;
    category: string;
    type: 'positive' | 'negative';
    level: number; // 1-10
    progress: number; // 0-100% to next level
    totalHours: number;
    image: string;
    trackingMode?: 'frequency' | 'binary'; // default frequency
}

export interface AIRec {
    recommendation: string;
    reason: string;
    emoji: string;
    category?: string;
    type: 'growth' | 'correction';
    feedback?: 'like' | 'dislike';
    isAddedToTasks?: boolean;
    taskId?: string;
    isDone?: boolean;
}

export interface DailyRecs {
    morning: AIRec[];
    lunch: AIRec[];
    evening: AIRec[];
    habitAdvice?: string;
}

export interface InterestsData {
    stats: {
        totalActive: number;
        learningStreak: number;
    };
    hobbies: Interest[];
    dailyRecs?: {
        [date: string]: DailyRecs;
    };
}

const getDocRef = (userId: string) => doc(db, `users/${userId}/interests/data`);

export const getInterestsData = async (userId: string): Promise<InterestsData | null> => {
    const docRef = doc(db, `users/${userId}/interests/data`);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as InterestsData : null;
};

export const subscribeToInterestsData = (userId: string, callback: (data: InterestsData) => void) => {
    const docRef = doc(db, `users/${userId}/interests/data`);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) callback(snap.data() as InterestsData);
    });
};

export const addInterest = async (userId: string, interest: Interest) => {
    const ref = getDocRef(userId);
    // Add to hobbies array
    // Also, we might want to increment totalActive in stats, but usually stats are derived. 
    // For simplicity, we'll just push to array for now. 
    // In a real app we might fetch-modify-save or use transactions.
    await updateDoc(ref, {
        hobbies: arrayUnion(interest)
    });
};

export const updateInterestProgress = async (userId: string, interestId: string, hours: number) => {
    const ref = getDocRef(userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as InterestsData;
    const hobbies = data.hobbies.map(h => {
        if (h.id === interestId) {
            // Simplified level up logic: 10 hours = 1 level
            const newTotal = h.totalHours + hours;
            const newLevel = Math.floor(newTotal / 10) + 1;
            const newProgress = Math.min(100, ((newTotal % 10) / 10) * 100);

            return {
                ...h,
                totalHours: Number(newTotal.toFixed(1)),
                level: newLevel,
                progress: newProgress
            };
        }
        return h;
    });

    await updateDoc(ref, { hobbies });
};

export const seedInterestsData = async (userId: string): Promise<InterestsData> => {
    const data: InterestsData = {
        stats: {
            totalActive: 0,
            learningStreak: 0,
        },
        hobbies: []
    };

    await setDoc(getDocRef(userId), data);
    await setDoc(getDocRef(userId), data);
    return data;
};

export interface InterestLog {
    id: string;
    hobbyId: string;
    hobbyName: string;
    durationMinutes?: number;
    count?: number;
    date: string;
    notes?: string;
}

export const logInterestActivity = async (userId: string, log: Omit<InterestLog, 'id'>) => {
    // 1. Add log entry
    await addDoc(collection(db, `users/${userId}/interest_logs`), log);

    // 2. Update aggregate progress
    if (log.durationMinutes) {
        await updateInterestProgress(userId, log.hobbyId, log.durationMinutes / 60);
    }
};

export const getInterestLogsByDate = async (userId: string, date: string): Promise<InterestLog[]> => {
    const q = query(collection(db, `users/${userId}/interest_logs`), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterestLog));
};

export const saveDailyRecs = async (userId: string, date: string, window: keyof DailyRecs, recs: AIRec[]) => {
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        [`dailyRecs.${date}.${window}`]: recs
    });
};

export const saveAIRecFeedback = async (userId: string, date: string, window: keyof DailyRecs, recIndex: number, feedback: 'like' | 'dislike') => {
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        [`dailyRecs.${date}.${window}.${recIndex}.feedback`]: feedback
    });
};

export const markAIRecAsTask = async (userId: string, date: string, window: keyof DailyRecs, recIndex: number, taskId: string) => {
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        [`dailyRecs.${date}.${window}.${recIndex}.isAddedToTasks`]: true,
        [`dailyRecs.${date}.${window}.${recIndex}.taskId`]: taskId
    });
};

export const markAIRecDone = async (userId: string, date: string, window: keyof DailyRecs, recIndex: number) => {
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        [`dailyRecs.${date}.${window}.${recIndex}.isDone`]: true
    });
};

export const logHabitOccurrence = async (userId: string, habit: { id: string, name: string, trackingMode?: 'frequency' | 'binary' }, date: string) => {
    if (habit.trackingMode === 'binary') {
        const q = query(
            collection(db, `users/${userId}/interest_logs`),
            where("hobbyId", "==", habit.id),
            where("date", "==", date)
        );
        const existing = await getDocs(q);
        if (!existing.empty) return; // Already logged for today
    }

    // 1. Add log entry as a count increment
    await addDoc(collection(db, `users/${userId}/interest_logs`), {
        hobbyId: habit.id,
        hobbyName: habit.name,
        count: 1,
        date: date
    });
};

export const saveHabitAdvice = async (userId: string, date: string, advice: string) => {
    const ref = getDocRef(userId);
    await updateDoc(ref, {
        [`dailyRecs.${date}.habitAdvice`]: advice
    });
};
