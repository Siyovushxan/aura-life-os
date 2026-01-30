import { analyzeWithGroq, parseGroqJSON, analyzeImage as groqAnalyzeImage } from './groqClient.js';


/**
 * Analyze financial data and provide insights
 * @param {object} context - Financial context (transactions, budgets, totals)
 * @param {string} language - Target language
 * @returns {Promise<object>} Financial insight
 */
export async function analyzeFinance(context, language = 'uz', user = {}) {
  const {
    monthlyIncome,
    monthlySpent,
    incomeBudget,
    expenseBudget,
    totalBalance,
    topSpendingCategory,
    debtTotal,
    creditTotal,
    depositTotal,
    occupation
  } = context;

  const planId = user.subscription?.planId || 'AURA PERSONAL';
  const isLegacy = planId === 'AURA LEGACY';

  // Precision Mode: Calculate detailed metrics before prompting AI
  const burnRate = monthlyIncome > 0 ? ((monthlySpent / monthlyIncome) * 100).toFixed(1) : 0;
  const savingsRate = monthlyIncome > 0 ? (((monthlyIncome - monthlySpent) / monthlyIncome) * 100).toFixed(1) : 0;
  const runway = monthlySpent > 0 ? (totalBalance / monthlySpent).toFixed(1) : 0;
  const isZeroData = monthlyIncome === 0 && monthlySpent === 0;

  let prompt;

  if (isZeroData) {
    prompt = `
      ROLE: AURA Financial Guardian.
      TASK: Guide the user to set up their financial baseline.
      CONTEXT: The user has not logged any income or expenses yet.
      Language: ${language}

      OUTPUT STRICT JSON:
      {
          "title": "AURA Financial Base",
          "insight": "Welcome to your Wealth Command Center. To generate a strategy, I need data.",
          "roadmap": ["Step 1: Log your monthly income source", "Step 2: Track your first expense today", "Step 3: Define a savings goal"],
          "potentialSavings": "N/A",
          "optimization": "Start by logging one transaction to activate the neural financial engine.",
          "vitalityScore": 50,
          "emoji": "🏁",
          "priority": "high"
      }
      `;
  } else {
    prompt = `
      ROLE: You are AURA, the user's personal Financial Strategist and Wealth Guardian.
      TONE: Sharp, protective, strategically proactive, and high-performance.
      TASK: Analyze the user's financial architecture and provide a deep-layer strategic roadmap.
      SUBSCRIPTION TIER: ${planId} ${isLegacy ? '(ULTIMATE ACCESS - Provide advanced investment & diversification logic)' : '(STANDARD ACCESS)'}
      
      CURRENT ARCHITECTURE:
      - Total Assets (Liquidity): ${totalBalance} (Deposits: ${depositTotal})
      - Income Dynamics: ${monthlyIncome} (Target: ${incomeBudget || 'N/A'})
      - Burn Rate (Expense): ${monthlySpent} (Limit: ${expenseBudget || 'N/A'}) -> Burn Rate is ${burnRate}% of Income.
      - Savings Rate: ${savingsRate}%
      - Runway: ${runway} months of survival at current burn rate.
      - Total Liabilities: Debt ${debtTotal}, Credits ${creditTotal}
      - Primary Leak: ${topSpendingCategory || 'Analyzing...'}
      - User Strategy: ${occupation || 'Professional Growth'}
      
      STRATEGIC OBJECTIVES:
      1. Analyze "Burn Rate" efficiency (${burnRate}%). Is it sustainable (<80%)?
      2. Identify "Wealth Leaks" (Top Spending vs Income).
      3. Strategic Mitigation: Propose exact steps to reduce liabilities or optimize deposits.
      4. ${isLegacy ? 'ADVANCED: Propose diversification into assets, hedging strategies, or compound interest optimization.' : 'Personal Savings: Suggest immediate behavioral shifts to increase liquidity.'}
      
      Language: ${language}
      
      Return STRICT JSON ONLY:
      {
          "title": "AURA Financial Roadmap",
          "insight": "Deep analysis (2 sentences) explaining the current wealth trajectory and core friction point. Use precise numbers (e.g. 'You are burning ${burnRate}% of income').",
          "roadmap": ["Step 1: Immediate Action (e.g. Cut 'Dining Out' by 10%)", "Step 2: Structural Change", "Step 3: Long-term Growth"],
          "potentialSavings": "Estimated monthly savings if protocol is followed (e.g. 500k UZS)",
          "optimization": "One short sentence of holistic financial optimization (e.g. 'Diversify liquidity to hedge against inflation.')",
          "vitalityScore": 0-100,
          "emoji": "🛡️",
          "priority": "high|medium|low"
      }
      `;
  }

  const response = await analyzeWithGroq(prompt, 'AURA Financial Strategist. Output JSON.', 'finance');
  return parseGroqJSON(response) || { title: 'Moliya Bo\'yicha Maslahat', insight: 'Xarajatlaringizni kuzatishda davom eting.', emoji: '💰', priority: 'low' };
}

/**
 * Generate health feedback based on daily data
 * @param {object} context - Health data (steps, sleep, etc.)
 * @param {string} language - Target language
 * @returns {Promise<object>} Health feedback
 */
export async function analyzeHealth(context, language = 'uz', user = {}) {
  const { steps, sleepHours, waterMl, stress, biometrics, battery } = context;
  const planId = user.subscription?.planId || 'trial';

  // New User Detection
  const isNewUser = steps === 0 && sleepHours === 0 && waterMl === 0 && !battery?.total;

  let prompt;

  if (isNewUser) {
    prompt = `
      ROLE: AURA Welcome Guide.
      TASK: Warmly welcome the new user and guide them to their first health win.
      CONTEXT: The user has just joined and has no health data yet. Do NOT give negative feedback.
      Language: ${language}

      OUTPUT STRICT JSON:
      {
        "title": "AURA Activation",
        "text": "Welcome to AURA. Your biological optimization journey starts now. Let's calibrate your baseline.",
        "protocol": ["Action 1: Drink 200ml of water and log it", "Action 2: Take 500 steps to activate sensors", "Action 3: Set your sleep goal"],
        "vitalityScore": 100,
        "emoji": "🌱",
        "status": "ready"
      }
      `;
  } else {
    prompt = `
      ROLE: You are AURA, a high-performance Vitality Strategist and Biological Systems Optimizer.
      TONE: Sharp, technical, data-driven, and highly strategic.
      TASK: Perform a deep-layer biological analysis of the user's current metrics.
      SUBSCRIPTION: ${planId}
      
      CORE BIO-METRICS:
      - Movement Architecture: ${steps} steps (Target: 10,000 steps)
      - Recovery Protocol: ${sleepHours}h sleep
      - Hydration Level: ${waterMl}ml
      - Autonomic Stress Index: ${stress}/100 
      - Calculated Body Battery: ${battery?.total || 'N/A'}%
      - Baseline Biometrics: ${JSON.stringify(biometrics || {})}
      
      ANALYSIS PARAMETERS (PERFORMANCE VS RECOVERY SYNERGY):
      1. Evaluate "Metabolic Flux": How movement (Activity) is supported by hydration.
      2. Evaluate "Neural Efficiency": How stress levels correlate with sleep quality.
      3. Identify "Systemic Friction": Explain exactly where the user is leaking energy (e.g., "High cortisol detected due to dehydration-stress coupling").
      
      Language: ${language}
      
      Return STRICT JSON ONLY: 
      { 
        "title": "AURA Vitality Protocol",
        "text": "2 sentences of advanced bio-logic explaining the current health trajectory (e.g., 'Metabolic lag detected due to dehydration-stress coupling. Recovery systems are currently under-optimized.').",
        "protocol": ["Step 1: Bio-Action (e.g., 500ml water with electrolytes)", "Step 2: Movement (e.g., 5 min mobility flow)", "Step 3: Recovery (e.g., 2 min box breathing)"],
        "vitalityScore": 0-100,
        "emoji": "🧬",
        "status": "ready|recovery|warning"
      }
      `;
  }

  const response = await analyzeWithGroq(prompt, 'AURA Vitality Coach. Output JSON.', 'health');
  return parseGroqJSON(response) || { title: 'Salomatlik Holati', text: 'Suv ichishni unutmang va yetarlicha uxlang.', emoji: '💧', status: 'ready' };
}

/**
 * Analyze and suggest interests based on duality mode
 * @param {object} context - User context and current window
 * @param {string} language - Target language
 * @returns {Promise<object>} Recommendations
 */
export async function analyzeInterests(context, language = 'uz', user = {}) {
  const { window, currentInterests, hobbies, healthGoal, habitStats } = context;
  const interests = currentInterests || hobbies || [];
  const timeLabel = window === 'morning' ? 'Ertalab (Growth/Focus)' : window === 'lunch' ? 'Tushlik (Productivity)' : 'Kechqurun (Relaxation/Reflection)';

  const prompt = `
  ROLE: You are AURA, the user's Growth Mentor.
  TASK: Suggest TWO specific actions for the current ${timeLabel} window.
  MODE: Duality (1 Growth / 1 Correction).
  
  USER PROFILE:
  - Current Interests: ${Array.isArray(interests) ? interests.join(', ') : 'None'}
  - Health Goal: ${healthGoal || 'Improve general performance'}
  - Habits Logged Today: ${Array.isArray(habitStats) ? habitStats.join(', ') : 'None'}
  
  Language: ${language}
  
  Return STRICT JSON:
  { 
      "recommendations": [
          { "type": "growth", "recommendation": "Name", "reason": "Why this advances your interests.", "emoji": "🚀" },
          { "type": "correction", "recommendation": "Name", "reason": "Specific advice to stay on track.", "emoji": "🛡️" }
      ],
      "optimization": "One short, highly specific sentence of growth advice based on the user's current interests.",
      "vitalityScore": 0-100
  }`;

  const response = await analyzeWithGroq(prompt, 'AURA Mentor. Duality Mode. Output JSON.', 'interests');
  return parseGroqJSON(response) || { recommendations: [] };
}

/**
 * Analyze mood and provide mental health insight
 * @param {object} context - Mood and focus data
 * @param {string} language - Target language
 * @returns {Promise<object>} Mind insight
 */
export async function analyzeMind(context, language = 'uz', user = {}) {
  const { recentMood, moodHistory, focusMinutes } = context;

  const prompt = `
  ROLE: You are AURA, the user's Emotional Intelligence (EQ) guide.
  TONE: Calm, insightful, and stoic.
  TASK: Analyze the mood trajectory and provide a centering thought.
  SUBSCRIPTION: ${user.subscription?.planId || 'trial'}
  
  PSYCHOMETRICS:
  - Current Mood: ${recentMood}/100
  - Trajectory: ${moodHistory.join(' -> ')}
  - Deep Focus: ${focusMinutes} min
  
  Language: ${language}
  
  Return STRICT JSON:
  {
      "title": "AURA Clarity",
      "insight": "1-2 sentence profound analysis.",
      "emoji": "🧘",
      "exercise": "Optional 30-second breathing or mental technique"
  }
  `;

  const response = await analyzeWithGroq(prompt, 'AURA EQ Guide. Output JSON.', 'mind');
  return parseGroqJSON(response) || { title: 'Zehn Holati', insight: 'Nafas olishda davom eting.', emoji: '🧠' };
}

/**
 * Analyze food images (OCR & Calorie estimation)
 * @param {string} base64Image - Base64 encoded image
 * @param {object} userContext - Biometrics and goals
 * @param {string} language - Target language
 * @returns {Promise<object>} Food analysis
 */
/**
 * Analyze food images (OCR & Calorie estimation)
 * @param {string} base64Image - Base64 encoded image
 * @param {object} userContext - Biometrics and goals
 * @param {string} language - Target language
 * @returns {Promise<object>} Food analysis
 */
export async function analyzeFoodImage(base64Image, userContext, language = 'uz', user = {}) {
  const { weight, height, goal } = userContext?.biometrics || {};
  const planId = user.subscription?.planId || 'trial';

  const question = `
  ROLE: You are AURA, the user's high-performance Nutrition Logic & Biological Systems Optimizer.
  TASK: Perform a deep-layer metabolic scan of the provided food image.
  
  USER BIOLOGICAL CONTEXT:
  - Weight: ${weight}kg
  - Height: ${height}cm
  - Goal: ${goal}
  - Target Language: ${language}
  - Subscription Tier: ${planId}

  ANALYSIS PROTOCOL:
  1. IDENTIFY: Detect precisely what food items are in the image.
  2. ESTIMATE: Calculate Calories, Protein(g), Carbs(g), and Fat(g) with high precision based on portion size estimation.
  3. AURA STRATEGY: Provide 2 sentences of advanced nutritional logic. 
     - CRITICAL: Never return one-word answers like 'Go', 'Yes', or 'No'.
     - ADVICE FOCUS: Explain the metabolic impact of this specific meal on the user's goal (${goal}).
     - FEW-SHOT EXAMPLE 1 (Goal: Weight Loss, Food: Burger): "Burgherdagi yuqori kaloriya va to'yingan yog'lar vazn yo'qotish tezligini sekinlashtirishi mumkin. Ovqatlanishni kletchatka (salat) bilan boshlash glyukemik yukni kamaytiradi."
  
  Return STRICT JSON ONLY: 
  { 
    "name": "Exact Food Name", 
    "calories": number, 
    "protein": number, 
    "carbs": number, 
    "fat": number,
    "advice": "Detailed AURA Strategic Advice in ${language} (2-3 sentences)",
    "insight": "One sentence about long-term impact on vitality.",
    "optimization": "A quick hack to improve this specific meal (e.g., 'Add green tea to boost metabolic response').",
    "vitalityScore": 0-100,
    "emoji": "🥗"
  }`;

  try {
    const response = await groqAnalyzeImage(base64Image, question, 'food');
    const parsed = parseGroqJSON(response);

    if (parsed) {
      // Ensure all required fields exist
      return {
        ...parsed,
        success: true,
        insight: parsed.insight || parsed.advice,
        optimization: parsed.optimization || parsed.advice
      };
    }
    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('Food Analysis Error:', error);
    return {
      success: false,
      name: 'Aniqlashda xatolik',
      calories: 0,
      advice: `Xatolik: ${error.message}. Iltimos rasm tiniqrot ekanligini tekshiring.`
    };
  }
}


/**
 * Parse natural language command into structured intent
 * @param {object} data - { command: string, currentModule: string }
 * @param {string} language - Target language
 * @returns {Promise<object>} Structured intent
 */
export async function parseCommand(data, language = 'uz') {
  const { command, currentModule = 'home' } = data;

  const prompt = `
    ROLE: AURA Assistant Commander.
    TASK: Translate the user's voice command into a structured protocol for the AURA system.
    
    USER COMMAND: "${command}"
    CURRENT MODULE CONTEXT: "${currentModule}"
    TARGET LANGUAGE: ${language}

    VALID MODULES:
    - tasks: Managing schedule, tasks, to-do lists.
    - finance: Tracking transactions, budgets, income, expenses.
    - health: Tracking water, steps, sleep, weight, stress.
    - food: Logging meals, calories, macro tracking.
    - mind: Focus sessions, mood tracking, meditation.
    - interests: Learning new things, hobbies, skills.
    - family: Managing family members, groups, requests.

    VALID ACTIONS:
    - add: For creating new items (tasks, transactions, meals, hobbies).
    - log: For logging metrics (water, steps, mood, weight).
    - navigate: For moving to a specific page.
    - wrong_module: Use this if the user wants to perform an action that belongs to a DIFFERENT module than the current context.
    - clarify: Use this if the information is too vague.

    SCHEMA RULES:
    1. If the command belongs to the CURRENT module, identify module, action, and data.
    2. If the command belongs to a DIFFERENT module, set action to "wrong_module" and "suggested_module" to the correct one.
    3. For "finance.add", data must include "amount", "category" (e.g., Ovqat), and "type" (expense/income). Use numbers for amount.
    4. For "tasks.add", data must include "title". Optional: "date" (YYYY-MM-DD), "time" (HH:mm), "priority" (high/medium/low).
    5. For "health.log", data can be "water" (ml), "steps" (count), "weight" (kg), "mood" (0-100), "stress" (0-100).
    6. For "food.log", data must include "meal" (e.g., tushlik) and "calories" (estimate if not provided).

    OUTPUT JSON FORMAT:
    {
        "module": "tasks|finance|health|food|mind|family|interests",
        "action": "add|log|navigate|wrong_module|clarify",
        "data": { ...protocol_fields },
        "suggested_module": "optional string for redirection",
        "confirmation_message": "A supportive, 1-sentence confirmation message in ${language}"
    }
    `;

  const response = await analyzeWithGroq(prompt, 'AURA Command Processor. Output JSON.', 'home');
  return parseGroqJSON(response) || { module: currentModule, action: 'clarify', confirmation_message: 'Kechirasiz, buyruqni tushunmadim. Qayta ayta olasizmi?' };
}

/**
 * Analyze genetic data for health risks
 * @param {object} data - { dnaData: string }
 * @param {string} language
 * @returns {Promise<object>} Genetic analysis
 */
export async function analyzeGenetics(data, language = 'uz') {
  const { dnaData } = data;

  const prompt = `
    ROLE: AURA Bio-Genetic Lab.
    TASK: Deep analysis of raw genomic data for personalized health optimization.
    DNA LOG: ${dnaData}
    LANGUAGE: ${language}

    Return STRICT JSON:
    {
        "riskFactors": [{"risk": "Name", "mitigation": "Step"}],
        "optimization": "Primary lifestyle shift predicted by genomic profile",
        "nutrigenomics": ["Suggested supplement/dietary adjustment"]
    }
    `;

  const response = await analyzeWithGroq(prompt, 'AURA Genetics Lab. Output JSON.', 'health');
  return parseGroqJSON(response) || { riskFactors: [], optimization: '', nutrigenomics: [] };
}

/**
 * Analyze family dynamics and provide parenting advice
 * @param {object} context - Family requests, members, screen time
 * @param {string} language - Target language
 * @returns {Promise<object>} Family insight
 */
export async function analyzeFamily(context, language = 'uz', user = {}) {
  const { requests, memberCount, pendingApprovals, finance, health, mind } = context;

  const prompt = `
  ROLE: You are AURA, a wise Family Counselor and Parenting Assistant.
  TONE: Warm, firm, and harmonizing.
  TASK: Analyze the family status AND cross-module data to provide deeply personalized advice.
  SUBSCRIPTION: ${user.subscription?.planId || 'trial'}
  
  FAMILY CONTEXT:
  - Total Members: ${memberCount}
  - Active Requests: ${requests}
  - Pending Member Approvals: ${pendingApprovals}

  CROSS-MODULE CONTEXT:
  - Finance: ${finance ? `Balance: ${finance.balance}` : 'No data'}
  - Health: ${health ? `Steps: ${health.steps}` : 'No data'}
  - Mind: ${mind ? `Recent Mood: ${mind.recentMood}` : 'No data'}
  
  Language: ${language}
  
  Return STRICT JSON:
  {
      "title": "AURA Family Harmony",
      "insight": "Advice on managing requests or spending quality time, referencing the cross-module situation if relevant (e.g. 'High spending? Cook at home together instead of eating out.').",
      "emoji": "👨‍👩‍👧‍👦",
      "optimization": "One short sentence of holistic optimization (e.g. 'Strengthen generational bonds through shared finance goals.')",
      "vitalityScore": 0-100,
      "action": "Suggested activity or decision"
  }
  `;

  const response = await analyzeWithGroq(prompt, 'AURA Family Counselor. Output JSON.', 'family');
  return parseGroqJSON(response) || { title: 'Oila Muhiti', insight: 'Oilaviy vaqtni qadrlang.', emoji: '🏡', optimization: 'Oila muloqotini saqlang.', vitalityScore: 85 };
}

/**
 * Analyze daily food log for nutritional advice
 * @param {object} context - Daily summary (calories, macros)
 * @param {string} language - Target language
 * @returns {Promise<object>} Nutrition insight
 */
export async function analyzeFoodLog(context, language = 'uz', user = {}) {
  const { calories, protein, carbs, fat, goalCalories } = context;

  const prompt = `
  ROLE: You are AURA, an expert Nutritionist and Dietitian.
  TONE: Educational, motivating, and precise.
  TASK: Analyze the user's daily nutrition intake.
  
  DATA:
  - Calories: ${calories}/${goalCalories}
  - Macros: P:${protein}g, C:${carbs}g, F:${fat}g
  
  Language: ${language}
  
  Return STRICT JSON:
  {
      "title": "AURA Nutrition Logic",
      "insight": "Specific feedback on macro balance or calorie intake.",
      "emoji": "🥗",
      "recommendation": "What to eat next or avoid."
  }
  `;

  const response = await analyzeWithGroq(prompt, 'AURA Nutritionist. Output JSON.', 'food');
  return parseGroqJSON(response) || { title: 'Taom Tahlili', insight: 'Balansni saqlang.', emoji: '⚖️' };
}

/**
 * Transcribe base64 audio to text
 * @param {string} base64Audio - Base64 encoded audio
 * @param {string} language - Target language
 * @returns {Promise<object>} Transcribed text
 */
import { transcribeAudio as groqTranscribe } from './groqClient.js';
import { Buffer } from 'buffer';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function transcribeAudio(data, language = 'uz') {
  const { base64Audio, module } = data;
  if (!base64Audio) throw new Error('No audio provided.');

  // For Groq API, we need to provide a real file object or a fetch file if not using multi-part
  // But groq-sdk can take a Buffer with a filename.
  // Actually, easiest is to write a temporary file.

  const tempFileName = `aura_voice_${Date.now()}.webm`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  const buffer = Buffer.from(base64Audio.split(',')[1] || base64Audio, 'base64');

  fs.writeFileSync(tempFilePath, buffer);

  try {
    // Passing filename help Groq handle the stream correctly
    const text = await groqTranscribe(fs.createReadStream(tempFilePath), language, module);
    console.log('[AURA Voice] Transcribed:', text);
    return { text };
  } catch (err) {
    console.error('[AURA Voice] Backend Error:', err.message);
    throw err;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        // ignore error
      }
    }
  }
}
