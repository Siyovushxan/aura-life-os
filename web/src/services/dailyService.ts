import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getLocalTodayStr } from "@/lib/dateUtils";

export interface DailyLog {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    isArchived: boolean;
    mood?: {
        status: string;
        energy: number;
        note?: string;
    };
    healthSummary?: {
        steps: number;
        sleep: string;
        calories: number;
    };
    financeSummary?: {
        spent: number;
        currency: string;
    };
    aiInsight?: string;
    finance?: boolean;
    health?: boolean;
    food?: boolean;
}

const getDailyLogRef = (userId: string, date: string) => doc(db, `users/${userId}/daily_logs/${date}`);

export const getDailyLog = async (userId: string, date: string): Promise<DailyLog | null> => {
    const snap = await getDoc(getDailyLogRef(userId, date));
    return snap.exists() ? (snap.data() as DailyLog) : null;
};

export const createOrUpdateDailyLog = async (userId: string, date: string, data: Partial<DailyLog>) => {
    const ref = getDailyLogRef(userId, date);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const existingData = snap.data() as DailyLog;
        if (existingData.isArchived) {
            throw new Error("This log is archived and cannot be edited.");
        }
        // Preserve existing module flags if not provided
        const updatedData = {
            ...data,
            updatedAt: Timestamp.fromDate(new Date())
        };
        await updateDoc(ref, updatedData);
    } else {
        const newLog: DailyLog = {
            id: date,
            userId,
            date,
            isArchived: false,
            ...data
        };
        await setDoc(ref, newLog);
    }
};

export const archiveDailyLog = async (userId: string, date: string) => {
    const ref = getDailyLogRef(userId, date);
    await updateDoc(ref, {
        isArchived: true,
        archivedAt: Timestamp.fromDate(new Date())
    });
};

export const getRecentLogs = async (userId: string, limitCount: number = 7): Promise<DailyLog[]> => {
    const colRef = collection(db, `users/${userId}/daily_logs`);
    const q = query(colRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
        .map(doc => doc.data() as DailyLog)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limitCount);
};

export const checkAndArchivePreviousDays = async (userId: string) => {
    const today = getLocalTodayStr();
    const colRef = collection(db, `users/${userId}/daily_logs`);
    const q = query(colRef, where("isArchived", "==", false));
    const snap = await getDocs(q);

    const archivePromises = snap.docs
        .filter(doc => doc.id < today)
        .map(doc => updateDoc(doc.ref, {
            isArchived: true,
            archivedAt: Timestamp.fromDate(new Date())
        }));

    await Promise.all(archivePromises);
};
