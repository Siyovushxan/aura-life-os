import { analyzeWithGroq, parseGroqJSON } from './groqClient.js';

/**
 * Analyze if new task is similar to existing tasks
 * @param {string} newTask - New task title
 * @param {string[]} existingTasks - Array of existing task titles
 * @returns {Promise<object>} Similarity analysis
 */
export async function analyzeSimilarTasks(newTask, existingTasks) {
  if (!existingTasks || existingTasks.length === 0) {
    return {
      hasDuplicates: false,
      similarTasks: [],
      suggestion: 'No existing tasks to compare'
    };
  }

  const prompt = `
  ROLE: AURA Productivity Engine.
  TASK: Detect semantic overlap between a new entry and the active task list.
  
  NEW TASK: "${newTask}"
  
  EXISTING LIST:
  ${existingTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}
  
  Return STRICT JSON:
  {
    "hasDuplicates": boolean,
    "similarTasks": [indices of overlapping tasks],
    "suggestion": "Brief consolidation or differentiation advice"
  }
  `;

  const response = await analyzeWithGroq(
      prompt,
      'AURA Productivity Engine. Output JSON.',
      'tasks'
  );

  return parseGroqJSON(response) || {
    hasDuplicates: false,
    similarTasks: [],
    suggestion: 'Analysis failed.'
  };
}

/**
 * Suggest priority level for a task
 * @param {string} task - Task title
 * @param {object} context - Additional context (category, deadline, etc.)
 * @returns {Promise<object>} Priority suggestion
 */
export async function suggestPriority(task, context = {}) {
  const prompt = `
  ROLE: AURA Smart Prioritization.
  TASK: Determine the urgency/importance level for a new protocol.
  
  PROTOCOL: "${task}"
  CONTEXT: ${JSON.stringify(context, null, 2)}
  
  Return STRICT JSON:
  {
    "priority": "high|medium|low",
    "reasoning": "1-sentence strategic justification"
  }
  `;

  const response = await analyzeWithGroq(
      prompt,
      'AURA Smart Prioritization. Output JSON.',
      'tasks'
  );

  return parseGroqJSON(response) || {
    priority: 'medium',
    reasoning: 'Standard default protocol.'
  };
}

/**
 * Generate daily insights based on comprehensive user data
 * @param {object} userData - Complete user data from all modules
 * @param {string} language - Target language
 * @returns {Promise<object>} Personalized insight
 */
export async function generateDailyInsights(userData, language = 'uz') {
  const {
    finance = {},
    health = {},
    food = null,
    interests = null,
    tasks = {},
    family = {},
    stressLevel = 50
  } = userData;

  // Extract values with defaults
  const financeData = {
    balance: finance.totalBalance || 0,
    income: finance.monthlyIncome || 0,
    spent: finance.monthlySpent || 0,
    savingsRate: finance.savingsRate || 0
  };

  const healthData = {
    bodyBattery: health.bodyBattery || 50,
    sleep: health.sleepDuration || '7h',
    heartRate: health.heartRate || 'N/A',
    steps: health.steps || 0
  };

  const foodData = food ? {
    calories: `${food.caloriesConsumed || 0}/${food.caloriesGoal || 2000}`,
    protein: `${food.proteinConsumed || 0}g/${food.proteinGoal || 50}g`
  } : null;

  const interestsData = interests ? {
    active: interests.totalActive || 0,
    streak: interests.learningStreak || 0
  } : null;

  const tasksData = {
    completed: tasks.completed || 0,
    pending: tasks.pending || 0
  };

  const familyData = {
    members: family.memberCount || 0
  };

  const prompt = `
  ROLE: AURA Life OS - Holistic Life Analyst
  TASK: Analyze the user's complete life state across all modules and provide ONE highly specific, actionable recommendation.
  
  === FINANCIAL STATE ===
  - Balance: $${financeData.balance}
  - Monthly Income: $${financeData.income}
  - Monthly Spent: $${financeData.spent}
  - Savings Rate: ${financeData.savingsRate.toFixed(1)}%
  
  === HEALTH & VITALITY ===
  - Body Battery: ${healthData.bodyBattery}%
  - Sleep Duration: ${healthData.sleep}
  - Heart Rate: ${healthData.heartRate} bpm
  - Steps Today: ${healthData.steps}
  - Stress Level: ${stressLevel}/100
  
  ${foodData ? `=== NUTRITION ===
  - Calories: ${foodData.calories}
  - Protein: ${foodData.protein}
  ` : ''}
  
  === PRODUCTIVITY ===
  - Completed Tasks: ${tasksData.completed}
  - Pending Tasks: ${tasksData.pending}
  
  ${interestsData ? `=== LEARNING & GROWTH ===
  - Active Interests: ${interestsData.active}
  - Learning Streak: ${interestsData.streak} days
  ` : ''}
  
  === FAMILY & RELATIONSHIPS ===
  - Family Members: ${familyData.members}
  
  Language: ${language}
  
  CRITICAL ANALYSIS RULES:
  1. Identify the MOST CRITICAL issue or opportunity across ALL modules
  2. Look for cross-module correlations:
     - Low sleep + high spending = stress-driven purchases
     - Low body battery + many pending tasks = burnout risk
     - Good nutrition + high productivity = sustainable performance
     - Low savings rate + high stress = financial anxiety
  3. Provide ONE specific, actionable recommendation (max 15 words in ${language})
  4. Focus on the highest-impact intervention
  
  Return STRICT JSON:
  {
    "insight": "15 so'zdan kam, aniq va amaliy tavsiya. Eng muhim muammoni yoki imkoniyatni hal qilsin.",
    "emoji": "☀️"
  }
  `;

  const response = await analyzeWithGroq(
      prompt,
      'AURA Holistic Life Analyst. Output JSON.',
      'home'
  );

  return parseGroqJSON(response) || {
    title: 'AURA Kundalik Xulosa',
    insight: 'Vazifalarni bajarishda davom eting va salomatligingizga e\'tibor bering.',
    suggestion: 'Bugun asosiy vazifaga diqqat qarating.',
    emoji: '🎯'
  };
}
