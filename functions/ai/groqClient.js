import Groq from 'groq-sdk';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables with explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Look in functions root
dotenv.config(); // Also try default for backup

/**
 * GROQ Client Types
 * - TEXT: For task analysis, insights, text generation
 * - IMAGE: For image analysis, OCR (future)
 * - VOICE: For voice message analysis, speech-to-text (future)
 */
export const GROQ_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice'
};

/**
 * Get GROQ client for specific task type
 * @param {string} type - Client type (text, image, voice)
 * @returns {Groq} GROQ client instance
 */
/**
 * Get GROQ client for specific task type or module
 * @param {string} type - Client type or Module name
 * @returns {Groq} GROQ client instance
 */
function getGroqClient(type = GROQ_TYPES.TEXT) {
  const moduleKeyMap = {
    'home': process.env.GROQ_HOME_KEY,
    'family': process.env.GROQ_FAMILY_KEY,
    'finance': process.env.GROQ_FINANCE_KEY,
    'tasks': process.env.GROQ_TASKS_KEY,
    'health': process.env.GROQ_HEALTH_KEY,
    'food': process.env.GROQ_FOOD_KEY,
    'mind': process.env.GROQ_MIND_KEY,
    'interests': process.env.GROQ_INTERESTS_KEY
  };

  let apiKey = moduleKeyMap[type];

  // If no module-specific key, try generic types
  if (!apiKey) {
    switch (type) {
      case GROQ_TYPES.TEXT:
        apiKey = process.env.GROQ_TEXT_API_KEY;
        break;
      case GROQ_TYPES.IMAGE:
        apiKey = process.env.GROQ_IMAGE_API_KEY || process.env.GROQ_FOOD_KEY;
        break;
      case GROQ_TYPES.VOICE:
        apiKey = process.env.GROQ_TEXT_API_KEY || process.env.GROQ_VOICE_API_KEY;
        break;
      default:
        apiKey = process.env.GROQ_TEXT_API_KEY;
    }
  }

  // Global fallbacks
  apiKey = apiKey || process.env.GROQ_API_KEY || process.env.GROQ_TEXT_API_KEY;

  // Ultimate last resort: Try EVERY key in the .env until one is found
  if (!apiKey) {
    apiKey = Object.values(moduleKeyMap).find((k) => !!k) || process.env.GROQ_TEXT_API_KEY;
  }

  if (!apiKey) {
    console.warn(`GROQ API kaliti topilmadi: ${type}. AI funksiyalari o'chirib qo'yildi.`);
    return null;
  }

  return new Groq({ apiKey });
}

/**
 * Analyze text using GROQ AI
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System instructions
 * @param {string} type - Client type to use
 * @returns {Promise<string>} AI response
 */
export async function analyzeWithGroq(
    prompt,
    systemPrompt = '',
    type = GROQ_TYPES.TEXT
) {
  try {
    const groq = getGroqClient(type);
    if (!groq) {
      console.warn('Groq client not initialized (missing key). Returning fallback.');
      return JSON.stringify({
        title: 'AI Sozlanmagan',
        insight: 'Tizimda AI kalitlari topilmadi. Iltimos, .env faylini tekshiring.',
        emoji: '⚠️',
        text: 'AI o\'chirilgan.'
      });
    }

    const isVision = type === GROQ_TYPES.IMAGE || type === 'food'; // Food uses vision for image analysis, or text?
    // Actually analyzeFoodImage calls with specific params.
    // Let's rely on checking if it's NOT vision/voice to default to text.

    const isText = !isVision && type !== GROQ_TYPES.VOICE;

    const model = isText ?
      (process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile') :
      (process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct');

    const completion = await groq.chat.completions.create({
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      model,
      temperature: 0.7,
      max_tokens: 1024
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`GROQ API error (${type}):`, error.message);

    // Handle Rate Limiting gracefully
    if (error.message.includes('429') || error.code === 'rate_limit_exceeded') {
      console.warn('GROQ Rate Limit reached. Returning fallback.');
      return JSON.stringify({
        title: 'Tizim Bandligi',
        insight: 'Hozirda AI serverlarimiz juda band. Iltimos keyinroq urinib ko\'ring.',
        emoji: '⏳',
        text: 'AI xizmati vaqtincha band.'
      });
    }

    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * Analyze image using GROQ Vision
 * @param {string} base64Image - Base64 encoded image or URL
 * @param {string} question - Question about the image
 * @returns {Promise<string>} AI response
 */
export async function analyzeImage(base64Image, question, clientType = GROQ_TYPES.IMAGE) {
  try {
    const groq = getGroqClient(clientType);
    if (!groq) throw new Error('Groq client not initialized (missing key).');

    // Validate base64Image parameter
    if (!base64Image || typeof base64Image !== 'string') {
      throw new Error('Invalid image data: base64Image is required and must be a string.');
    }

    // Check if it's already a data URL, if not make it one
    const imageUrl = base64Image.startsWith('data:') ?
      base64Image :
      `data:image/jpeg;base64,${base64Image}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      model: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
      temperature: 0.1, // Keep low for JSON consistency
      max_tokens: 1024 // Increased to prevent JSON cutoff
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('GROQ Vision error:', error.message);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using GROQ Whisper
 * @param {Buffer} audioFile - Audio file buffer
 * @param {string} language - Language code (uz, ru, en)
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioFile, language = 'uz', module = GROQ_TYPES.VOICE) {
  try {
    console.log(`[GroqClient] Starting transcription (Mode: ${module}) in language: ${language}`);
    const groq = getGroqClient(module);
    if (!groq) throw new Error('Groq client not initialized (missing key).');

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: process.env.GROQ_AUDIO_MODEL || 'whisper-large-v3',
      language,
      response_format: 'json',
      temperature: 0.1
    });

    console.log('[GroqClient] Transcription success');
    return transcription.text || '';
  } catch (error) {
    console.error('[GroqClient] Transcription Error:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Parse JSON response from GROQ
 * @param {string} response - GROQ response
 * @returns {object|null} Parsed JSON or null if parsing fails
 */
export function parseGroqJSON(response) {
  try {
    // 1. naive cleanup
    let cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // 2. Extract JSON object if wrapped in text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    console.log('Response that failed to parse:', response);
    return null;
  }
}

/**
 * Check API key validity
 * @param {string} type - Client type
 * @returns {boolean} True if key exists
 */
export function hasAPIKey(type = GROQ_TYPES.TEXT) {
  try {
    getGroqClient(type);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get API usage stats (placeholder for future implementation)
 * @returns {Promise<object>} Usage statistics
 */
export async function getAPIUsage() {
  // This will be implemented when GROQ provides usage API
  return {
    text: { used: 0, limit: 14400 },
    image: { used: 0, limit: 14400 },
    voice: { used: 0, limit: 14400 }
  };
}
