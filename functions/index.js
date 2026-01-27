import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin
initializeApp();

// Set global options
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10
});

// Import all functions
export { onTaskCreate } from './triggers/onTaskCreate.js';
export { onTaskUpdate } from './triggers/onTaskUpdate.js';
export { dailyArchive } from './schedulers/dailyArchive.js';
export { dailyAIAnalysis } from './schedulers/dailyAIAnalysis.js';

// Import AI functions for HTTP endpoints
import { analyzeSimilarTasks, generateDailyInsights } from './ai/taskAnalysis.js';
import { analyzeFinance, analyzeHealth, analyzeInterests, analyzeMind, analyzeFoodImage, parseCommand, analyzeGenetics, analyzeFamily, analyzeFoodLog } from './ai/aiAnalysis.js';

import { getAuth } from 'firebase-admin/auth';

/**
 * Universal Wrapper for AI Endpoints (Secured)
 */
const createAiEndpoint = (handler) => onRequest({
  cors: true,
  memory: '512MiB',
  invoker: 'public' // We manually check auth in the handler
}, async (req, res) => {
  try {
    // SECURITY: Verify Firebase Auth ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Unauthorized attempt: No Bearer token found');
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      req.user = decodedToken; // Pass user data for potential use
    } catch (authError) {
      console.error('Token verification failed:', authError.message);
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    const { data, language = 'uz' } = req.body;
    const result = await handler(data, language, req.user); // Pass decoded user context
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(`AI error:`, error);
    res.status(200).json({
      success: false,
      error: error.message,
      title: 'Tizim Band',
      insight: 'AI xizmati hozirda juda band. Iltimos, birozdan so\'ng qayta urining.',
      emoji: '⏳',
      recommendations: []
    });
  }
});

export const getFinanceInsight = createAiEndpoint(analyzeFinance);
export const getHealthInsight = createAiEndpoint(analyzeHealth);
export const getInterestsInsight = createAiEndpoint(analyzeInterests);
export const getMindInsight = createAiEndpoint(analyzeMind);
export const getTaskInsight = createAiEndpoint(generateDailyInsights);
export const getCommandIntent = createAiEndpoint(parseCommand);
export const getGeneticsAnalysis = createAiEndpoint(analyzeGenetics);
export const getFamilyInsight = createAiEndpoint(analyzeFamily);
export const getFoodLogInsight = createAiEndpoint(analyzeFoodLog);
import { transcribeAudio } from './ai/aiAnalysis.js';
export const getTranscription = createAiEndpoint(transcribeAudio);

import { unlockReward } from './ai/gamification.js';
export const smartParentingUnlock = createAiEndpoint(unlockReward);

// Generic Text Analysis for Onboarding etc.
import { analyzeWithGroq } from './ai/groqClient.js';
export const getGenericAnalysis = createAiEndpoint(async (data, language) => {
  const { prompt, system } = data;
  const result = await analyzeWithGroq(prompt, system || 'AURA Assistant', 'home');
  return { insight: result };
});

/**
 * Special handling for Food Image Analysis (Secured)
 */
export const getFoodAnalysis = onRequest({
  cors: true,
  memory: '1GiB',
  invoker: 'public'
}, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await getAuth().verifyIdToken(idToken);

    const { base64Image, userContext, language = 'uz' } = req.body;
    const result = await analyzeFoodImage(base64Image, userContext, language);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(`Food Analysis error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Existing Task Analysis Endpoints (Secured)
 */
export const analyzeTask = onRequest({
  cors: true,
  memory: '512MiB',
  invoker: 'public'
}, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await getAuth().verifyIdToken(idToken);

    const { taskTitle, existingTasks = [] } = req.body;
    if (!taskTitle) return res.status(400).json({ error: 'taskTitle is required' });
    const analysis = await analyzeSimilarTasks(taskTitle, existingTasks);
    res.status(200).json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const getDailyInsight = onRequest({
  cors: true,
  memory: '512MiB',
  invoker: 'public'
}, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await getAuth().verifyIdToken(idToken);

    const userData = req.body;
    const insight = await generateDailyInsights(userData);
    res.status(200).json({ success: true, insight });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health Check Endpoint
 */
export const healthCheck = onRequest({
  cors: true,
  invoker: 'public'
}, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    keys: {
      IMAGE: !!process.env.GROQ_IMAGE_API_KEY,
      FOOD: !!process.env.GROQ_FOOD_KEY,
      MAIN: !!process.env.GROQ_API_KEY
    }
  });
});
