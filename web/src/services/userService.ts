import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

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
