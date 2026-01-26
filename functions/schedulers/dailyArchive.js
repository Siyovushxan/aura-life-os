import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

/**
 * Daily Auto-Archive Function
 * Runs every day at 02:00 AM (Tashkent time)
 * Archives completed tasks older than 30 days
 */
export const dailyArchive = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'Asia/Tashkent',
  memory: '256MiB',
  timeoutSeconds: 540
}, async (event) => {
  const db = getFirestore();
  const archiveDate = subDays(new Date(), 30);

  console.log(`📦 Starting daily archive for tasks older than ${archiveDate.toISOString()}`);

  let totalArchived = 0;
  let totalErrors = 0;

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users to process`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // Find completed tasks older than 30 days
        const oldTasksSnapshot = await db
            .collection(`users/${userId}/tasks`)
            .where('status', '==', 'completed')
            .where('completedAt', '<', archiveDate)
            .get();

        if (oldTasksSnapshot.empty) {
          continue;
        }

        const batch = db.batch();
        let userArchivedCount = 0;

        oldTasksSnapshot.docs.forEach((taskDoc) => {
          // Create archive document
          const archiveRef = db
              .collection(`users/${userId}/archived`)
              .doc(taskDoc.id);

          batch.set(archiveRef, {
            ...taskDoc.data(),
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: 'system'
          });

          // Delete original task
          batch.delete(taskDoc.ref);

          userArchivedCount++;
        });

        // Execute batch
        await batch.commit();

        // Update user stats
        await userDoc.ref.update({
          'stats.archivedTasks': FieldValue.increment(userArchivedCount),
          'stats.lastArchiveDate': FieldValue.serverTimestamp()
        });

        totalArchived += userArchivedCount;
        console.log(`✅ Archived ${userArchivedCount} tasks for user ${userId}`);
      } catch (error) {
        console.error(`❌ Error archiving tasks for user ${userId}:`, error);
        totalErrors++;
      }
    }

    console.log(`✨ Archive complete! Total: ${totalArchived} tasks, Errors: ${totalErrors}`);

    return {
      success: true,
      totalArchived,
      totalErrors,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Fatal error in daily archive:', error);
    throw error;
  }
});
