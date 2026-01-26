import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface GamificationParams {
    xp: number;
    level: number;
    coins: number;
    streak: number;
    lastActive?: any; // Timestamp
    totalXP?: number;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    fullName?: string;
    photoURL?: string;
    language?: 'en' | 'uz' | 'ru';
    plan?: string;
    memberSince?: string;
    profession?: string;
    education?: string;
    bio?: string;
    gamification?: GamificationParams; // New Gamification Field
    settings?: {
        notifications?: {
            dailyBriefing: boolean;
            focusAlerts: boolean;
            familyUpdates: boolean;
        }
    };
    lastViewed?: {
        [key: string]: string; // ISO date string
    };
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, {
        uid,
        memberSince: new Date().toISOString(),
        plan: "Free",
        ...data
    }, { merge: true });
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, data, { merge: true });
};

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
    const docRef = doc(db, "users", uid);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};
