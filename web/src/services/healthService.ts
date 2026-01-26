import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface HealthData {
    date: string; // YYYY-MM-DD
    bodyBattery: {
        current: number;
        status: string;
    };
    vitals: {
        heartRate: number;
        bloodOxygen: number;
        stress: number;
    };
    sleep: {
        duration: string; // e.g. "7h 42m"
        score: number;
        quality: string;
        stages: { name: string; percentage: number; color: string }[];
    };
    activity: {
        steps: number;
        goal: number;
        calories: number; // kcal
        distance: string; // km
    };
    hydration: {
        current: number; // ml
        goal: number; // ml
    };
    biometrics?: {
        weight: number;
        height: number;
        goal: 'lose' | 'gain' | 'maintain';
    };
}

export const getHealthData = async (userId: string, date: string): Promise<HealthData | null> => {
    const docRef = doc(db, `users/${userId}/health_logs/${date}`);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as HealthData) : null;
};

export const subscribeToHealthData = (userId: string, date: string, callback: (data: HealthData) => void) => {
    const docRef = doc(db, `users/${userId}/health_logs/${date}`);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) callback(snap.data() as HealthData);
    });
};

export const updateHealthData = async (userId: string, date: string, data: Partial<HealthData>) => {
    const docRef = doc(db, `users/${userId}/health_logs/${date}`);
    // Use setDoc with merge to ensure partial updates or creation
    await setDoc(docRef, { ...data, date }, { merge: true });
};

export const seedHealthData = async (userId: string, date: string): Promise<HealthData> => {
    const data: HealthData = {
        date,
        bodyBattery: {
            current: 0, // Start zero until data is synced
            status: 'Initializing',
        },
        vitals: {
            heartRate: 0,
            bloodOxygen: 0,
            stress: 0,
        },
        sleep: {
            duration: '0h 0m',
            score: 0,
            quality: 'No Data',
            stages: []
        },
        activity: {
            steps: 0,
            goal: 10000,
            calories: 0,
            distance: '0 km',
        },
        hydration: {
            current: 0,
            goal: 2500,
        },
        biometrics: {
            weight: 70,
            height: 175,
            goal: 'maintain'
        }
    };

    await updateHealthData(userId, date, data);
    return data;
};
