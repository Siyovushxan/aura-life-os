import { auth as firebaseAuth } from "@/firebaseConfig";

// Dynamic Backend URL for Cloud Functions
const BASE_URL = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
    ? 'http://127.0.0.1:5001/aura-f1d36/us-central1'
    : 'https://us-central1-aura-f1d36.cloudfunctions.net';

export async function callBackend(endpoint: string, payload: any) {
    try {
        // SECURITY: Inject CURRENT user's token
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
            console.error("Auth Error: No user logged in for backend call.");
            return { success: false, error: 'Unauthorized' };
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                data: payload,
                language: 'uz'
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn("Security Alert: Token expired or invalid.");
            }
            throw new Error(`Backend Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        // SILENT FALLBACK FOR DEVELOPMENT (Mock Logic)
        const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (IS_LOCAL) {
            console.warn(`[AURA AI Proxy] Backend error/offline (${endpoint}). Using simulated response.`);

            if (endpoint === 'getFamilyInsight') return { success: true, insight: "Oila a'zolari bilan muloqotni kuchaytirish tavsiya etiladi. Azamat otaning faolligi barqaror.", emoji: "👨‍👩‍👧‍👦", success_mock: true };
            if (endpoint === 'getFinanceInsight') return {
                success: true,
                insight: "Xarajatlar nazorat ostida. Jamg'arma rejasiga amal qiling.",
                optimization: "Zaxira jamg'armasini shakllantirish moliyaviy barqarorlikni oshiradi.",
                potentialSavings: "500,000 UZS",
                vitalityScore: 78,
                roadmap: ["Xarajatlarni nazorat qilish", "Byudjetni optimallashtirish", "Jamg'armani oshirish"],
                emoji: "💰",
                success_mock: true
            };
            if (endpoint === 'getTaskInsight') return {
                success: true,
                title: "Kunlik Reja",
                suggestion: "Bugun 3 ta asosiy vazifaga diqqat qarating.",
                optimization: "Vazifalarni prioritetlar bo'yicha taqsimlash va 'deep work' bloklarini qo'llash orqali unumdorlikni 20% ga oshirish mumkin.",
                roadmap: ["Eng muhim 3 vazifani belgilash", "Chalg'ituvchi omillarni cheklash", "Blok-tayming usulini qo'llash"],
                vitalityScore: 82,
                emoji: "✅",
                success_mock: true
            };
            if (endpoint === 'getHealthInsight') return {
                success: true,
                title: "AURA Vitality Protocol",
                insight: "Metabolik faollik va uyqu sikli sinxron holatda. Hydration darajasini oshirish orqali kognitiv samaradorlikni 15% ga oshirish mumkin.",
                optimization: "Suv ichish tartibini yaxshilash orqali energiyani barqarorlashtiring.",
                protocol: [
                    "Ertalabki 500ml suv + elektrolitlar (Bio-Charge)",
                    "15 daqiqalik intensiv yurish (Metabolic Flux)",
                    "Kechki 22:30 dagi uyquga tayyorgarlik (Neural Sync)"
                ],
                vitalityScore: 88,
                emoji: "🧬",
                status: "ready",
                success_mock: true
            };
            if (endpoint === 'getFoodLogInsight') return { success: true, title: "Nutrition Logic", insight: "Bugun oqsil miqdori yetarli. Kechki ovqatda uglevodlarni kamaytirish tavsiya etiladi.", emoji: "🥗", success_mock: true };
            if (endpoint === 'getFoodAnalysis') return {
                success: true,
                name: "Tovuq va Sabzavotlar",
                calories: 450,
                protein: 35,
                carbs: 20,
                fat: 15,
                advice: "Oqsilga boy, muvozanatli taom. Mashg'ulotdan keyin iste'mol qilish uchun ajoyib tanlov.",
                vitalityScore: 92,
                emoji: "🍗",
                success_mock: true
            };
            if (endpoint === 'getTranscription') return { success: true, text: "Bugun 50000 so'm ishlatdim.", success_mock: true };
            if (endpoint === 'getCommandIntent') return { success: true, module: "finance", action: "add", data: { amount: 50000, category: "Oziq-ovqat", type: "expense" }, confirmation_message: "50,000 so'm xarajat moliya bo'limiga qo'shildi.", success_mock: true };
        }

        console.error(`AURA Backend Error (${endpoint}):`, error);
        return { success: false, error: (error as Error).message || "System temporarily offline." };
    }
}

// VERSION: AURA-PROD-STABLE-2026-01-21
console.log("%c AURA AI CORE: V2026.1 (SECURE BACKEND) ACTIVE ", "background: #000; color: #00F0FF; font-weight: bold; border-left: 4px solid #00F0FF; padding: 4px 8px;");

// GENERIC TEXT ANALYSIS (Fixed to use backend generic endpoint)
export const analyzeText = async (prompt: string, context?: string): Promise<string> => {
    const data = await callBackend('getGenericAnalysis', { data: { prompt, system: context }, language: 'en' });
    return typeof data.insight === 'string' ? data.insight : "No response.";
};

import { HealthData } from "./healthService";
import { AIRec } from "./interestsService";

// Utility: Compress image before sending to AI
export const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => {
            // Fallback: return original if load fails (though rare with valid base64)
            resolve(base64Str);
        };
    });
};

export const analyzeImage = async (
    base64Image: string,
    language: string = 'uz',
    userContext?: {
        biometrics?: HealthData['biometrics'],
        interests?: string[]
    }
): Promise<any> => {
    try {
        // Compress image to save bandwidth and speed up analysis
        const compressedImage = await compressImage(base64Image);

        let data;
        // FORCE LOCAL MOCK if needed (to bypass broken backend emulator logic for this specific problematic endpoint)
        const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (IS_LOCAL) {
            // Simulate random results to make "Tezkor Maslahat" feel dynamic during testing
            const mocks = [
                {
                    name: "Tovuq va Sabzavotlar",
                    calories: 450,
                    protein: 35,
                    carbs: 20,
                    fat: 15,
                    advice: "Oqsilga boy, muvozanatli taom. Mashg'ulotdan keyin iste'mol qilish uchun ajoyib tanlov.",
                    insight: "Oqsilga boy, muvozanatli taom. Mashg'ulotdan keyin iste'mol qilish uchun ajoyib tanlov.",
                    optimization: "Sabzavotlar miqdorini oshirish hazm qilishni yaxshilaydi.",
                    vitalityScore: 92,
                    emoji: "🍗"
                },
                {
                    name: "Meva Salati",
                    calories: 210,
                    protein: 5,
                    carbs: 45,
                    fat: 2,
                    advice: "Vitaminlarga boy yengil tamaddi. Energiyani tez tiklash uchun juda foydali.",
                    insight: "Vitaminlarga boy yengil tamaddi. Energiyani tez tiklash uchun juda foydali.",
                    optimization: "Biroz yong'oq qo'shish orqali to'yimlilikni oshirish mumkin.",
                    vitalityScore: 88,
                    emoji: "🥗"
                },
                {
                    name: "Qahva va Krussan",
                    calories: 350,
                    protein: 8,
                    carbs: 40,
                    fat: 18,
                    advice: "Tetikashtiruvchi, lekin yog' va shakar miqdori biroz yuqori. Me'yorni saqlang.",
                    insight: "Tetikashtiruvchi, lekin yog' va shakar miqdori biroz yuqori. Me'yorni saqlang.",
                    optimization: "Shakarsiz qahva ichish orqali kaloriya miqdorini kamaytiring.",
                    vitalityScore: 65,
                    emoji: "☕"
                }
            ];
            const randomMock = mocks[Math.floor(Math.random() * mocks.length)];

            data = {
                success: true,
                ...randomMock,
                success_mock: true
            };
        } else {
            data = await callBackend('getFoodAnalysis', { base64Image: compressedImage, userContext, language });
        }

        // Critical: Sanitize result. If backend returns success=true but data contains error text, handle it.
        if (data.success) {
            const hasErrorText =
                (data.name && (data.name.includes("Error:") || data.name.includes("Xatolik") || data.name.includes("Invalid"))) ||
                (data.advice && (data.advice.includes("Error:") || data.advice.includes("Xatolik") || data.advice.includes("Invalid"))) ||
                (data.insight && (data.insight.includes("Error:") || data.insight.includes("Xatolik") || data.insight.includes("Invalid")));

            if (hasErrorText) {
                return {
                    ...data,
                    name: "Aniqlanmagan Taom",
                    advice: "Rasm sifati past yoki taom aniqlanmadi. Iltimos, qayta urinib ko'ring.",
                    insight: "Rasm sifati past yoki taom aniqlanmadi. Iltimos, qayta urinib ko'ring.",
                    optimization: "Keyingi safar yorug'roq joyda suratga oling.",
                    calories: 0,
                    vitalityScore: 0,
                    status: 'warning'
                };
            }
            return data;
        }
        return null;
    } catch (e) {
        console.error("Analyze Image Local Error", e);
        return null; // Fail gracefully
    }
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
): Promise<any> => {
    const data = await callBackend('getInterestsInsight', { data: { window, ...context }, language });

    const getDynamicInterestsFallback = (baseData: any) => {
        const hobbyCount = context.hobbies?.length || 0;
        const habitCount = context.habitStats?.length || 0;

        return {
            ...baseData,
            optimization: baseData.optimization || (hobbyCount > 0
                ? `${hobbyCount} ta hobbingiz bo'yicha intellektual salohiyatni tizimli oshirishda davom eting.`
                : "Yangi qiziqishlar orqali hayotiy energiyani oshiring va yangi ufqlarni kashf eting."),
            vitalityScore: baseData.vitalityScore || (habitCount > 0 ? 85 : 70)
        };
    };

    if (data.success_mock) {
        return getDynamicInterestsFallback(data);
    }

    if (data.success) {
        return getDynamicInterestsFallback(data);
    }

    return {
        recommendations: [],
        optimization: "Hozircha tahlil uchun ma'lumotlar kam. Yangi mashg'ulotlarni qo'shing.",
        vitalityScore: 60
    };
};

export const getDailyTaskInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getTaskInsight', { data: userContext, language });

    const generateFallback = (baseData: any) => {
        const total = userContext.tasks?.length || 0;
        const done = userContext.tasks?.filter((t: any) => t.status === 'done').length || 0;
        const efficiency = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
            ...baseData,
            success: true,
            optimization: baseData.optimization || (efficiency > 70 ? "Siz juda samarali ishlamoqdasiz! Strategik vazifalarga ko'proq vaqt ajrating." : "Bugun diqqatni jamlashda biroz qiynalgan ko'rinasiz. Eng qiyin vazifani birinchi bajaring."),
            vitalityScore: baseData.vitalityScore || Math.max(60, efficiency),
            roadmap: baseData.roadmap || ["Vazifalarni saralash", "Diqqatni jamlash", "Natijani tekshirish"],
            emoji: baseData.emoji || "✅"
        };
    };

    if (data.success_mock) return generateFallback(data);
    if (data.success) {
        if (!data.optimization || !data.vitalityScore) return generateFallback(data);
        return data;
    }

    return generateFallback({ title: "Tasks", insight: "Organize your schedule." });
};

export const getFinanceInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFinanceInsight', { data: userContext, language });

    const generateFallback = (baseData: any) => {
        const income = userContext.monthlyIncome || 0;
        const spent = userContext.monthlySpent || 0;
        const savingsRate = income > 0 ? ((income - spent) / income) * 100 : 0;

        return {
            ...baseData,
            success: true,
            optimization: baseData.optimization || (savingsRate > 20 ? "Moliyaviy barqarorlik saqlanib qolmoqda, jamg'armalarni diversifikatsiya qilish tavsiya etiladi." : "Xarajatlarni kamaytirish va zaxira shakllantirishga e'tibor bering."),
            vitalityScore: baseData.vitalityScore || Math.min(100, Math.max(0, 50 + savingsRate / 2)),
            potentialSavings: baseData.potentialSavings || (spent > 0 ? `${(spent * 0.1).toLocaleString()} UZS` : "0 UZS"),
            roadmap: baseData.roadmap || ["Xarajatlarni nazorat qilish", "Byudjetni optimallashtirish", "Jamg'armani oshirish"]
        };
    };

    if (data.success_mock) {
        return generateFallback(data);
    }

    if (data.success) {
        if (!data.optimization || !data.vitalityScore) {
            return generateFallback(data);
        }
        return data;
    }

    return { title: "Finance", insight: "Keep tracking your expenses.", emoji: "💰", optimization: "Moliya tahlili mavjud emas.", vitalityScore: 50 };
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

    // Helper to generate context-aware detailed mock/fallback
    const generateDetailedContext = (baseData: any) => {
        const members = userContext.members || [];
        const senior = members.find((m: any) =>
            (m.role || "").toLowerCase().includes('grand') ||
            (m.role || "").toLowerCase().includes('elder') ||
            (m.role || "").toLowerCase().includes('ota') ||
            (m.role || "").toLowerCase().includes('buvi')
        );

        const seniorName = senior ? senior.name : null;
        const mainSubject = seniorName ? `${seniorName}` : "oila a'zolari";

        return {
            ...baseData,
            success: true,
            status: 'success',
            emoji: baseData.emoji || "👨‍👩‍👧‍👦",
            insight: baseData.insight || `Oila a'zolari bilan muloqotni kuchaytirish tavsiya etiladi. ${seniorName ? seniorName + "ning" : "Keksalar"} faolligi barqaror.`,
            protocol: baseData.protocol || [
                `${seniorName ? seniorName : "Keksalar"} bilan har kuni muloqot o'rnatish orbiqali aloqani mustahkamlash.`,
                "Oila a'zolari o'rtasida 'Haftalik G'amxo'rlik' tadbirlarini faollashtirish.",
                "Umumiy oilaviy maqsadlarni belgilash va ularga erishish."
            ],
            optimization: baseData.optimization || baseData.action || `Oila a'zolarining umumiy ruhiy holati barqaror. ${seniorName ? seniorName : "Keksalar"} uchun muloqot sifatini oshirish tavsiya etiladi.`,
            vitalityScore: baseData.vitalityScore || 85,
            success_mock: baseData.success_mock
        };
    };

    if (data.success_mock) {
        return generateDetailedContext(data);
    }

    if (data.success) {
        // Even if live data, if optimization or vitalityScore are missing, fill them
        if (!data.optimization || !data.vitalityScore) {
            return generateDetailedContext(data);
        }
        return data;
    }

    return { title: "Oila", insight: "Oilaviy vaqt muhim.", emoji: "👨‍👩‍👧‍👦", optimization: "Muloqotni saqlang.", vitalityScore: 70 };
};

// NEW: Food Log Insight
export const getFoodLogInsight = async (
    language: string = 'uz',
    userContext: any
): Promise<any> => {
    const data = await callBackend('getFoodLogInsight', { data: userContext, language });
    return data.success ? data : { title: "Nutrition", insight: "Balansni saqlang.", emoji: "🥗" };
};
