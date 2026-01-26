import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * OnTaskUpdate Trigger
 * Runs when a task is updated
 * Handles Gamification: Awards XP/Coins on task completion
 */
export const onTaskUpdate = onDocumentUpdated({
  document: 'users/{userId}/tasks/{taskId}',
  memory: '512MiB',
  timeoutSeconds: 60
}, async (event) => {
  const oldTask = event.data.before.data();
  const newTask = event.data.after.data();
  const userId = event.params.userId;
  const taskId = event.params.taskId;

  // Check if status changed to 'done'
  if (oldTask.status !== 'done' && newTask.status === 'done') {
    console.log(`🎉 Task ${taskId} completed by user ${userId}! Awarding XP...`);

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);

    try {
      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const currentCoins = userData.gamification?.coins || 0;

        // XP Calculation Logic
        // Base XP: 50
        // High Priority Bonus: +20
        // Difficulty Bonus (if present): +10/20/30
        let xpGain = 50;
        if (newTask.priority === 'high') xpGain += 20;
        if (newTask.difficulty === 'hard') xpGain += 30;
        if (newTask.difficulty === 'medium') xpGain += 15;

        // Coins Calculation
        let coinsGain = 10;
        if (newTask.priority === 'high') coinsGain += 5;

        // Specific Reward Handling (Smart Parenting)
        if (newTask.reward && newTask.reward.amount) {
          const rewardAmount = parseInt(newTask.reward.amount);
          if (newTask.reward.type === 'coins') {
            coinsGain += rewardAmount;
            console.log(`🎁 Bonus Reward: ${rewardAmount} Coins`);
          } else if (newTask.reward.type === 'screen_time') {
            // Screen Time balance tracking
            console.log(`🎁 Bonus Reward: ${rewardAmount} min Screen Time`);
          }
        }

        // Calculate Level from Total XP

        // Let's check consistency. If we store TotalXP:
        const totalXP = (userData.gamification?.totalXP || 0) + xpGain;
        const calculatedLevel = Math.floor(totalXP / 1000) + 1;

        const updateData = {
          'gamification.xp': totalXP, // Using totalXP as the main counter
          'gamification.level': calculatedLevel,
          'gamification.coins': currentCoins + coinsGain,
          'gamification.lastActive': FieldValue.serverTimestamp(),
          'stats.tasksCompleted': FieldValue.increment(1)
        };

        // Add Screen Time if valid
        if (newTask.reward?.type === 'screen_time' && newTask.reward?.amount) {
          const currentScreenTime = userData.gamification?.screenTimeBalance || 0;
          updateData['gamification.screenTimeBalance'] = currentScreenTime + parseInt(newTask.reward.amount);
        }

        t.update(userRef, updateData);

        console.log(`User ${userId} gained ${xpGain} XP and ${coinsGain} Coins. New Level: ${calculatedLevel}`);
      });
    } catch (error) {
      console.error('Gamification transaction failed:', error);
    }
  }
});
