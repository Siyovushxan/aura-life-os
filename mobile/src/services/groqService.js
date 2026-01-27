import { auth as firebaseAuth } from "../firebaseConfig";

// Dynamic Backend URL for Cloud Functions
const BASE_URL = 'https://us-central1-aura-f1d36.cloudfunctions.net';

export async function callBackend(endpoint, payload) {
    try {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
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
            throw new Error(`Backend Error: ${response.statusText}`);
        }

        const result = await response.json();
        return result.result || result; // Handle both direct and wrapped responses
    } catch (error) {
        console.warn(`[AURA AI Proxy] Backend error/offline (${endpoint}). Using fallback.`);

        // Mock fallbacks for development convenience
        if (endpoint === 'getTranscription') return { success: true, text: "Bugun 50000 so'm ishlatdim.", success_mock: true };
        if (endpoint === 'getCommandIntent') return { success: true, module: "finance", action: "add", data: { amount: 50000, category: "Oziq-ovqat", type: "expense" }, confirmation_message: "50,000 so'm xarajat moliya bo'limiga qo'shildi.", success_mock: true };

        return { success: false, error: error.message || "System offline." };
    }
}

export const transcribeAudio = async (base64Audio, language = 'uz', module = 'voice') => {
    try {
        const data = await callBackend('getTranscription', { data: { base64Audio, module }, language });
        return data.success ? data.text : `ERROR: ${data.error}`;
    } catch (error) {
        return "Audio system offline.";
    }
};

export const parseCommand = async (text, currentModule = 'home') => {
    const data = await callBackend('getCommandIntent', { data: { command: text, currentModule }, language: 'uz' });
    return data.success ? data : { module: "error", confirmation_message: "Error connecting to AI." };
};

export const analyzeImage = async (base64Image, language = 'uz') => {
    try {
        const data = await callBackend('analyzeFoodImage', { image: base64Image, language });
        return data.success ? data : { success: false, error: "AI analysis failed." };
    } catch (error) {
        return { success: false, error: "Vision system offline." };
    }
};
