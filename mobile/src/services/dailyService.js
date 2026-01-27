import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const getDailyLogRef = (userId, date) => doc(db, `users/${userId}/daily_logs/${date}`);

export const getDailyLog = async (userId, date) => {
    const snap = await getDoc(getDailyLogRef(userId, date));
    return snap.exists() ? snap.data() : null;
};

export const createOrUpdateDailyLog = async (userId, date, data) => {
    const ref = getDailyLogRef(userId, date);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const updatedData = {
            ...data,
            updatedAt: Timestamp.fromDate(new Date())
        };
        await updateDoc(ref, updatedData);
    } else {
        const newLog = {
            id: date,
            userId,
            date,
            isArchived: false,
            ...data
        };
        await setDoc(ref, newLog);
    }
};

export const getRecentLogs = async (userId, limitCount = 7) => {
    const colRef = collection(db, `users/${userId}/daily_logs`);
    const q = query(colRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
        .map(doc => doc.data())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limitCount);
};

export const getLocalTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};
