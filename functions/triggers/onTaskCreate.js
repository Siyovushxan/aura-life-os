import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { analyzeSimilarTasks, suggestPriority } from '../ai/taskAnalysis.js';

/**
 * OnTaskCreate Trigger
 * Runs when a new task is created
 * Analyzes task similarity and suggests priority
 */
export const onTaskCreate = onDocumentCreated({
  document: 'users/{userId}/tasks/{taskId}',
  memory: '512MiB',
  timeoutSeconds: 60
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error('No data in snapshot');
    return;
  }

  const newTask = snapshot.data();
  const userId = event.params.userId;
  const taskId = event.params.taskId;

  console.log(`🆕 New task created: ${taskId} for user ${userId}`);

  try {
    const db = getFirestore();

    // Get user's existing active tasks
    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where('status', '==', 'active')
        .limit(50)
        .get();

    const existingTasks = tasksSnapshot.docs
        .filter((doc) => doc.id !== taskId)
        .map((doc) => doc.data().title);

    console.log(`Found ${existingTasks.length} existing tasks to compare`);

    // Run AI analyses in parallel
    const [similarityAnalysis, prioritySuggestion] = await Promise.all([
      analyzeSimilarTasks(newTask.title, existingTasks),
      suggestPriority(newTask.title, {
        category: newTask.category,
        deadline: newTask.deadline,
        description: newTask.description,
        isSubtask: !!newTask.parentId
      })
    ]);

    // Update task with AI suggestions
    await snapshot.ref.update({
      aiSuggestions: {
        similarity: similarityAnalysis,
        priority: prioritySuggestion,
        analyzedAt: FieldValue.serverTimestamp(),
        engine: 'AURA-Core-V2'
      },
      suggestedPriority: prioritySuggestion.priority
    });

    // Update user stats
    await db.collection('users').doc(userId).update({
      'stats.totalTasks': FieldValue.increment(1),
      'stats.lastTaskCreated': FieldValue.serverTimestamp()
    });

    console.log(`✅ Task ${taskId} analyzed successfully`);

    // Log warning if duplicates found
    if (similarityAnalysis.hasDuplicates) {
      console.log(`⚠️  Possible duplicate task detected for user ${userId}`);
    }

    return {
      success: true,
      taskId,
      hasDuplicates: similarityAnalysis.hasDuplicates
    };
  } catch (error) {
    console.error(`❌ Error analyzing task ${taskId}:`, error);

    // Update task with error info (don't fail the document creation)
    try {
      await snapshot.ref.update({
        aiSuggestions: {
          error: error.message,
          analyzedAt: FieldValue.serverTimestamp()
        }
      });
    } catch (updateError) {
      console.error('Failed to update task with error:', updateError);
    }

    // Don't throw - allow task creation to succeed
    return {
      success: false,
      error: error.message
    };
  }
});
