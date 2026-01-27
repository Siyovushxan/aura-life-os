/**
 * Advanced Correlation Analysis for AURA Mobile (Masterpiece Edition)
 * Ported from web logic for 100% fidelity.
 */

export function analyzeCorrelations(data) {
    const correlations = [];

    // 1. Sleep → Tasks Productivity
    if (data.sleep !== undefined && data.tasks !== undefined) {
        if (data.sleep < 6 && data.tasks > 5) {
            correlations.push({
                id: 'sleep-tasks-negative',
                type: 'negative',
                category1: 'Salomatlik',
                category2: 'Vazifalar',
                insight: `Kam uyqu (${data.sleep}s) → Unumdorlik xavfi (${data.tasks} vazifa kutilmoqda)`,
                confidence: 0.85,
                priority: 'high',
                modules: ['Health', 'Tasks']
            });
        }
    }

    // 2. Finance → Stress
    if (data.finance !== undefined && data.mood !== undefined) {
        if (data.finance < 1000000 && data.mood > 50) {
            correlations.push({
                id: 'finance-stress-negative',
                type: 'negative',
                category1: 'Moliya',
                category2: 'Asab tizimi',
                insight: `Past balans → Yuqori asabiy yuklanish (${data.mood}%)`,
                confidence: 0.78,
                priority: 'high',
                modules: ['Finance', 'Health']
            });
        }
    }

    // 3. Nutrition → Energy
    if (data.health && data.health > 80) {
        correlations.push({
            id: 'health-positive',
            type: 'positive',
            category1: 'Salomatlik',
            category2: 'Energiya',
            insight: 'Yuqori energiya va barqarorlik aniqlandi',
            confidence: 0.9,
            priority: 'low',
            modules: ['Health', 'Dashboard']
        });
    }

    return correlations;
}

export function calculateButterflyScore(data) {
    const moduleScores = {};

    // 1. Finance Score (0-100)
    if (data.finance !== undefined) {
        let finScore = 50;
        if (data.finance > 10000000) finScore += 30;
        else if (data.finance > 1000000) finScore += 10;
        else finScore -= 20;
        moduleScores.finance = Math.min(100, Math.max(0, finScore));
    }

    // 2. Health Score
    if (data.health !== undefined) {
        moduleScores.health = Math.min(100, data.health);
    }

    // 3. Tasks Score
    if (data.tasks !== undefined) {
        let taskScore = 100 - (data.tasks * 5);
        moduleScores.tasks = Math.min(100, Math.max(0, taskScore));
    }

    // Weighted Average
    const rawScores = Object.values(moduleScores);
    if (rawScores.length === 0) return { score: 75, state: 'harmonic', trend: 'stable' };

    const avgScore = Math.round(rawScores.reduce((a, b) => a + b, 0) / rawScores.length);

    // Balance Penalty (Variance)
    const variance = Math.sqrt(rawScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / rawScores.length);
    const balancePenalty = Math.min(20, variance / 2);

    let finalScore = Math.round(avgScore - balancePenalty);

    let state = 'harmonic';
    if (finalScore < 40) state = 'disconnected';
    else if (finalScore < 70) state = 'fragmented';

    return {
        score: Math.max(0, finalScore),
        state,
        trend: 'stable'
    };
}
