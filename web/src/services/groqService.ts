// DYNAMIC BACKEND URL (Localhost vs Production)
const BACKEND_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001/aura-f1d36/us-central1'
    : 'https://us-central1-aura-f1d36.cloudfunctions.net';

// HELPER: Call AURA Backend Cloud Function
const callBackend = async (functionName: string, payload: any) => {
    try {
        const response = await fetch(`${BACKEND_URL}/${functionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Backend Error');
        return data;
    } catch (error) {
        // SILENT FALLBACK FOR DEVELOPMENT
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.warn(`[AURA AI Proxy] Backend offline (${functionName}). Using simulated response.`);

            // Mock responses based on function names to keep UI alive
            if (functionName === 'getFamilyInsight') return { success: true, insight: "Oila a'zolari bilan muloqotni kuchaytirish tavsiya etiladi. Azamat otaning faolligi barqaror.", emoji: "👨‍👩‍👧‍👦", success_mock: true };
            if (functionName === 'getFinanceInsight') return { success: true, insight: "Xarajatlar nazorat ostida. Jamg'arma rejasiga amal qiling.", emoji: "💰", success_mock: true };
            if (functionName === 'getTaskInsight') return { success: true, title: "Kunlik Reja", suggestion: "Bugun 3 ta asosiy vazifaga diqqat qarating.", priority: "high", success_mock: true };

            return { success: true, insight: "Simulated insight for local development.", success_mock: true };
        }

        console.error(`AURA Backend Error (${functionName}):`, error);
        return { success: false, error: "System temporarily offline." };
    }
};

// VERSION: AURA-PROD-STABLE-2026-01-21
console.log("%c AURA AI CORE: V2026.1 (SECURE BACKEND) ACTIVE ", "background: #000; color: #00F0FF; font-weight: bold; border-left: 4px solid #00F0FF; padding: 4px 8px;");

// GENERIC TEXT ANALYSIS (Fixed to use backend generic endpoint)
export const analyzeText = async (prompt: string, context?: string): Promise<string> => {
    const data = await callBackend('getGenericAnalysis', { data: { prompt, system: context }, language: 'en' });
    return typeof data.insight === 'string' ? data.insight : "No response.";
};

import { HealthData } from "./healthService";
import { AIRec } from "./interestsService";

export const analyzeImage = async (
    base64Image: string,
    language: string = 'uz',
    userContext?: {
        biometrics?: HealthData['biometrics'],
        interests?: string[]
    }
): Promise<any> => {
    const data = await callBackend('getFoodAnalysis', { base64Image, userContext, language });
    return data.success ? data : null;
};

export const transcribeAudio = async (audioBlob: Blob, language: string = 'uz', module: string = 'voice'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
                const data = await callBackend('getTranscription', { data: { base64Audio, module }, language });
                if (data.success) {
                    resolve(data.text);
                } else {
                    resolve(`ERROR: ${data.error || "Transcription failed"}`);
                }
            } catch (error) {
                console.error("Transcription Error:", error);
                resolve("Audio system offline.");
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
    });
};

export const parseCommand = async (text: string, currentModule: string = 'home'): Promise<any> => {
    const data = await callBackend('getCommandIntent', { data: { command: text, currentModule }, language: 'uz' });
    return data.success ? data : { module: "error", confirmation_message: "Error connecting to AI." };
};

export const analyzeGenetics = async (ancestorHealth: string[]): Promise<string[]> => {
    const data = await callBackend('getGeneticsAnalysis', { data: { dnaData: ancestorHealth.join(', ') } });
    return data.success ? data.riskFactors?.map((r: any) => r.risk) : ["Unknown Risk"];
};

export const getDeepInterestsRecommendation = async (
    language: string = 'uz',
    window: 'morning' | 'lunch' | 'evening',
    context: any
): Promise<{ recommendations: AIRec[] }> => {
    const data = await callBackend('getInterestsInsight', { data: { window, ...context }, language });
    return data.success ? data : { recommendations: [] };
};

export const getDailyTaskInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getTaskInsight', { data: userContext, language });
    return data.success ? data : { title: "Plan Day", suggestion: "Organize your tasks.", priority: "medium" };
};

export const getFinanceInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFinanceInsight', { data: userContext, language });
    if (data.insight) return data;
    return data.success ? data : { title: "Finance", insight: "Keep tracking your expenses.", emoji: "💰" };
};

export const getMindInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getMindInsight', { data: userContext, language });
    return data.success ? data : { title: "Mind", insight: "Stay mindful.", emoji: "🧠" };
};

export const getHealthAudioInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getHealthInsight', { data: userContext, language });
    return data;
};

export const getWealthRoadmap = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFinanceInsight', { data: userContext, language });
    return data.success ? data : { roadmap: "Coming soon...", steps: [] };
};

// NEW: Family Insight
export const getFamilyInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFamilyInsight', { data: userContext, language });
    if (data.success_mock) {
        // CONTEXT AWARE MOCK LOGIC
        const members = userContext.members || [];
        const senior = members.find((m: any) =>
            (m.role || "").toLowerCase().includes('grand') ||
            (m.role || "").toLowerCase().includes('elder') ||
            (m.role || "").toLowerCase().includes('ota') ||
            (m.role || "").toLowerCase().includes('buvi')
        );

        const seniorName = senior ? senior.name : null;
        const mainSubject = seniorName ? `${seniorName}` : "oila a'zolari";
        const subjectWithTitle = seniorName ? `${seniorName} ota` : "keksalar";

        return {
            success: true,
            status: 'success',
            emoji: "👨‍👩‍👧‍👦",
            insight: `Oila a'zolari bilan muloqotni kuchaytirish tavsiya etiladi. ${seniorName ? seniorName + "ning" : "Keksalar"} faolligi barqaror.`,
            protocol: [
                `${seniorName ? seniorName : "Keksalar"} bilan har kuni 15 daqiqali video-aloqa o'rnatish orqali 'Raqamli Ko'prik'ni mustahkamlash.`,
                "Oila a'zolari o'rtasida 'Haftalik G'amxo'rlik' kvestini faollashtirish va ballar yig'ish.",
                `${seniorName ? seniorName : "Keksalar"}ning 'Hayot Signali' darchasini hozirgi xatti-harakatiga ko'ra 24 soatga optimallashtirish.`
            ],
            optimization: `Oila a'zolarining umumiy ruhiy holati juda yaxshi (92%). ${seniorName ? seniorName : "Keksalar"} uchun 'Passiv G'amxo'rlik' tizimi aloqa sifatini 25% ga oshirishga yordam beradi. Kritik xulosa: Muloqot chastotasi pasayishi kuzatilmadi, tizim barqaror.`,
            vitalityScore: 92,
            success_mock: true
        };
    }
    return data.success ? data : { title: "Oila", insight: "Oilaviy vaqt muhim.", emoji: "👨‍👩‍👧‍👦" };
};

// NEW: Food Log Insight
export const getFoodLogInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFoodLogInsight', { data: userContext, language });
    return data.success ? data : { title: "Nutrition", insight: "Balansni saqlang.", emoji: "🥗" };
};
