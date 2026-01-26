import {
    getFinanceOverview,
    FinanceOverview
} from './financeService';
import {
    getHealthData,
    HealthData
} from './healthService';
import {
    getFoodLog,
    FoodDayLog
} from './foodService';
import {
    getInterestsData,
    InterestsData
} from './interestsService';
import {
    getMindData
} from './mindService';
import {
    getTasksByDate
} from './tasksService';
import {
    getFocusHistory
} from './focusService';
import {
    getFamilyMembers
} from './familyService';
import { s } from 'framer-motion/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Correlation {
    id: string;
    type: 'positive' | 'negative' | 'neutral';
    modules: [string, string]; // e.g., ["Health", "Tasks"]
    insight: string; // Legacy/Fallback
    insightKey?: string; // e.g., 'sleepProductivityNegative'
    confidence: number; // 0-1
    action?: string; // Legacy/Fallback
    actionKey?: string; // e.g., 'sleep'
    priority: 'high' | 'medium' | 'low';
    metrics: {
        source: { module: string; metric: string; value: number | string };
        target: { module: string; metric: string; value: number | string };
    };
}

export interface ButterflyScoreData {
    score: number; // 0-100
    state: 'disconnected' | 'fragmented' | 'harmonic';
    moduleScores: Record<string, number>;
    trend: 'improving' | 'declining' | 'stable';
}

interface ModuleData {
    finance?: FinanceOverview | null;
    health?: HealthData | null;
    food?: FoodDayLog | null;
    interests?: InterestsData | null;
    mind?: any;
    tasks?: any[];
    focus?: any[];
    family?: any[];
}

// ============================================================================
// AGGREGATION
// ============================================================================

/**
 * Fetch all module data for a given user and date
 */
export async function aggregateAllData(
    userId: string,
    date: string = new Date().toISOString().split('T')[0]
): Promise<ModuleData> {
    try {
        const [finance, health, food, interests, mind, tasks, focus, family] = await Promise.all([
            getFinanceOverview(userId),
            getHealthData(userId, date),
            getFoodLog(userId, date),
            getInterestsData(userId),
            getMindData(userId),
            getTasksByDate(userId, date),
            getFocusHistory(userId, 20),
            getFamilyMembers(userId)
        ]);

        return { finance, health, food, interests, mind, tasks, focus, family };
    } catch (error) {
        console.error('Error aggregating module data:', error);
        return {};
    }
}

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

/**
 * Analyze cross-module correlations and return ranked insights
 */
export async function analyzeCorrelations(
    userId: string,
    date: string = new Date().toISOString().split('T')[0]
): Promise<Correlation[]> {
    const data = await aggregateAllData(userId, date);
    const correlations: Correlation[] = [];

    // CORRELATION 1: Sleep → Tasks Productivity
    if (data.health && data.tasks) {
        const sleepDuration = parseSleepHours(data.health.sleep?.duration);
        const completedTasks = data.tasks.filter((t: any) => t.status === 'completed').length;
        const totalTasks = data.tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        if (sleepDuration < 6 && completionRate < 40) {
            correlations.push({
                id: 'sleep-tasks-negative',
                type: 'negative',
                modules: ['Health', 'Tasks'],
                insight: `Poor sleep (${sleepDuration}h) → Low productivity (${Math.round(completionRate)}% tasks completed)`,
                insightKey: 'sleepProductivityNegative',
                confidence: 0.85,
                action: "Improve sleep quality tonight to boost tomorrow's focus",
                actionKey: 'sleep',
                priority: 'high',
                metrics: {
                    source: { module: 'Health', metric: 'Sleep Duration', value: `${sleepDuration}h` },
                    target: { module: 'Tasks', metric: 'Completion Rate', value: `${Math.round(completionRate)}%` }
                }
            });
        } else if (sleepDuration >= 7 && completionRate > 70) {
            correlations.push({
                id: 'sleep-tasks-positive',
                type: 'positive',
                modules: ['Health', 'Tasks'],
                insight: `Great sleep (${sleepDuration}h) → High productivity (${Math.round(completionRate)}% tasks completed)`,
                insightKey: 'sleepProductivityPositive',
                confidence: 0.82,
                priority: 'low',
                metrics: {
                    source: { module: 'Health', metric: 'Sleep Duration', value: `${sleepDuration}h` },
                    target: { module: 'Tasks', metric: 'Completion Rate', value: `${Math.round(completionRate)}%` }
                }
            });
        }
    }

    // CORRELATION 2: Finance Stress → Mind State
    if (data.finance && data.mind) {
        const balance = data.finance.totalBalance || 0;
        const monthlySpent = data.finance.monthlySpent || 0;
        const monthlyIncome = data.finance.monthlyIncome || 1;
        const spendingRatio = monthlySpent / monthlyIncome;
        const moodScore = data.mind.moodHistory?.[0]?.score || 50;

        if ((balance < 0 || spendingRatio > 0.9) && moodScore < 40) {
            correlations.push({
                id: 'finance-mind-negative',
                type: 'negative',
                modules: ['Finance', 'Mind'],
                insight: `Financial stress (${balance < 0 ? 'negative balance' : `${Math.round(spendingRatio * 100)}% of income spent`}) → Low mood (${moodScore}/100)`,
                insightKey: 'financeMindNegative',
                confidence: 0.78,
                action: 'Review budget and create emergency fund plan',
                actionKey: 'finance',
                priority: 'high',
                metrics: {
                    source: { module: 'Finance', metric: 'Balance', value: balance < 0 ? 'negative' : `${Math.round(spendingRatio * 100)}%` },
                    target: { module: 'Mind', metric: 'Mood Score', value: moodScore }
                }
            });
        }
    }

    // CORRELATION 3: Nutrition → Health Battery
    if (data.food && data.health) {
        const caloriesRatio = (data.food.summary.calories.current / data.food.summary.calories.goal) * 100;
        const proteinRatio = (data.food.summary.protein.current / data.food.summary.protein.goal) * 100;
        const bodyBattery = data.health.bodyBattery.current || 50;

        if (caloriesRatio < 70 && bodyBattery < 40) {
            correlations.push({
                id: 'food-health-negative',
                type: 'negative',
                modules: ['Food', 'Health'],
                insight: `Undereating (${Math.round(caloriesRatio)}% of calorie target) → Low energy (${bodyBattery}% body battery)`,
                insightKey: 'foodHealthNegative',
                confidence: 0.72,
                action: 'Add a protein-rich snack to restore energy',
                actionKey: 'food',
                priority: 'medium',
                metrics: {
                    source: { module: 'Food', metric: 'Calorie Intake', value: `${Math.round(caloriesRatio)}%` },
                    target: { module: 'Health', metric: 'Body Battery', value: bodyBattery }
                }
            });
        } else if (proteinRatio > 90 && bodyBattery > 70) {
            correlations.push({
                id: 'food-health-positive',
                type: 'positive',
                modules: ['Food', 'Health'],
                insight: `Excellent nutrition (${Math.round(proteinRatio)}% protein target) → High energy (${bodyBattery}% body battery)`,
                insightKey: 'foodHealthPositive',
                confidence: 0.75,
                priority: 'low',
                metrics: {
                    source: { module: 'Food', metric: 'Protein Intake', value: `${Math.round(proteinRatio)}%` },
                    target: { module: 'Health', metric: 'Body Battery', value: bodyBattery }
                }
            });
        }
    }

    // CORRELATION 4: Focus Time → Learning Streak (Interests)
    if (data.focus && data.interests) {
        const focusMinutesToday = data.focus.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
        const learningStreak = data.interests.stats.learningStreak || 0;

        if (focusMinutesToday > 60 && learningStreak > 5) {
            correlations.push({
                id: 'focus-interests-positive',
                type: 'positive',
                modules: ['Focus', 'Interests'],
                insight: `Deep work (${focusMinutesToday} min today) → Strong learning habit (${learningStreak} day streak)`,
                insightKey: 'focusInterestsPositive',
                confidence: 0.80,
                priority: 'low',
                metrics: {
                    source: { module: 'Focus', metric: 'Minutes Today', value: focusMinutesToday },
                    target: { module: 'Interests', metric: 'Learning Streak', value: learningStreak }
                }
            });
        }
    }

    // CORRELATION 5: Family Engagement → Mind Wellbeing
    if (data.family && data.mind) {
        const activeFamilyMembers = data.family.length;
        const moodScore = data.mind.moodHistory?.[0]?.score || 50;

        if (activeFamilyMembers >= 2 && moodScore > 60) {
            correlations.push({
                id: 'family-mind-positive',
                type: 'positive',
                modules: ['Family', 'Mind'],
                insight: `Active family hub (${activeFamilyMembers} members) → Positive mood (${moodScore}/100)`,
                insightKey: 'familyMindPositive',
                confidence: 0.68,
                priority: 'low',
                metrics: {
                    source: { module: 'Family', metric: 'Active Members', value: activeFamilyMembers },
                    target: { module: 'Mind', metric: 'Mood Score', value: moodScore }
                }
            });
        }
    }

    // Sort by priority and confidence
    return correlations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const scoreA = priorityWeight[a.priority] * a.confidence;
        const scoreB = priorityWeight[b.priority] * b.confidence;
        return scoreB - scoreA;
    });
}

// ============================================================================
// BUTTERFLY SCORE
// ============================================================================

/**
 * Calculate overall life harmony score (0-100)
 */
export function calculateButterflyScore(data: ModuleData): ButterflyScoreData {
    const moduleScores: Record<string, number> = {};

    // Finance: 0-100 based on balance, debt ratio, savings rate
    if (data.finance) {
        const balance = data.finance.totalBalance || 0;
        const spent = data.finance.monthlySpent || 0;
        const income = data.finance.monthlyIncome || 1;
        const savingsRate = Math.max(0, (income - spent) / income);

        let financeScore = 50; // baseline
        if (balance > 0) financeScore += 20;
        if (balance > income * 3) financeScore += 10; // 3-month emergency fund
        financeScore += savingsRate * 20;

        moduleScores.finance = Math.min(100, financeScore);
    }

    // Health: 0-100 based on body battery, sleep, activity
    if (data.health) {
        const battery = data.health.bodyBattery.current || 50;
        const sleepHours = parseSleepHours(data.health.sleep?.duration);
        const sleepScore = Math.min(100, (sleepHours / 8) * 50);

        moduleScores.health = Math.round((battery + sleepScore) / 2);
    }

    // Food: 0-100 based on calorie/macro targets
    if (data.food) {
        const calGoal = data.food.summary?.calories?.goal || 2000;
        const protGoal = data.food.summary?.protein?.goal || 50;
        const calorieRatio = Math.min(1.2, (data.food.summary?.calories?.current || 0) / calGoal);
        const proteinRatio = Math.min(1.2, (data.food.summary?.protein?.current || 0) / protGoal);

        moduleScores.food = Math.round(((calorieRatio + proteinRatio) / 2.4) * 100);
    }

    // Mind: 0-100 based on latest mood score
    if (data.mind?.moodHistory?.[0]) {
        moduleScores.mind = data.mind.moodHistory[0].score;
    }

    // Tasks: 0-100 based on completion rate
    if (data.tasks && data.tasks.length > 0) {
        const completed = data.tasks.filter((t: any) => t.status === 'completed').length;
        moduleScores.tasks = Math.round((completed / data.tasks.length) * 100);
    }

    // Interests: 0-100 based on streak and active hobbies
    if (data.interests) {
        const streakScore = Math.min(100, data.interests.stats.learningStreak * 5);
        const activeScore = Math.min(100, data.interests.stats.totalActive * 10);
        moduleScores.interests = Math.round((streakScore + activeScore) / 2);
    }

    // Focus: 0-100 based on daily focus time (target: 120 min)
    if (data.focus) {
        const totalMinutes = data.focus.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
        moduleScores.focus = Math.min(100, Math.round((totalMinutes / 120) * 100));
    }

    // Family: 0-100 based on active members
    if (data.family) {
        moduleScores.family = Math.min(100, data.family.length * 25);
    }

    // Calculate weighted average (penalize missing modules)
    const rawScores = Object.values(moduleScores).filter(s => !isNaN(s));
    const avgScore = rawScores.length > 0
        ? Math.round(rawScores.reduce((sum, s) => sum + s, 0) / rawScores.length)
        : 0;

    // Apply interconnectedness penalty: If variance is high, reduce score
    const variance = rawScores.length > 0 ? calculateVariance(rawScores) : 0;
    const balancePenalty = Math.min(20, variance / 5); // Max 20 point penalty
    let finalScore = Math.max(0, Math.round(avgScore - balancePenalty));

    // Final NaN check
    if (isNaN(finalScore)) finalScore = 0;

    // Determine state
    let state: 'disconnected' | 'fragmented' | 'harmonic';
    if (finalScore >= 60) state = 'harmonic';
    else if (finalScore >= 30) state = 'fragmented';
    else state = 'disconnected';

    return {
        score: finalScore,
        state,
        moduleScores,
        trend: 'stable' // TODO: Calculate from historical data
    };
}

// ============================================================================
// HELPERS
// ============================================================================

function parseSleepHours(duration?: string): number {
    if (!duration) return 7;
    const match = duration.match(/(\d+)h/);
    return match ? parseInt(match[1]) : 7;
}

function calculateVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length);
}
