"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ButterflyEffectWidget from '@/components/ButterflyEffectWidget';
import SmartOnboarding from '@/components/dashboard/SmartOnboarding';
import HistoryModal from '@/components/HistoryModal';
import VoiceInput from '@/components/VoiceInput';
import { getLocalTodayStr } from '@/lib/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { FinanceOverview, seedFinanceData } from '@/services/financeService';
import { HealthData, seedHealthData } from '@/services/healthService';
import { FoodDayLog, seedFoodData } from '@/services/foodService';
import { InterestsData, seedInterestsData } from '@/services/interestsService';
import { FamilyMember } from '@/services/familyService';
import { checkAndArchivePreviousDays } from '@/services/dailyService';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { getDailyInsight } from '@/lib/cloudFunctions';
import AlertModal from '@/components/AlertModal';

// NEW: Correlation Engine
import {
    aggregateAllData,
    analyzeCorrelations,
    calculateButterflyScore,
    Correlation,
    ButterflyScoreData
} from '@/services/correlationService';
import { getRecentLogs, DailyLog, createOrUpdateDailyLog } from '@/services/dailyService';

export default function Dashboard() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();

    // Data State
    const [finance, setFinance] = useState<FinanceOverview | null>(null);
    const [health, setHealth] = useState<HealthData | null>(null);
    const [food, setFood] = useState<FoodDayLog | null>(null);
    const [interests, setInterests] = useState<InterestsData | null>(null);
    const [familyAlert, setFamilyAlert] = useState<boolean>(false);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

    // NEW: Correlation State
    const [correlations, setCorrelations] = useState<Correlation[]>([]);
    const [butterflyScore, setButterflyScore] = useState<ButterflyScoreData | null>(null);
    // NEW: Real History & Focus State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // NEW: Real History & Focus State
    const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
    // UI State
    const [time, setTime] = useState<Date | null>(null);
    const [stressLevel] = useState(30);

    interface AIInsight {
        title?: string;
        emoji?: string;
        insight: string;
    }

    const [aiInsight, setAiInsight] = useState<string | AIInsight>(t.home.analyzing);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);

    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const triggerAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    // Voice Command Hook
    // const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceCommand(); // REMOVED

    // const handleVoiceClick = async () => { // REMOVED
    //     if (isRecording) {
    //         const result = await stopRecording();
    //         if (result?.intent) {
    //             console.log("Voice Intent:", result.intent);
    //             triggerAlert("AURA AI", `Buyruq: ${JSON.stringify(result.intent.action)} - Modul: ${result.intent.module}`, "info");
    //             // TODO: Actual routing/state update based on intent
    //         }
    //     } else {
    //         await startRecording();
    //     }
    // };


    // HISTORY LOGIC
    useEffect(() => {
        if (!user) return;
        getRecentLogs(user.uid).then(setHistoryLogs);
    }, [user, isHistoryOpen]); // Refetch when modal opens to ensure fresh data


    // Fetch AI Insight from Cloud Functions
    const fetchAIInsight = async () => {
        if (!user) return;

        console.log("AI Tahlil: Boshlandi", { finance: !!finance, health: !!health });

        if (!finance || !health) {
            setAiInsight(t.home.need_more_data);
            return;
        }

        setIsLoadingInsight(true);
        try {
            console.log("AI Tahlil: Vazifalarni tekshirish...");
            const tasksSnapshot = await getDocs(
                query(collection(db, `users/${user.uid}/tasks`), where('status', '==', 'completed'))
            );

            const pendingSnapshot = await getDocs(
                query(collection(db, `users/${user.uid}/tasks`), where('status', '==', 'active'))
            );

            console.log("AI Tahlil: To'liq ma'lumotlar to'plandi, cloud function chaqirilmoqda...");

            // Pass comprehensive module data
            const insight = await getDailyInsight({
                finance: {
                    totalBalance: finance.totalBalance || 0,
                    monthlyIncome: finance.monthlyIncome || 0,
                    monthlySpent: finance.monthlySpent || 0,
                    savingsRate: finance.monthlyIncome > 0
                        ? ((finance.monthlyIncome - finance.monthlySpent) / finance.monthlyIncome) * 100
                        : 0
                },
                health: {
                    bodyBattery: health.bodyBattery?.current || 50,
                    sleepDuration: health.sleep?.duration || '7h',
                    heartRate: health.vitals?.heartRate || null,
                    steps: health.activity?.steps || 0
                },
                food: food ? {
                    caloriesConsumed: food.summary?.calories?.current || 0,
                    caloriesGoal: food.summary?.calories?.goal || 2000,
                    proteinConsumed: food.summary?.protein?.current || 0,
                    proteinGoal: food.summary?.protein?.goal || 50
                } : null,
                interests: interests ? {
                    totalActive: interests.stats?.totalActive || 0,
                    learningStreak: interests.stats?.learningStreak || 0
                } : null,
                tasks: {
                    completed: tasksSnapshot.size,
                    pending: pendingSnapshot.size
                },
                family: {
                    memberCount: familyMembers.length
                },
                stressLevel: stressLevel
            });

            console.log("AI Tahlil: Muvaffaqiyatli!", { insight });

            // Extract string from object if needed
            // const insightText = typeof insight === 'string' ? insight : (insight?.insight || JSON.stringify(insight));

            if (insight) {
                // Store the whole object if possible, or formatted string
                // Actually, let's store the object in state, but state is currently string | object?
                // The state definition is: const [aiInsight, setAiInsight] = useState(t.home.analyzing);
                // Typescript infers string. Let's cast or just set it.
                // To avoid TS issues without changing 100 lines, let's keep it as is but assume component handles it.
                setAiInsight(insight);
            }
        } catch (error) {
            console.error('AI Insight Error:', error);
            setAiInsight(t.home.analysis_error);
        } finally {
            setIsLoadingInsight(false);
        }
    };

    const handleSaveLog = async () => {
        if (!user || !aiInsight || aiInsight === t.home.analyzing || aiInsight === "AURA AI tizim tayyor") return;

        try {
            const today = getLocalTodayStr();
            // Handle AIInsight type (object or string) for logging
            const logInsight = typeof aiInsight === 'string' ? aiInsight : JSON.stringify(aiInsight);
            await createOrUpdateDailyLog(user.uid, today, {
                aiInsight: logInsight
            });
            triggerAlert("Muvaffaqiyatli", "Tahlil tarixingizga saqlandi.", "success");
            // Refresh history
            getRecentLogs(user.uid).then(setHistoryLogs);
        } catch (error) {
            console.error("Save Log Error:", error);
            triggerAlert("Xatolik", "Saqlashda muammo yuz berdi.", "danger");
        }
    };

    // Initial Data Load + Correlation Analysis
    useEffect(() => {
        if (!user) return;
        const loadDashboardData = async () => {
            const today = getLocalTodayStr();

            setIsAnalyzing(true);

            // NEW: Use aggregated data fetch
            const allData = await aggregateAllData(user.uid, today);

            // Seed missing data (Development convenience)
            if (!allData.finance) {
                const seeded = await seedFinanceData(user.uid);
                setFinance(seeded);
                allData.finance = seeded;
            } else {
                setFinance(allData.finance);
            }

            if (!allData.health) {
                const seeded = await seedHealthData(user.uid, today);
                setHealth(seeded);
                allData.health = seeded;
            } else {
                setHealth(allData.health);
            }

            if (!allData.food) {
                const seeded = await seedFoodData(user.uid, today);
                setFood(seeded);
                allData.food = seeded;
            } else {
                setFood(allData.food);
            }

            if (!allData.interests) {
                const seeded = await seedInterestsData(user.uid);
                setInterests(seeded);
                allData.interests = seeded;
            } else {
                setInterests(allData.interests);
            }

            if (allData.family) {
                setFamilyMembers(allData.family);
                // Determine Family Alert
                if (allData.family.some((m: FamilyMember) => m.status === 'Needs Approval')) {
                    setFamilyAlert(true);
                }
            }

            // NEW: Run Correlation Analysis
            const foundCorrelations = await analyzeCorrelations(user.uid, today);
            setCorrelations(foundCorrelations);

            // NEW: Calculate Butterfly Score
            const scoreData = calculateButterflyScore(allData);
            setButterflyScore(scoreData);

            setIsAnalyzing(false);

            // Auto-archive previous days
            checkAndArchivePreviousDays(user.uid);
        };

        loadDashboardData();
    }, [user]);

    // Fetch AI Insight after core data loads
    // REMOVED: Auto-fetch disabled per user request
    // useEffect(() => {
    //     if (finance && health && user && aiInsight === t.home.analyzing) {
    //         fetchAIInsight();
    //     }
    // }, [finance, health, user]);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Update AI Insight ONLY when language changes significantly
    // Removed the isLoadingInsight dependency to prevent auto-reset after fetch
    useEffect(() => {
        if (aiInsight === "AURA AI tizim tayyor" || aiInsight === "AURA AI is ready") {
            setAiInsight(t.home.analyzing);
        }
    }, [t.home.analyzing, aiInsight]);


    if (!time) return null;

    // Default values/Loading skeletons could be better, but for now safe checks
    const calories = food?.summary.calories.current ?? 0;

    // AI Onboarding Check
    const isNewUser = (finance?.totalBalance === 0) && (health?.bodyBattery.current === 100) && (interests?.stats.totalActive === 0);

    return (
        <div className="min-h-screen pb-20 transition-all duration-700">


            {/* NORMAL CONTENT */}
            <div className="space-y-8 transition-all duration-700 opacity-100 scale-100">

                {/* BACKGROUND AURA */}
                <div className={`fixed top-0 left-0 w-full h-full -z-10 bg-black`}>
                    <div className={`absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[120px] animate-[pulse_10s_infinite] transition-colors duration-1000 bg-aura-cyan/10`}></div>
                    <div className={`absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full blur-[120px] animate-[pulse_15s_infinite] delay-1000 transition-colors duration-1000 bg-aura-purple/10`}></div>
                </div>

                {/* FLOATING HEADER */}
                <header className="sticky top-6 z-40 mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full p-2 pl-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20">
                        {/* Left: Brand */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-aura-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse"></div>
                                <span className="font-display font-black text-xl tracking-tighter text-white">AURA</span>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
                            <div className={`w-full bg-white/5 border rounded-full px-8 py-2.5 flex items-center justify-center gap-3 group transition-all cursor-default overflow-hidden ${aiInsight !== t.home.analyzing ? 'border-aura-cyan/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLoadingInsight ? 'bg-aura-purple animate-bounce' : (aiInsight !== t.home.analyzing ? 'bg-aura-cyan' : 'bg-aura-purple')}`}></div>
                                <div className={`text-xs font-medium tracking-wide transition-colors flex items-center gap-3 ${aiInsight !== t.home.analyzing ? 'text-white' : 'text-gray-300'} truncate`}>
                                    {isLoadingInsight ? (
                                        <span>{t.home.analyzing || "Tizim tahlil qilinmoqda..."}</span>
                                    ) : (
                                        aiInsight && aiInsight !== t.home.analyzing ? (
                                            typeof aiInsight === 'object' && (aiInsight as AIInsight).insight ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">{(aiInsight as AIInsight).emoji || '✨'}</span>
                                                    <span className="font-bold text-aura-cyan">{(aiInsight as AIInsight).title}:</span>
                                                    <span className="truncate max-w-[300px]">{(aiInsight as AIInsight).insight}</span>
                                                </span>
                                            ) : (
                                                <span>{typeof aiInsight === 'string' ? aiInsight : JSON.stringify(aiInsight)}</span>
                                            )
                                        ) : (
                                            <span>&quot;AURA AI tizim tayyor&quot;</span>
                                        )
                                    )}

                                    {aiInsight && aiInsight !== t.home.analyzing && aiInsight !== "AURA AI tizim tayyor" && !isLoadingInsight && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSaveLog(); }}
                                            className="ml-1 p-1.5 rounded-lg bg-aura-cyan/20 border border-aura-cyan/30 text-[10px] hover:bg-aura-cyan/40 hover:scale-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] group/save shrink-0"
                                            title="Saqlash"
                                        >
                                            <span className="group-hover/save:animate-bounce inline-block">💾</span>
                                        </button>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3 pr-2">
                            {/* AI Manual Trigger */}
                            <VoiceInput
                                module="tasks" // Dashboard command context
                                onCommand={(command) => {
                                    triggerAlert("AURA AI", command.confirmation_message || "Buyruq qabul qilindi", "info");
                                    if (command.action === 'wrong_module' && command.suggested_module) {
                                        window.location.href = `/dashboard/${command.suggested_module}`;
                                    }
                                }}
                                color="cyan"
                                className="mr-2"
                            />

                            <button
                                onClick={fetchAIInsight}
                                disabled={isLoadingInsight}
                                className={`px-6 py-2.5 rounded-full border font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-2 group relative overflow-hidden ${isLoadingInsight ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-white text-black hover:bg-aura-cyan hover:text-black border-transparent shadow-[0_10px_20px_rgba(0,0,0,0.2)]'}`}
                            >
                                <span className={`${isLoadingInsight ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                    {isLoadingInsight ? '⚙️' : '✨'}
                                </span>
                                <span>{isLoadingInsight ? 'Tahlil...' : 'AI Tahlil'}</span>
                            </button>

                            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
                                title="Xulosalar Tarixi"
                            >
                                <span className="text-lg leading-none mt-0.5">📜</span>
                            </button>

                            <Link
                                href="/dashboard/focus"
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-aura-purple hover:bg-aura-purple/20 hover:border-aura-purple/30 transition-all relative group shadow-lg"
                                title="Fokus Sessiyasi"
                            >
                                <span className="absolute inset-0 rounded-full bg-aura-purple/20 animate-pulse group-hover:animate-none opacity-50"></span>
                                <span className="relative z-10 text-lg leading-none">🧠</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* DASHBOARD CONTENT */}
                <main className="max-w-7xl mx-auto px-4 lg:px-8 space-y-12">
                    <HistoryModal
                        isOpen={isHistoryOpen}
                        onClose={() => setIsHistoryOpen(false)}
                        title="Kunlik AI Xulosalari"
                    >
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {historyLogs.length > 0 ? (
                                <div className="grid gap-6">
                                    {historyLogs.map((log) => (
                                        <div key={log.id} className="group relative p-8 rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 hover:border-aura-cyan/30 transition-all hover:bg-white/[0.08] shadow-2xl overflow-hidden flex flex-col gap-4">
                                            {/* Glow effect */}
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-aura-cyan/5 blur-[80px] -mr-10 -mt-10 group-hover:bg-aura-cyan/10 transition-all"></div>

                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex flex-col">
                                                    <span className="text-aura-cyan/60 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                                                        {new Date(log.date).toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <h4 className="text-white font-bold text-lg">AI Kundalik Taklif</h4>
                                                </div>
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                    <span className="text-xl">✨</span>
                                                </div>
                                            </div>

                                            {log.aiInsight && (
                                                <div className="relative z-10 p-5 rounded-3xl bg-black/40 border border-white/5">
                                                    {typeof log.aiInsight === 'object' && (log.aiInsight as AIInsight).title ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl">{(log.aiInsight as AIInsight).emoji}</span>
                                                                <h5 className="text-aura-cyan font-bold">{(log.aiInsight as AIInsight).title}</h5>
                                                            </div>
                                                            <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                                                {(log.aiInsight as AIInsight).insight}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                                            {typeof log.aiInsight === 'string' ? log.aiInsight : JSON.stringify(log.aiInsight)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-3 mt-2 relative z-10">
                                                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-colors ${log.finance ? 'bg-aura-green/10 border-aura-green/20' : 'bg-white/5 border-white/5 opacity-40'}`}>
                                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Hamyon</span>
                                                    <span className={`${log.finance ? 'text-aura-green' : 'text-gray-600'} text-xs font-bold`}>{log.finance ? '✓' : '—'}</span>
                                                </div>
                                                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-colors ${log.health ? 'bg-aura-cyan/10 border-aura-cyan/20' : 'bg-white/5 border-white/5 opacity-40'}`}>
                                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Vitality</span>
                                                    <span className={`${log.health ? 'text-aura-cyan' : 'text-gray-600'} text-xs font-bold`}>{log.health ? '✓' : '—'}</span>
                                                </div>
                                                <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-colors ${log.food ? 'bg-aura-purple/10 border-aura-purple/20' : 'bg-white/5 border-white/5 opacity-40'}`}>
                                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Nutrition</span>
                                                    <span className={`${log.food ? 'text-aura-purple' : 'text-gray-600'} text-xs font-bold`}>{log.food ? '✓' : '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                                    <div className="text-5xl">📜</div>
                                    <div className="space-y-1">
                                        <h4 className="text-white font-bold">Hozircha xulosalar yo&apos;q</h4>
                                        <p className="text-xs text-gray-500 max-w-[200px]">AI tahlil tugmasini bosing va ilk xulosangizni oling.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </HistoryModal>

                    {/* 1. ONBOARDING & BUTTERFLY EFFECT */}
                    <SmartOnboarding userName={user?.displayName || 'User'} isNewUser={isNewUser} />

                    <div className="relative group perspective-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-aura-cyan/5 to-aura-purple/5 blur-3xl -z-10"></div>
                        <ButterflyEffectWidget
                            correlations={correlations}
                            butterflyScore={butterflyScore}
                            isAnalyzing={isAnalyzing}
                        />
                    </div>

                    {/* 2. BENTO GRID WIDGETS */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

                        {/* WEALTH PULSE (Large Card) */}
                        <Link href="/dashboard/finance/" className="md:col-span-4 relative group p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 hover:border-aura-gold/50 transition-all overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-aura-gold/5 blur-[50px] rounded-full group-hover:bg-aura-gold/10 transition-all"></div>

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 rounded-lg bg-aura-gold/10 text-aura-gold">💰</div>
                                    <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest">{t.home.wealthPulse}</h3>
                                </div>
                                <div className="text-4xl font-display font-medium text-white tracking-tight">
                                    ${(finance?.totalBalance || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-aura-green mt-1 font-mono flex items-center gap-1">
                                    <span>▲</span> 2.4% {t.home.thisMonth}
                                </div>
                            </div>

                            <div className="w-full h-16 mt-4 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-aura-gold/20 to-aura-gold/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </Link>

                        {/* VITALITY (Body Battery) */}
                        <Link href="/dashboard/health/" className="md:col-span-4 relative group p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 hover:border-aura-green/50 transition-all overflow-hidden flex items-center justify-between">
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-aura-green/5 blur-[50px] rounded-full group-hover:bg-aura-green/10 transition-all"></div>

                            <div className="flex flex-col justify-between h-full z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 rounded-lg bg-aura-green/10 text-aura-green">⚡</div>
                                        <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest">{t.home.vitality}</h3>
                                    </div>
                                    <div className="text-3xl font-display font-medium text-white">
                                        {!health ? '--' : `${health.bodyBattery?.current || 0}%`}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {!health ? 'Ma\'lumotlar kutilmoqda' : (health.bodyBattery?.status || t.home.batteryStatus.ready)}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 tracking-wider">HR</div>
                                        <div className="text-white font-bold">{health?.vitals?.heartRate || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 tracking-wider">Sleep</div>
                                        <div className="text-white font-bold">{health?.sleep?.duration || '0h'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Circular Indicator */}
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="50%" cy="50%" r="56" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <circle cx="50%" cy="50%" r="56" fill="none" stroke="#00FF94" strokeWidth="8" strokeDasharray="351" strokeDashoffset={351 - (351 * (health?.bodyBattery?.current || 0) / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                                    <span className="text-2xl">🔋</span>
                                </div>
                            </div>
                        </Link>

                        {/* FAMILY HUB */}
                        <Link href="/dashboard/family/" className="md:col-span-4 relative group p-8 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-aura-blue/50 transition-all overflow-hidden flex flex-col justify-between shadow-2xl">
                            {/* Modern decorative glow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-aura-blue/10 blur-[80px] group-hover:bg-aura-blue/20 transition-all"></div>
                            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-aura-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-aura-blue/10 flex items-center justify-center text-aura-blue">👨‍👩‍👧‍👦</div>
                                    <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">{t.home.familyHub}</h3>
                                </div>
                                {familyAlert && (
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-red opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-aura-red"></span>
                                    </span>
                                )}
                            </div>

                            <div className="mt-8 relative z-10">
                                <div className="flex -space-x-3 mb-6">
                                    {familyMembers.length > 0 ? (
                                        familyMembers.slice(0, 4).map((member) => (
                                            <div key={member.id} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-lg overflow-hidden ring-2 ring-white/5 shadow-xl transition-transform hover:-translate-y-1" title={member.name}>
                                                {member.avatar ? <Image src={member.avatar} alt={member.name} width={40} height={40} className="w-full h-full object-cover" /> : (
                                                    <span>{member.role === 'Father' ? '👨' : member.role === 'Mother' ? '👩' : member.role === 'Son' ? '👦' : member.role === 'Daughter' ? '👧' : '👤'}</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-lg shadow-xl ring-2 ring-white/5 opacity-50">
                                            <span>👤</span>
                                        </div>
                                    )}
                                    {familyMembers.length > 4 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-black bg-white/5 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white shadow-xl ring-2 ring-white/5">
                                            +{familyMembers.length - 4}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group-hover:bg-white/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-bold group-hover:text-aura-blue transition-colors">
                                                {familyMembers.length > 0 ? `${familyMembers.length} ta oila a'zosi` : 'Oila markazi'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-medium">
                                                {familyAlert ? 'Diqqat: Yangi xabarlar' : 'Barcha a\'zolar xavfsiz'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* SAFETY / LIVENESS STATUS */}
                        <div
                            onClick={() => router.push('/dashboard/liveness/')}
                            className="md:col-span-4 cursor-pointer relative group p-8 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-aura-red/50 transition-all overflow-hidden flex flex-col justify-between shadow-2xl"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-aura-red/10 blur-[80px] group-hover:bg-aura-red/20 transition-all"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-aura-cyan/10 flex items-center justify-center text-aura-cyan animate-pulse">📡</div>
                                    <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">{t.liveness_section.title}</h3>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-aura-green/20 text-aura-green text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap">
                                    System Active
                                </div>
                            </div>

                            <div className="mt-8 relative z-10">
                                <p className="text-white text-sm font-medium leading-relaxed mb-4 italic">
                                    {`"${user?.displayName || (user?.email?.split('@')[0]) || 'Qadrdonim'}, ahvolingiz yaxshimi? Iltimos, tasdiqlang."`}
                                </p>
                                <p className="text-gray-400 text-[10px] font-light leading-relaxed mb-6 uppercase tracking-wider">
                                    {t.liveness_section.countdown_prefix} <span className="text-white font-bold font-mono">23:54:12</span>
                                </p>

                                <div className="flex gap-3">
                                    <div
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            // Call the mock update
                                            try {
                                                const { updateLastActive } = await import('@/services/familyService');
                                                if (user?.uid) await updateLastActive(user.uid);
                                                alert("Tizim: Xabaringiz qabul qilindi. Hammasi joyida!");
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                        className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group-hover:bg-aura-cyan/10 transition-all cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-bold group-hover:text-aura-cyan transition-colors">I&apos;m OK</span>
                                        </div>
                                        <span className="px-3 py-1 bg-aura-cyan text-black rounded-lg text-[9px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all">
                                            Check-in
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(t.liveness_section.panic_confirm)) {
                                                alert("Emergency protocols initiated.");
                                            }
                                        }}
                                        className="px-4 bg-aura-red/20 border border-aura-red/30 text-aura-red rounded-2xl text-[9px] font-black uppercase tracking-tighter hover:bg-aura-red hover:text-white transition-all"
                                    >
                                        {t.liveness_section.panic_alert}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* STRATEGIC LEGACY WIDGET (Fills the gap) */}
                        <div className="md:col-span-4 relative group p-8 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-aura-gold/50 transition-all overflow-hidden flex flex-col justify-between shadow-2xl">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-aura-gold/10 blur-[80px] group-hover:bg-aura-gold/20 transition-all"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-aura-gold/10 flex items-center justify-center text-aura-gold">🏛️</div>
                                    <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Strategik Meros</h3>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-aura-gold/20 text-aura-gold text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap">
                                    Legacy Bridge
                                </div>
                            </div>

                            <div className="mt-8 relative z-10">
                                <p className="text-gray-400 text-xs font-light leading-relaxed mb-6">
                                    Kelajak avlodlar uchun raqamli ko&apos;prik va xavfsizlik merosini barpo etish rejasi.
                                </p>

                                <button className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-aura-gold hover:text-black hover:border-aura-gold transition-all duration-300">
                                    Merosni Ko&apos;rish
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ROW 2: TIME, WEATHER, FOOD, INTERESTS */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">

                        {/* CHRONOS & ATMOSPHERE (Combined Split) */}
                        <div className="md:col-span-6 grid grid-cols-2 gap-4">
                            <div className="p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 flex flex-col justify-center items-center text-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.2em] mb-2">{t.home.chronos}</h3>
                                <div className="text-5xl font-display font-medium text-white tracking-tighter tabular-nums">
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-aura-purple mt-2 font-mono uppercase">
                                    {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 flex flex-col justify-center items-center text-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-aura-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-4xl mb-2">☀️</div>
                                <div className="text-3xl font-display font-medium text-white">24°</div>
                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{t.home.clearSky}</div>
                            </div>
                        </div>

                        {/* NUTRITION */}
                        <Link href="/dashboard/food/" className="md:col-span-3 p-8 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-aura-green/50 transition-all relative group flex flex-col justify-between overflow-hidden shadow-2xl">
                            {/* Modern decorative glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-aura-green/10 blur-3xl group-hover:bg-aura-green/20 transition-all"></div>

                            <div className="flex items-center justify-between relative z-10">
                                <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">{t.home.nutrition}</h3>
                                <div className="w-8 h-8 rounded-xl bg-aura-green/10 flex items-center justify-center text-aura-green text-sm">🥗</div>
                            </div>

                            <div className="relative z-10 mt-6 mb-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-display font-bold text-white tracking-tight">{calories}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">kcal</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wider">Fuel your evolution</p>
                            </div>

                            <div className="relative z-10 mt-4 space-y-4">
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-aura-green/50 to-aura-green transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,148,0.3)]"
                                        style={{ width: `${Math.min(100, (calories / (food?.summary?.calories?.goal || 2000)) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-tight font-mono">Protein</span>
                                        <span className="text-sm font-bold text-white">{food?.summary?.protein?.current || 0}g</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-tight font-mono">Goal</span>
                                        <span className="text-sm font-bold text-white">{food?.summary?.calories?.goal || 2200}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* INTERESTS */}
                        <Link href="/dashboard/interests/" className="md:col-span-3 p-8 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 hover:border-aura-purple/50 transition-all relative group flex flex-col justify-between overflow-hidden shadow-2xl">
                            {/* Modern decorative glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-aura-purple/10 blur-3xl group-hover:bg-aura-purple/20 transition-all"></div>

                            <div className="flex items-center justify-between relative z-10">
                                <h3 className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">{t.home.hobbies}</h3>
                                <div className="w-8 h-8 rounded-xl bg-aura-purple/10 flex items-center justify-center text-aura-purple">🎨</div>
                            </div>

                            <div className="relative z-10 mt-6 mb-2">
                                <h4 className="text-xl font-bold text-white leading-tight max-w-[150px] group-hover:text-aura-purple transition-colors">
                                    {t.interests.discoverNew}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wider">Expand your aura</p>
                            </div>

                            <div className="flex items-center justify-between relative z-10 mt-4 pt-4 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-black bg-gray-800 flex items-center justify-center text-[10px]">
                                            {i === 1 ? '🎸' : i === 2 ? '📸' : '🧘'}
                                        </div>
                                    ))}
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 group-hover:bg-aura-purple/20 group-hover:border-aura-purple/30 transition-all">
                                    <span className="text-[10px] font-bold text-white">+{interests?.stats?.totalActive || 0}</span>
                                    <span className="text-aura-purple">→</span>
                                </div>
                            </div>
                        </Link>
                    </div >

                </main >
            </div >

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div >
    );
}
