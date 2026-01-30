/* eslint-disable */
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
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { handleClickWebhook } from './webhooks/clickHandler.js';
import { handlePaymeWebhook } from './webhooks/paymeHandler.js';

// Initialize Firestore
const db = getFirestore();

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey === 'sk_test_mock') {
  console.warn('⚠️ WARNING: Stripe secret key not found or using mock key!');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_mock', {
  apiVersion: '2024-12-18.acacia'
});

const PLAN_LIMITS = {
  'trial': 3,
  'individual': 50,
  'family': 250
};

/**
 * Universal Wrapper for AI Endpoints (Secured with Limits)
 */
const createAiEndpoint = (handler) => onRequest({
  cors: true,
  memory: '512MiB',
  invoker: 'public'
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const user = await getAuth().verifyIdToken(idToken);

    // --- SUBSCRIPTION & LIMIT CHECK ---
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    const sub = userData.subscription || { planId: 'trial', status: 'active' };

    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('usage').doc(user.uid).collection('daily').doc(today);
    const usageDoc = await usageRef.get();
    const currentUsage = usageDoc.exists ? usageDoc.data().count : 0;

    const limit = PLAN_LIMITS[sub.planId] || 3;

    if (currentUsage >= limit) {
      return res.status(200).json({
        success: false,
        error: 'Limit exceeded',
        title: 'Limitga yetildi',
        insight: `Bugungi AI limitlaringiz (${limit} so'rov) tugadi. Iltimos, ertaga qayta urinib ko'ring yoki tarifni yangilang.`,
        emoji: '🚫',
        recommendations: [{ text: "Tarifni yangilash", action: "OPEN_BILLING" }]
      });
    }

    const { data, language = 'uz' } = req.body;
    // Pass enriched user object to handler
    const result = await handler(data, language, { ...user, ...userData, subscription: sub });

    // Update usage count
    await usageRef.set({ count: currentUsage + 1, lastUpdated: FieldValue.serverTimestamp() }, { merge: true });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(`AI error:`, error);
    res.status(200).json({
      success: false,
      error: error.message,
      title: 'Tizim Band',
      insight: 'AI xizmati hozirda juda band. Iltimos, birozdan so\'ng qayta urining.',
      emoji: '⏳'
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
import { generateSpeech as generateOpenAISpeech } from './ai/speechService.js';
export const getTranscription = createAiEndpoint(transcribeAudio);
export const getSpeech = createAiEndpoint(generateOpenAISpeech);

// import { unlockReward } from './ai/gamification.js';
// export const smartParentingUnlock = createAiEndpoint(unlockReward);

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
export const analyzeTask = createAiEndpoint(async (data, language, user) => {
  const { taskTitle, existingTasks = [] } = data;
  if (!taskTitle) throw new Error('taskTitle is required');
  const analysis = await analyzeSimilarTasks(taskTitle, existingTasks);
  return { analysis };
});

export const getDailyInsight = createAiEndpoint(async (data, language, user) => {
  const insight = await generateDailyInsights(data);
  return { insight };
});

/**
 * Special handling for Food Image Analysis (Secured with Limits)
 */
export const getFoodAnalysis = createAiEndpoint(async (data, language, user) => {
  const { base64Image, userContext } = data;
  if (!base64Image) throw new Error('base64Image is required');
  return await analyzeFoodImage(base64Image, userContext, language);
});

/**
 * Stripe Payment Intent Creation
 */
export const createPaymentIntent = onRequest({
  cors: true,
  invoker: 'public'
}, async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // callBackend wraps payload in { data: payload, language: 'uz' }
    const payloadData = req.body.data || req.body;
    const { amount, currency = 'usd', planId } = payloadData;

    console.log('[createPaymentIntent] Request body:', JSON.stringify(req.body));
    console.log('[createPaymentIntent] Payload data:', JSON.stringify(payloadData));
    console.log('[createPaymentIntent] Amount:', amount);
    console.log('[createPaymentIntent] Amount type:', typeof amount);
    console.log('[createPaymentIntent] Is amount undefined?', amount === undefined);
    console.log('[createPaymentIntent] Is amount null?', amount === null);
    console.log('[createPaymentIntent] Amount * 100:', amount * 100);
    console.log('[createPaymentIntent] Math.round result:', Math.round(amount * 100));

    if (!amount || isNaN(amount)) {
      throw new Error(`Invalid amount received: ${amount} (type: ${typeof amount})`);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        userId: decodedToken.uid,
        planId: planId
      },
      automatic_payment_methods: { enabled: true }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Stripe Payment Intent Error:', error);
    console.error('Stripe Key Present:', !!process.env.STRIPE_SECRET_KEY);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Diagnostic endpoint for Stripe
 */
export const stripeTest = onRequest({ invoker: 'public' }, async (req, res) => {
  res.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) : 'none',
    nodeVersion: process.version
  });
});

/**
 * Stripe Webhook Handler
 * Listens to payment events from Stripe
 */
export const stripeWebhook = onRequest({
  cors: false,
  invoker: 'public'
}, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️ Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[stripeWebhook] Received event type: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('✅ [stripeWebhook] Payment succeeded:', paymentIntent.id);
      console.log('[stripeWebhook] Metadata received:', JSON.stringify(paymentIntent.metadata));

      // Extract metadata
      const { userId, planId } = paymentIntent.metadata;

      if (!userId || !planId) {
        console.error('❌ [stripeWebhook] CRITICAL: Missing metadata in payment intent:', paymentIntent.id);
        break;
      }

      console.log(`[stripeWebhook] Processing for User: ${userId}, Plan: ${planId}, Amount cents: ${paymentIntent.amount}`);

      try {
        // Update user subscription
        const userRef = db.collection('users').doc(userId);
        const subscriptionData = {
          planId: planId,
          status: 'active',
          startDate: FieldValue.serverTimestamp(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          autoRenew: true,
          paymentMethod: 'stripe',
          lastPayment: FieldValue.serverTimestamp()
        };

        await userRef.update({
          subscription: subscriptionData,
          updatedAt: FieldValue.serverTimestamp()
        });

        console.log(`[stripeWebhook] User ${userId} subscription updated.`);

        // Save payment history
        const paymentRecord = {
          userId: userId,
          planId: planId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'succeeded',
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            description: `${planId.toUpperCase()} subscription payment`
          }
        };

        const result = await db.collection('payments').add(paymentRecord);
        console.log(`✅ [stripeWebhook] Payment history recorded with ID: ${result.id}`);
      } catch (error) {
        console.error('❌ [stripeWebhook] Error processing success event:', error);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      console.log('❌ Payment failed:', failedPayment.id);

      // Optionally log failed payment
      if (failedPayment.metadata.userId) {
        await db.collection('payments').add({
          userId: failedPayment.metadata.userId,
          planId: failedPayment.metadata.planId,
          amount: failedPayment.amount / 100,
          currency: failedPayment.currency,
          status: 'failed',
          paymentMethod: 'stripe',
          stripePaymentIntentId: failedPayment.id,
          createdAt: new Date(),
          error: failedPayment.last_payment_error?.message || 'Unknown error'
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Payment Gateway Webhooks
 */
export const clickWebhook = onRequest({
  cors: false,
  invoker: 'public'
}, handleClickWebhook);

export const paymeWebhook = onRequest({
  cors: false,
  invoker: 'public'
}, handlePaymeWebhook);

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
    version: '1.3.0',
    keys: {
      IMAGE: !!process.env.GROQ_IMAGE_API_KEY,
      FOOD: !!process.env.GROQ_FOOD_KEY,
      MAIN: !!process.env.GROQ_API_KEY,
      CLICK: !!process.env.CLICK_SECRET_KEY,
      PAYME: !!process.env.PAYME_KEY,
      STRIPE: !!process.env.STRIPE_SECRET_KEY
    }
  });
});
