import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
    getFinanceInsight,
    getHealthAudioInsight,
    getDeepInterestsRecommendation,
    getMindInsight,
    getDailyTaskInsight
} from "./groqService";

export interface AIInsight {
    id: string;
    moduleKey: string;
    title: string;
    insight: string;
    emoji: string;
    generatedAt: string; // ISO String
    scheduledHour: number;
    data?: any; // Store full JSON structure here
}

const MODULE_SCHEDULE: Record<string, number> = {
    health: 8,
    tasks: 9,
    focus: 18,
    interests: 19,
    mind: 20,
    finance: 21,
    food: 22
};

export const getScheduledInsight = async (
    userId: string,
    moduleKey: string,
    language: string = 'uz',
    userContext: any = {},
    options: { force?: boolean } = {}
): Promise<AIInsight | null> => {
    const scheduledHour = MODULE_SCHEDULE[moduleKey] || 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check Firestore for today's insight
    const docRef = doc(db, `users/${userId}/ai_insights/${moduleKey}_${todayStr}`);

    if (!options.force) {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as AIInsight;
        }
    }

    // 2. If no insight for today OR forced, generate
    const currentHour = now.getHours();

    if (options.force || currentHour >= scheduledHour) {
        // Time to generate!
        console.log(`[AI Persistence] Generating new insight for ${moduleKey} (Force: ${options.force})`);

        let rawResult: any;
        switch (moduleKey) {
            case 'finance': rawResult = await getFinanceInsight(language, userContext); break;
            case 'health': {
                rawResult = await getHealthAudioInsight(language, userContext);
                break;
            }
            case 'interests': {
                const hour = now.getHours();
                const window = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';
                const intRes = await getDeepInterestsRecommendation(language, window, userContext);
                rawResult = {
                    title: "Qiziqishlar",
                    insight: intRes.recommendations?.[0]?.recommendation || "Yangi mashg'ulotlar o'rganing.",
                    emoji: "🎨",
                    data: intRes // Store FULL result
                };
                break;
            }
            case 'mind': rawResult = await getMindInsight(language, userContext); break;
            case 'tasks': {
                const taskRes = await getDailyTaskInsight(language, userContext);
                rawResult = { title: taskRes.title, insight: taskRes.suggestion, emoji: "✅" };
                break;
            }
            default: return null;
        }

        const newInsight: AIInsight = {
            id: `${moduleKey}_${todayStr}`,
            moduleKey,
            title: rawResult.title || "Tavsiya",
            insight: rawResult.insight || rawResult.suggestion || rawResult.text || "",
            emoji: rawResult.emoji || "✨",
            generatedAt: now.toISOString(),
            scheduledHour,
            data: rawResult.data || rawResult // Ensure data is stored
        };

        await setDoc(docRef, newInsight);
        return newInsight;
    } else {
        // Too early for today. Look for yesterday's insight as fallback
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const prevDocRef = doc(db, `users/${userId}/ai_insights/${moduleKey}_${yesterdayStr}`);
        const prevSnap = await getDoc(prevDocRef);

        if (prevSnap.exists()) {
            return prevSnap.data() as AIInsight;
        }

        return null;
    }
};

export const dismissInsight = async (userId: string, moduleKey: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = doc(db, `users/${userId}/ai_insights/${moduleKey}_${todayStr}`);
    await setDoc(docRef, { isDismissed: true }, { merge: true });
};

export const subscribeToScheduledInsight = (
    userId: string,
    moduleKey: string,
    callback: (insight: AIInsight) => void
) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = doc(db, `users/${userId}/ai_insights/${moduleKey}_${todayStr}`);

    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as AIInsight);
        }
    });
};
