import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Generate high-quality speech from text using OpenAI TTS
 * @param {string} text - The text to convert to speech
 * @param {string} language - Target language (not strictly used by OpenAI TTS, but good for context)
 * @returns {Promise<object>} Base64 audio data
 */
export async function generateSpeech(data, language = 'uz') {
  const { text, voice = 'alloy', model = 'tts-1' } = data;

  if (!text) {
    throw new Error('Text is required for speech generation.');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is missing. Speech generation will fail.');
    throw new Error('TTS service is not configured (missing API key).');
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log('[AURA Speech] Generating speech for text:', text.substring(0, 50) + '...');

    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    return {
      audioContent: base64Audio,
      format: 'mp3'
    };
  } catch (error) {
    console.error('[AURA Speech] OpenAI Error:', error.message);
    throw new Error(`Speech generation failed: ${error.message}`);
  }
}
