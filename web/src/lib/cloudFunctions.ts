/**
 * Cloud Functions API Client
 * Provides methods to call AURA backend functions
 */

// Use LOCAL Emulator URLs for development
const PROJECT_ID = 'aura-f1d36';
const REGION = 'us-central1';
const BASE_URL = `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`;

const ANALYZE_TASK_URL = `${BASE_URL}/analyzeTask`;
const GET_DAILY_INSIGHT_URL = `${BASE_URL}/getDailyInsight`;
const HEALTH_CHECK_URL = `${BASE_URL}/healthCheck`;

/**
 * Analyze task for duplicates and priority using GROQ AI
 * @param {string} taskTitle - New task title
 * @param {string[]} existingTasks - Array of existing task titles
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeTaskWithAI(taskTitle: string, existingTasks: string[] = []) {
    try {
        const response = await fetch(`${ANALYZE_TASK_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add auth token if needed
                // 'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                taskTitle,
                existingTasks,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI analysis failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.analysis;
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
export async function getDailyInsight(userData: {
    finance?: {
        totalBalance: number;
        monthlyIncome: number;
        monthlySpent: number;
        savingsRate: number;
    };
    health?: {
        bodyBattery: number;
        sleepDuration: string;
        heartRate: number | null;
        steps: number;
    };
    food?: {
        caloriesConsumed: number;
        caloriesGoal: number;
        proteinConsumed: number;
        proteinGoal: number;
    } | null;
    interests?: {
        totalActive: number;
        learningStreak: number;
    } | null;
    tasks?: {
        completed: number;
        pending: number;
    };
    family?: {
        memberCount: number;
    };
    stressLevel?: number;
}) {
    try {
        const response = await fetch(`${GET_DAILY_INSIGHT_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(`Daily insight failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.insight;
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
