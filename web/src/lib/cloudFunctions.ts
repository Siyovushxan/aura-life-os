/**
 * Cloud Functions API Client
 * Provides methods to call AURA backend functions
 */

const PROJECT_ID = 'aura-f1d36';
const REGION = 'us-central1';
const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

const BASE_URL = IS_LOCAL && USE_EMULATOR
    ? `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`
    : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

import { callBackend } from "@/services/groqService";
const HEALTH_CHECK_URL = `${BASE_URL}/healthCheck`;

/**
 * Analyze task for duplicates and priority using GROQ AI
 * @param {string} taskTitle - New task title
 * @param {string[]} existingTasks - Array of existing task titles
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeTaskWithAI(taskTitle: string, existingTasks: string[] = []) {
    try {
        const data = await callBackend('analyzeTask', { taskTitle, existingTasks });
        if (data.success) {
            return data.analysis;
        }
        throw new Error(data.error || 'AI analysis failed');
    } catch (error) {
        console.error('AI Task Analysis Error:', error);
        return {
            hasDuplicates: false,
            similarTasks: [],
            suggestion: 'Tahlil amalga oshmadi',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get personalized daily insight
 * @param {object} userData - Comprehensive user data from all modules
 * @returns {Promise<string>} Daily insight text
 */
export async function getDailyInsight(userData: any) {
    try {
        const data = await callBackend('getDailyInsight', userData);
        if (data.success) {
            return data.insight;
        }
        throw new Error(data.error || 'Daily insight failed');
    } catch (error) {
        console.error('Daily Insight Error:', error);
        return 'Bugun ham ajoyib kun! Maqsadlaringizga erishish uchun harakat qiling.';
    }
}

/**
 * Check backend health status
 * @returns {Promise<object>} Health status
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${HEALTH_CHECK_URL}`);

        if (!response.ok) {
            throw new Error('Health check failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Health Check Error:', error);
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Subscribe to AI analysis results for a task
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {function} callback - Callback function for updates
 * @returns {function} Unsubscribe function
 */
export function subscribeToTaskAnalysis(userId: string, taskId: string, callback: (data: any) => void) {
    // This will be implemented with Firestore real-time listener
    // For now, return a no-op unsubscribe
    return () => { };
}

/**
 * Get auth token for authenticated requests
 * @returns {Promise<string>} Auth token
 */
async function getAuthToken() {
    // Implement based on your auth system
    // For now, return empty string
    return '';
}
