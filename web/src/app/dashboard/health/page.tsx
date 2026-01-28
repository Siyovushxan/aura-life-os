"use client";
import React, { useState, useEffect } from 'react';
import HistoryModal from '@/components/HistoryModal';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/context/AuthContext';
import { getHealthData, seedHealthData, updateHealthData, HealthData, subscribeToHealthData } from '@/services/healthService';
import { getFoodLog, FoodDayLog } from '@/services/foodService';
import { getDailyLog } from '@/services/dailyService';
import { getScheduledInsight } from '@/services/aiPersistenceService';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';
import { getLocalTodayStr } from '@/lib/dateUtils';

export default function HealthDashboard() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('health');
    }, []);

    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<HealthData | null>(null);
    const [foodData, setFoodData] = useState<FoodDayLog | null>(null);
    const [isArchived, setIsArchived] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Derived Body Battery
    const calculateBodyBatteryData = (health: HealthData) => {
        const sleepScore = health.sleep.score || 70;
        const steps = health.activity.steps || 0;
        const stress = health.vitals.stress || 20;
        const hydration = (health.hydration.current / (health.hydration.goal || 2500)) * 100;

        const sleepWeight = (sleepScore / 100) * 100;
        const activityTax = Math.min(30, steps / 400); // Max 30% drain from steps
        const stressTax = (stress / 100) * 40; // Max 40% drain from stress
        const hydrationBonus = Math.min(10, hydration / 10); // Max 10% bonus from water

        const battery = Math.max(5, Math.min(100, sleepWeight - activityTax - stressTax + hydrationBonus));

        return {
            total: Math.round(battery),
            breakdown: {
                sleep: Math.round(sleepScore),
                activity: Math.round(activityTax * 3.3), // Scaling for display
                stress: Math.round(stress), // Raw 0-100
                hydration: Math.round(Math.min(100, hydration))
            },
            impacts: {
                sleep: Math.round(sleepWeight),
                activity: Math.round(activityTax),
                stress: Math.round(stressTax),
                hydration: Math.round(hydrationBonus)
            }
        };
    };

    const getBatteryStatus = (val: number) => {
        if (val > 80) return t.health.batteryStatus.ready;
        if (val > 50) return t.health.batteryStatus.good;
        if (val > 20) return t.health.batteryStatus.tired;
        return t.health.batteryStatus.rest;
    };

    // V23: Real-time Data Subscription
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const todayStr = getLocalTodayStr();
        const isToday = selectedDate === todayStr;
        setIsArchived(!isToday);

        // First check if exists, if not seed it
        getHealthData(user.uid, selectedDate).then(doc => {
            if (!doc) {
                seedHealthData(user.uid, selectedDate);
            }
        });

        // Fetch Food Data for Calorie calculation
        getFoodLog(user.uid, selectedDate).then(log => setFoodData(log));

        const unsub = subscribeToHealthData(user.uid, selectedDate, (doc) => {
            setData(doc);
            setLoading(false);
        });

        return () => unsub();
    }, [user, selectedDate]);


    const updateHydration = async (amount: number) => {
        if (!user || !data || isArchived) return;
        const newCurrent = Math.max(0, Math.min(data.hydration.current + amount, data.hydration.goal + 1000));
        const updatedData = { ...data, hydration: { ...data.hydration, current: newCurrent } };
        setData(updatedData);
        updateHealthData(user.uid, selectedDate, { hydration: updatedData.hydration });
    };

    const addWater = () => updateHydration(250);
    const removeWater = () => updateHydration(-250);

    const updateBiometrics = async (field: string, value: any) => {
        if (!user || !data || isArchived) return;
        const today = getLocalTodayStr();
        const newBiometrics = { ...(data.biometrics || { weight: 70, height: 175, goal: 'maintain' }), [field]: value };
        const updatedData = { ...data, biometrics: newBiometrics };
        setData(updatedData);
        await updateHealthData(user.uid, today, { biometrics: newBiometrics });
    };

    // Manual AI Trigger Logic
    const [aiInsight, setAiInsight] = useState<any | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const refreshInsight = async (force: boolean = true) => {
        if (!user || !data) return;
        setAiLoading(true);
        try {
            const batteryData = calculateBodyBatteryData(data);
            const context = {
                steps: data.activity.steps,
                sleepHours: data.sleep.score / 10,
                waterMl: data.hydration.current,
                stress: data.vitals.stress,
                mood: 'neutral',
                biometrics: data.biometrics,
                battery: {
                    total: batteryData.total,
                    impacts: batteryData.impacts
                }
            };
            const insight = await getScheduledInsight(user.uid, 'health', language, context, { force });
            if (insight) {
                setAiInsight(insight as any);
            }
        } catch (err) {
            console.error("Health AI Failed", err);
        } finally {
            setAiLoading(false);
        }
    };

    // Auto-load today's insight if it exists
    useEffect(() => {
        if (user && data && !aiInsight && !aiLoading) {
            refreshInsight(false); // Try to load without forcing generation first
        }
    }, [user, data]);

    const handleVoiceCommand = async (command: any) => {
        if (!user || !data || isArchived) return;
        const { action, data: cmdData } = command;

        if (action === 'log') {
            if (cmdData?.water) {
                await updateHydration(Number(cmdData.water));
            } else if (cmdData?.steps) {
                const newSteps = (data.activity.steps || 0) + Number(cmdData.steps);
                const updatedData = { ...data, activity: { ...data.activity, steps: newSteps } };
                setData(updatedData);
                await updateHealthData(user.uid, selectedDate, { activity: updatedData.activity });
            } else if (cmdData?.weight) {
                await updateBiometrics('weight', Number(cmdData.weight));
            } else if (cmdData?.mood) {
                const updatedData = { ...data, vitals: { ...data.vitals, mood: Number(cmdData.mood) } };
                setData(updatedData);
                await updateHealthData(user.uid, selectedDate, { vitals: updatedData.vitals });
            } else if (cmdData?.stress) {
                const updatedData = { ...data, vitals: { ...data.vitals, stress: Number(cmdData.stress) } };
                setData(updatedData);
                await updateHealthData(user.uid, selectedDate, { vitals: updatedData.vitals });
            }
        }
    };

    if (loading || !data) return <div className="text-white p-10">{t.health.loading}</div>;

    const batteryData = calculateBodyBatteryData(data);
    const currentBattery = batteryData.total;
    const hydrationPercentage = Math.min((data.hydration.current / data.hydration.goal) * 100, 100);
    const batteryRadius = 80;
    const batteryCircumference = 2 * Math.PI * batteryRadius;
    const batteryOffset = batteryCircumference - (currentBattery / 100) * batteryCircumference;

    return (
        <div className="space-y-8 animate-fade-in relative min-h-screen pb-20">
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={t.health.trends.title || "Health History"}>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-white font-bold mb-4">{t.health.trends.stepsHistory}</h4>
                        <div className="flex items-end gap-2 h-32 border-b border-white/10 pb-2">
                            {[5000, 7500, 10000, 8000, 6000, 11000, 9500].map((val, i) => (
                                <div key={i} className="flex-1 bg-aura-green/50 hover:bg-aura-green rounded-t-sm transition-all relative group" style={{ height: `${(val / 12000) * 100}%` }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-black px-1 rounded text-white opacity-0 group-hover:opacity-100">{val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>{t.health.days.mon}</span><span>{t.health.days.tue}</span><span>{t.health.days.wed}</span><span>{t.health.days.thu}</span><span>{t.health.days.fri}</span><span>{t.health.days.sat}</span><span>{t.health.days.sun}</span>
                        </div>
                    </div>
                </div>
            </HistoryModal>

            {/* HEADER */}
            <div className="relative p-10 mb-12 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-aura-green/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-aura-green/10 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-aura-green/10 border border-aura-green/20 text-[10px] font-black text-aura-green uppercase tracking-widest">Vitality Matrix v2.0</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-aura-green animate-pulse"></span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-black text-white tracking-tighter leading-none mb-4">
                            {t.health.title}
                        </h1>
                        <p className="text-gray-400 text-lg font-medium max-w-2xl leading-relaxed">
                            {t.health.subtitle || "Biometrik ko'rsatkichlaringiz va hayotiy energiyangizni tahlil qiling."}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 self-end xl:self-center bg-black/40 p-3 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                        <VoiceInput
                            module="health"
                            onCommand={handleVoiceCommand}
                            color="green"
                            className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                        />
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95"
                            title="History"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* AI HEALTH ADVISOR (Relocated to top for better visibility) */}
            <AiInsightSection
                onAnalyze={refreshInsight}
                isLoading={aiLoading}
                insight={aiInsight}
                title={t.health.aiAdvisor.title || "AI Health Advisor"}
                description="Bugungi ko'rsatkichlarga asoslangan sun'iy intellekt tahlili."
                buttonText={aiInsight ? 'Yangilash' : 'AI Tahlil'}
                color="green"
            />

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* BODY BATTERY */}
                <div className="lg:col-span-1 min-h-[450px] p-10 rounded-[3rem] bg-gradient-to-br from-black via-aura-green/5 to-black border border-white/5 relative flex flex-col items-center justify-center overflow-hidden shadow-[0_0_80px_rgba(0,255,148,0.03)]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-aura-green/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <h3 className="absolute top-10 left-10 text-xl font-display font-light text-white/90 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-aura-green/20 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,255,148,0.2)]">⚡</span>
                        {t.health.bodyBattery.title}
                    </h3>

                    <div className="flex flex-col items-center gap-10 w-full">
                        {/* Premium Circular Gauge */}
                        <div className="relative w-56 h-56 flex-shrink-0 flex items-center justify-center">
                            {/* Outer Glow Ring */}
                            <div className="absolute inset-0 rounded-full border border-aura-green/5 animate-pulse"></div>

                            <svg className="w-full h-full -rotate-90 transform">
                                {/* Background Ring */}
                                <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />

                                {/* Progress Ring */}
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="90"
                                    fill="none"
                                    stroke="url(#batteryGradient)"
                                    strokeWidth="12"
                                    strokeDasharray={2 * Math.PI * 90}
                                    strokeDashoffset={2 * Math.PI * 90 - (currentBattery / 100) * 2 * Math.PI * 90}
                                    strokeLinecap="round"
                                    className="transition-all duration-[1500ms] ease-out"
                                />

                                <defs>
                                    <linearGradient id="batteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00FF94" />
                                        <stop offset="100%" stopColor="#00E0FF" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-6xl font-display font-bold text-white tracking-tighter">
                                    {currentBattery}<span className="text-2xl text-aura-green ml-1">%</span>
                                </div>
                                <div className="mt-2 px-4 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] text-aura-green uppercase tracking-[0.2em] font-black">
                                    {getBatteryStatus(currentBattery)}
                                </div>
                            </div>
                        </div>

                        {/* Visual Calculation Breakdown */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            {[
                                { key: 'sleep', icon: '🌙', label: "Uyqu", impact: batteryData.impacts.sleep, color: 'border-aura-blue/20 bg-aura-blue/5', text: 'text-aura-blue', sign: '+' },
                                { key: 'activity', icon: '🏃', label: "Faollik", impact: batteryData.impacts.activity, color: 'border-aura-gold/20 bg-aura-gold/5', text: 'text-aura-gold', sign: '-' },
                                { key: 'stress', icon: '🤯', label: "Stress", impact: batteryData.impacts.stress, color: 'border-aura-red/20 bg-aura-red/5', text: 'text-aura-red', sign: '-' },
                                { key: 'hydration', icon: '💧', label: "Suv", impact: batteryData.impacts.hydration, color: 'border-aura-blue/20 bg-aura-blue/5', text: 'text-aura-blue', sign: '+' }
                            ].map((item) => (
                                <div key={item.key} className={`p-4 rounded-2xl border ${item.color} backdrop-blur-sm transition-transform hover:scale-[1.02]`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs">{item.icon}</span>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{item.label}</span>
                                    </div>
                                    <div className={`text-xl font-bold ${item.text}`}>
                                        {item.sign}{item.impact}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-aura-green">ℹ️</span>
                        <p className="text-[11px] text-gray-400 leading-tight">
                            {currentBattery > 70 ? t.health.bodyBattery.fullyCharged : t.health.bodyBattery.recharge}
                        </p>
                    </div>
                </div>

                {/* BIOMETRICS & AI ADVISOR */}
                <div className="lg:col-span-1 space-y-8">
                    {/* BIOMETRICS */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><span>👤</span> {t.health.biometrics.title}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="weight-input" className="text-xs text-gray-500">{t.health.biometrics.weight}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="weight-input"
                                        type="number"
                                        value={data.biometrics?.weight || 70}
                                        onChange={(e) => updateBiometrics('weight', Number(e.target.value))}
                                        disabled={isArchived}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-center focus:border-aura-green outline-none transition-all disabled:opacity-50"
                                        placeholder="70"
                                    />
                                    <span className="text-gray-500 text-xs">{t.health.biometrics.unitKg}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="height-input" className="text-xs text-gray-500">{t.health.biometrics.height}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="height-input"
                                        type="number"
                                        value={data.biometrics?.height || 175}
                                        onChange={(e) => updateBiometrics('height', Number(e.target.value))}
                                        disabled={isArchived}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-center focus:border-aura-green outline-none transition-all disabled:opacity-50"
                                        placeholder="175"
                                    />
                                    <span className="text-gray-500 text-xs">{t.health.biometrics.unitCm}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">{t.health.biometrics.goal}</label>
                            <select
                                aria-label={t.health.biometrics.goalLabel || "Goal"}
                                value={data.biometrics?.goal || 'maintain'}
                                onChange={(e) => updateBiometrics('goal', e.target.value)}
                                disabled={isArchived}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-aura-green outline-none cursor-pointer hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                <option value="lose" className="bg-black">{t.health.biometrics.lose}</option>
                                <option value="gain" className="bg-black">{t.health.biometrics.gain}</option>
                                <option value="maintain" className="bg-black">{t.health.biometrics.maintain}</option>
                            </select>
                        </div>
                    </div>



                    {/* VITALS STACK (Moved here to fill space) */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Heart Rate */}
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><span>❤️</span> {t.health.vitals.title}</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-3xl font-black text-white">{data.vitals.heartRate} <span className="text-xs font-normal text-gray-500 block">{t.health.vitals.heartRateUnit}</span></div>
                                    <div className="w-8 h-8 rounded-full bg-aura-red/10 flex items-center justify-center text-sm group-hover:bg-aura-red/20 transition-colors pointer-events-none">
                                        📊
                                    </div>
                                </div>
                            </div>

                            {/* Calorie Balance (New) */}
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><span>🔥</span> Energy</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                        <span>In</span>
                                        <span className="text-aura-green font-bold">+{foodData?.summary.calories.current || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                        <span>Out</span>
                                        <span className="text-aura-red font-bold">-{data.activity.calories}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden flex">
                                        <div className="h-full bg-aura-green" style={{ width: `${Math.min(100, ((foodData?.summary.calories.current || 0) / 2500) * 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><span>🌙</span> {t.health.trends.sleepQuality}</div>
                                <div className="text-2xl font-black text-white">{data.sleep.score} <span className="text-xs font-normal text-gray-500">{t.health.sleep.unit}</span></div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><span>🤯</span> {t.health.vitals.stressTitle}</div>
                                <div className="text-2xl font-black text-white">{data.vitals.stress}/100</div>
                            </div>
                        </div>
                    </div>
                </div>




                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* HYDRATION */}
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-aura-blue/20 to-black border border-aura-blue/30 flex flex-col items-center">
                        <h3 className="w-full text-left text-lg font-bold text-white mb-6">💧 {t.health.hydration.title}</h3>
                        <div className="text-5xl font-bold text-white mb-2">{data.hydration.current} <span className="text-xl text-aura-blue">{t.health.hydration.unit}</span></div>
                        <p className="text-gray-500 text-sm mb-6">{t.health.hydration.goal}: {data.hydration.goal} {t.health.hydration.unit}</p>
                        <div className="flex gap-6 items-center">
                            <button onClick={removeWater} disabled={isArchived} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold">-</button>
                            <div className="w-16 h-32 border-2 border-white/20 rounded-2xl relative overflow-hidden bg-black/40 shadow-inner">
                                <div className="absolute bottom-0 left-0 w-full bg-aura-blue transition-all duration-700" style={{ height: `${hydrationPercentage}%` }}></div>
                            </div>
                            <button onClick={addWater} disabled={isArchived} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold">+</button>
                        </div>
                    </div>

                    {/* ACTIVITY */}
                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-8 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-aura-gold/5 blur-[50px] rounded-full"></div>
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="58" fill="none" stroke="#222" strokeWidth="8" />
                                <circle cx="50%" cy="50%" r="58" fill="none" stroke="#F5A623" strokeWidth="8" strokeDasharray="364" strokeDashoffset={364 - (364 * Math.min(data.activity.steps / data.activity.goal, 1))} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👞</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-3xl font-black text-white">{data.activity.steps.toLocaleString()}</div>
                            <div className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t.health.activity.stepsToday}</div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex gap-6">
                                <div><span className="block text-lg font-bold text-white">{data.activity.calories}</span><span className="text-[10px] text-gray-500 font-bold uppercase">{t.health.activity.kcal}</span></div>
                                <div><span className="block text-lg font-bold text-white">{data.activity.distance}</span><span className="text-[10px] text-gray-500 font-bold uppercase">{t.health.activity.dist}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
