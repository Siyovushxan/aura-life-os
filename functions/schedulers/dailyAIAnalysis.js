import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { generateDailyInsights } from '../ai/taskAnalysis.js';
import { analyzeFinance, analyzeHealth, analyzeMind } from '../ai/aiAnalysis.js';

/**
 * Daily PROACTIVE AI Analysis
 * Runs every day at 06:10 AM (Tashkent time)
 * Generates a comprehensive "AURA Daily Brief" for each user
 */
export const dailyAIAnalysis = onSchedule({
  schedule: '10 06 * * *',
  timeZone: 'Asia/Tashkent',
  memory: '512MiB',
  timeoutSeconds: 540
}, async (event) => {
  const db = getFirestore();
  const today = format(new Date(), 'yyyy-MM-dd');

  console.log(`🤖 Starting proactive daily AI analysis for ${today}`);

  try {
    const usersSnapshot = await db.collection('users').get();
    console.log(`Analyzing data for ${usersSnapshot.size} users`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userLanguage = userDoc.data().language || 'uz';

      try {
        // 1. Gather Data context
        const [tasksSnap, financeSnap, healthSnap, mindSnap] = await Promise.all([
          db.collection(`users/${userId}/tasks`).where('date', '==', today).get(),
          db.collection(`users/${userId}/finance`).doc('overview').get(),
          db.collection(`users/${userId}/health`).doc('daily').get(),
          db.collection(`users/${userId}/mind`).doc('overview').get()
        ]);

        const taskData = {
          completedTasks: tasksSnap.docs.filter((d) => d.data().status === 'done').length,
          pendingTasks: tasksSnap.docs.filter((d) => d.data().status !== 'done').length,
          // Add more context if needed
        };

        const financeData = financeSnap.exists ?
                    financeSnap.data() : { monthlyIncome: 0, monthlySpent: 0 };
        const healthData = healthSnap.exists ?
                    healthSnap.data() : { steps: 0, sleepHours: 0 };
        const mindData = mindSnap.exists ?
                    mindSnap.data() : { recentMood: 50, moodHistory: [] };

        // 2. Run AI Analysis in Parallel for speed
        const [dailyBrief, finInsight, healthInsight, mindInsight] =
                    await Promise.all([
                      generateDailyInsights(taskData, userLanguage),
                      analyzeFinance(financeData, userLanguage),
                      analyzeHealth(healthData, userLanguage),
                      analyzeMind(mindData, userLanguage),
                    ]);

        // 3. Persist Insights
        const insightRef = db.collection(`users/${userId}/ai_insights`).doc(`daily_${today}`);

        await insightRef.set({
          type: 'daily_brief',
          date: today,
          brief: dailyBrief,
          modules: {
            finance: finInsight,
            health: healthInsight,
            mind: mindInsight
          },
          generatedAt: FieldValue.serverTimestamp(),
          isRead: false
        });

        console.log(`✅ Daily brief generated for user ${userId}`);
      } catch (userError) {
        console.error(`❌ Error generating brief for user ${userId}:`, userError);
      }
    }

    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('❌ Fatal error in daily AI analysis:', error);
    throw error;
  }
});
