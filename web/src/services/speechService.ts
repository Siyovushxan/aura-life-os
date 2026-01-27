import { callBackend } from './groqService';

/**
 * Fetch high-quality speech for a given text from the backend
 * @param text The text to convert to speech
 * @param voice OpenAI voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @returns Base64 encoded audio string
 */
export async function getSpeech(text: string, voice: string = 'alloy'): Promise<string | null> {
    if (!text) return null;

    try {
        console.log('[AuraSpeech] Fetching high-quality voice for:', text.substring(0, 30) + '...');
        const response = await callBackend('getSpeech', { text, voice });

        if (response.success && response.audioContent) {
            return `data:audio/mp3;base64,${response.audioContent}`;
        }

        console.warn('[AuraSpeech] Backend failed, falling back to browser TTS.', response.error);
        return null;
    } catch (error) {
        console.error('[AuraSpeech] Error fetching cloud TTS:', error);
        return null;
    }
}
