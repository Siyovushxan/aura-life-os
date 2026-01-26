import { db } from '@/firebaseConfig';
import { collection, doc, addDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export interface FocusSession {
    id: string;
    taskId?: string;
    taskName?: string;
    duration: number; // minutes
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    distractions: number;
    startedAt: Date;
    endedAt?: Date;
}

const getSubCollection = (userId: string) => collection(db, `users/${userId}/focus_sessions`);

export const startFocusSession = async (
    userId: string,
    duration: number,
    taskId?: string,
    taskName?: string
): Promise<string> => {
    const session: any = {
        duration,
        status: 'running',
        distractions: 0,
        startedAt: new Date()
    };

    if (taskId) session.taskId = taskId;
    if (taskName) session.taskName = taskName;

    const docRef = await addDoc(getSubCollection(userId), {
        ...session,
        startedAt: Timestamp.fromDate(session.startedAt)
    });

    return docRef.id;
};

export const endFocusSession = async (
    userId: string,
    sessionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    distractions: number = 0
): Promise<void> => {
    const docRef = doc(db, `users/${userId}/focus_sessions/${sessionId}`);
    await updateDoc(docRef, {
        status,
        distractions,
        endedAt: Timestamp.fromDate(new Date())
    });
};

export const incrementDistraction = async (userId: string, sessionId: string, currentCount: number): Promise<void> => {
    const docRef = doc(db, `users/${userId}/focus_sessions/${sessionId}`);
    await updateDoc(docRef, {
        distractions: currentCount + 1
    });
};

export const getFocusHistory = async (userId: string, limit: number = 10): Promise<FocusSession[]> => {
    try {
        const q = query(
            getSubCollection(userId),
            orderBy('startedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data(),
            ...doc.data(),
            startedAt: doc.data().startedAt?.toDate ? doc.data().startedAt.toDate() : new Date(doc.data().startedAt),
            endedAt: doc.data().endedAt?.toDate ? doc.data().endedAt.toDate() : (doc.data().endedAt ? new Date(doc.data().endedAt) : undefined)
        })) as FocusSession[];
    } catch (error) {
        console.error("Error getting focus history:", error);
        return [];
    }
};

export const getTodayFocusStats = async (userId: string): Promise<{ totalMinutes: number; sessions: number; completed: number }> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            getSubCollection(userId),
            where('startedAt', '>=', Timestamp.fromDate(today))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map(doc => doc.data());

        const completed = sessions.filter(s => s.status === 'completed');
        const totalMinutes = completed.reduce((sum, s) => sum + (s.duration || 0), 0);

        return {
            totalMinutes,
            sessions: sessions.length,
            completed: completed.length
        };
    } catch (error) {
        console.error("Error getting today focus stats:", error);
        return { totalMinutes: 0, sessions: 0, completed: 0 };
    }
};
