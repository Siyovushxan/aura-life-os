"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HistoryModal from '@/components/HistoryModal';
import Modal from '@/components/Modal';
import VoiceInput from '@/components/VoiceInput';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getMindData, seedMindData, addMoodEntry, updateMindStats, MindData, MoodEntry, subscribeToMindData } from '@/services/mindService';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { getScheduledInsight } from '@/services/aiPersistenceService';
import AlertModal from '@/components/AlertModal';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { getLocalTodayStr } from '@/lib/dateUtils';

export default function MindDashboardContent() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    // Data State
    const [data, setData] = useState<MindData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const isToday = selectedDate === getLocalTodayStr();
    const isArchived = !isToday;
    const [dailyMoods, setDailyMoods] = useState<MoodEntry[]>([]);

    // Focus Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const searchParams = useSearchParams();
    const activeTask = searchParams.get('task');

    // Breathing State
    const [isBreathing, setIsBreathing] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'ready'>('ready');

    // Mood State
    const [moodLevel, setMoodLevel] = useState(50); // 0-100
    const [isZenMode, setIsZenMode] = useState(false); // Adaptive UI status
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [aiInsight, setAiInsight] = useState<{ title: string, insight: string, emoji: string } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

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

    // Command Handler
    const handleVoiceCommand = async (command: any) => {
        if (!user || !data || isArchived) return;
        console.log('Mind Voice Command:', command);

        const { action, data: cmdData } = command;

        if (action === 'log') {
            if (cmdData?.mood) {
                let newLevel = 50;
                if (typeof cmdData.mood === 'number') {
                    newLevel = cmdData.mood;
                } else {
                    const moodMap: Record<string, number> = {
                        'happy': 90, 'sad': 20, 'neutral': 50, 'stressed': 10, 'excited': 95, 'calm': 80,
                        'xursand': 90, 'xafa': 20, 'normal': 50, 'stress': 10, 'hayajonli': 95, ' xotirjam': 80
                    };
                    newLevel = moodMap[cmdData.mood.toLowerCase()] || 50;
                }
                setMoodLevel(newLevel);

                const entry: MoodEntry = {
                    date: new Date().toISOString(),
                    mood: typeof cmdData.mood === 'string' ? cmdData.mood : 'AI Log',
                    value: newLevel
                };
                const newHistory = [...data.moodHistory, entry];
                setData({ ...data, moodHistory: newHistory });
                await addMoodEntry(user.uid, entry);
            } else if (cmdData?.meditation || action === 'start') {
                setIsBreathing(true);
            }
        } else if (action === 'start') {
            const mins = Number(cmdData?.duration) || 25;
            setTimeLeft(mins * 60);
            setIsActive(true);
            setMode('focus');
        }
    }

    // V23: Real-time Data Subscription
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const unsub = subscribeToMindData(user.uid, (doc) => {
            if (doc) {
                setData(doc);
                setLoading(false);
            }
        });

        // Initial check for seeding
        getMindData(user.uid).then(doc => {
            if (!doc) {
                seedMindData(user.uid).then(newDoc => {
                    setData(newDoc);
                    setLoading(false);
                });
            } else {
                setData(doc); // Primary fallback if sub is slow
                setLoading(false);
            }
        });

        return () => unsub();
    }, [user?.uid]);

    // Filter logs for selected date
    useEffect(() => {
        if (!data) return;
        const relevantMoods = data.moodHistory.filter(m => {
            const mDate = m.date.startsWith('20') ? m.date.split('T')[0] : m.date; // handle ISO timestamp vs simple date
            return mDate === selectedDate;
        });
        setDailyMoods(relevantMoods);

        // If viewing past date, maybe set moodLevel to average of that day?
        if (relevantMoods.length > 0) {
            const avg = relevantMoods.reduce((acc, curr) => acc + curr.value, 0) / relevantMoods.length;
            setMoodLevel(Math.round(avg));
        }
    }, [data, selectedDate]);

    // Manual AI Trigger Logic
    const fetchInsight = async () => {
        if (!user || !data) return;
        setAiLoading(true);
        try {
            const insight = await getScheduledInsight(user.uid, 'mind', language, {
                moodHistory: data.moodHistory,
                focusMinutes: data.stats.focusMinutes,
                recentMood: moodLevel
            }, { force: true });

            if (insight) {
                setAiInsight({
                    title: insight.title,
                    insight: insight.insight,
                    emoji: insight.emoji
                });
            }
        } catch (err) {
            console.error("Mind AI Error:", err);
        } finally {
            setAiLoading(false);
        }
    };

    // Auto-fetch REMOVED.
    // useEffect(() => {
    //     fetchInsight();
    // }, [...]);

    // Adaptive UI Logic (PRD: Stress Mode)
    useEffect(() => {
        if (moodLevel < 30) {
            setIsZenMode(true);
        } else {
            setIsZenMode(false);
        }
    }, [moodLevel]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Timer finished, update stats
            if (mode === 'focus' && user && data) {
                const addedMinutes = 25; // Simple assumption for now
                const newStats = { ...data.stats, focusMinutes: data.stats.focusMinutes + addedMinutes };
                setData({ ...data, stats: newStats });
                updateMindStats(user.uid, newStats);
                // Play sound or notify?
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, user?.uid, data]);

    useEffect(() => {
        if (isBreathing || isZenMode) {
            // In Zen Mode, breathing is default guidance
            const cycle = () => {
                setBreathPhase('inhale');
                setTimeout(() => setBreathPhase('hold'), 4000);
                setTimeout(() => setBreathPhase('exhale'), 11000);
            };
            cycle();
            const interval = setInterval(cycle, 19000);
            return () => clearInterval(interval);
        } else {
            setBreathPhase('ready');
        }
    }, [isBreathing, isZenMode]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLogMood = async () => {
        if (!user || !data) return;
        const moodType = moodLevel > 70 ? 'happy' : moodLevel > 40 ? 'neutral' : 'stressed';
        const entry: MoodEntry = {
            date: new Date().toISOString(),
            mood: moodType,
            value: moodLevel
        };

        const newHistory = [...data.moodHistory, entry];
        setData({ ...data, moodHistory: newHistory });
        await addMoodEntry(user.uid, entry);
        triggerAlert("Muvaffaqiyat", t.mind.saved, "success");
    };

    // Helper to get localized breath text
    const getBreathText = () => {
        switch (breathPhase) {
            case 'inhale': return t.mind.inhale;
            case 'hold': return t.mind.hold;
            case 'exhale': return t.mind.exhale;
            default: return t.mind.ready;
        }
    };

    if (loading || !data) return <div className="text-white p-10 flex items-center justify-center min-h-[60vh] font-display text-xl animate-pulse">{t.mind.loadingState}</div>;

    const progress = mode === 'focus' ? (timeLeft / (25 * 60)) * 100 : (timeLeft / (5 * 60)) * 100;
    const strokeDashoffset = 283 - (283 * progress) / 100;

    // ZEN MODE UI
    if (isZenMode) {
        return (
            <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-12 animate-fade-in text-center relative overflow-hidden px-4">
                <div className="absolute inset-0 bg-gradient-to-b from-aura-red/10 via-black to-black z-0"></div>
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-aura-red/20 blur-[100px] animate-pulse rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aura-purple/10 blur-[120px] animate-pulse delay-700 rounded-full"></div>

                <div className="relative z-10 p-12 lg:p-16 rounded-[4rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] max-w-2xl w-full">
                    <h2 className="text-5xl font-display font-light text-white mb-4 tracking-tight leading-tight">
                        {t.mind.zenTitle}, {data.quote?.author.split(' ')[0]}.
                    </h2>
                    <p className="text-gray-400 text-xl font-light mb-12 max-w-md mx-auto">{t.mind.zenSubtitle}</p>

                    <div className="w-72 h-72 mx-auto flex items-center justify-center relative mb-12">
                        <div className="absolute inset-0 rounded-full border border-aura-red/30 animate-[ping_4s_ease-in-out_infinite]"></div>
                        <div className="absolute inset-8 rounded-full border border-aura-red/50 animate-[ping_4s_ease-in-out_infinite_1s]"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-aura-red/20 to-transparent rounded-full blur-xl"></div>
                        <div className="text-3xl font-display font-medium text-white tracking-widest uppercase z-10 drop-shadow-lg">{getBreathText()}</div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">{t.mind.whyFeeling}</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {(['tired', 'anxious', 'overwhelmed', 'justBecause'] as const).map(reason => (
                                <button key={reason} className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-300 transition-all hover:scale-105 active:scale-95">
                                    {t.mind.reasons[reason]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setMoodLevel(50)}
                    className="relative z-10 px-8 py-3 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2 group"
                >
                    <span className="w-8 h-[1px] bg-gray-700 group-hover:w-12 group-hover:bg-white transition-all"></span>
                    {t.mind.exitZen}
                </button>
            </div>
        )
    }

    // NORMAL UI
    return (
        <div className="animate-fade-in pb-20 relative">
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={t.mind.historyModalTitle}
            >
                <div className="space-y-8 p-2">
                    <div>
                        <h4 className="text-white font-bold mb-6 text-lg">{t.mind.moodTrends || "Hissiyotlar tendentsiyasi"}</h4>
                        <div className="grid grid-cols-7 gap-3">
                            {data.moodHistory.slice(-28).map((mood, i) => {
                                const color = mood.value > 70 ? 'bg-aura-green' : mood.value > 40 ? 'bg-aura-gold' : 'bg-aura-red';
                                return (
                                    <div key={i} className={`aspect-square rounded-xl ${color} opacity-60 hover:opacity-100 transition-all hover:scale-110 relative group cursor-help shadow-lg`}>
                                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[11px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 border border-white/10 shadow-2xl backdrop-blur-md">
                                            {new Date(mood.date).toLocaleDateString()}
                                            <div className="font-bold text-center mt-0.5">{mood.value}%</div>
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="text-aura-purple">⚡</span> {t.mind.recentSessions}
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-aura-purple"></div>
                                    🎯 {t.mind.focus} (25m)
                                </span>
                                <span className="text-aura-green font-medium">Bajarildi</span>
                            </li>
                            <li className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-aura-cyan"></div>
                                    🧘 {t.mind.resonanceBreathing} (5m)
                                </span>
                                <span className="text-aura-green font-medium">Bajarildi</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </HistoryModal>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white mb-3 tracking-tight">
                        {t.mind.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-aura-purple rounded-full"></span>
                        <p className="text-gray-400 font-medium">{t.mind.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-3xl border border-white/10 backdrop-blur-md">
                    <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    <VoiceInput
                        module="mind"
                        onCommand={handleVoiceCommand}
                        color="purple"
                        className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                    />
                </div>
            </div>

            {isArchived && (
                <div className="mb-8">
                    <ReadOnlyBanner
                        title={t.mind.readOnly || "Archive Mode"}
                        description={t.mind.readOnlyDesc || "Past days cannot be edited to ensure data integrity"}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: INTROSPECTION (4 columns) */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Mood Sphere Card */}
                    <div className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-aura-purple/30 transition-all duration-500 overflow-hidden relative">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-aura-purple/10 blur-[60px] group-hover:bg-aura-purple/20 transition-all"></div>

                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-white mb-1">{t.mind.moodSphere}</h3>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{t.mind.moodSphereDesc}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-4xl animate-bounce-slow">
                                    {moodLevel > 70 ? '😄' : moodLevel > 30 ? '😐' : '😞'}
                                </span>
                                <span className="text-sm font-bold text-aura-purple mt-1">{moodLevel}%</span>
                            </div>
                        </div>

                        <div className="space-y-12 relative z-10 px-4">
                            <div className="relative pt-12">
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={moodLevel}
                                    disabled={isArchived}
                                    onChange={(e) => setMoodLevel(Number(e.target.value))}
                                    className={`w-full h-1.5 bg-white/5 rounded-lg appearance-none relative z-20 ${isArchived ? 'cursor-default opacity-50' : 'cursor-pointer accent-aura-purple'}`}
                                />
                                {/* Visual Slider Track Background */}
                                <div
                                    className="absolute top-[3.75rem] left-0 h-1.5 bg-gradient-to-r from-aura-red via-aura-gold to-aura-green rounded-full opacity-20 blur-[2px]"
                                    style={{ width: '100%' }}
                                ></div>
                                <div
                                    className="absolute top-[3.75rem] left-0 h-1.5 bg-gradient-to-r from-aura-red via-aura-gold to-aura-green rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                    style={{ width: `${moodLevel}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                <span className="flex flex-col items-start gap-1">
                                    <span className="w-4 h-[1px] bg-aura-red"></span>
                                    {t.mind.zenMapLeft}
                                </span>
                                <button
                                    onClick={() => !isArchived && handleLogMood()}
                                    disabled={isArchived}
                                    className={`px-8 py-3 rounded-2xl font-bold text-xs transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] ${isArchived ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed' : 'bg-aura-purple text-white hover:scale-105 active:scale-95'}`}
                                >
                                    {t.mind.saveMood}
                                </button>
                                <span className="flex flex-col items-end gap-1">
                                    <span className="w-4 h-[1px] bg-aura-green"></span>
                                    {t.mind.zenMapRight}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insight Card - Manual Trigger Enabled */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-aura-cyan/10 to-transparent border border-aura-cyan/20 group hover:border-aura-cyan/40 transition-all relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-10 w-32 h-32 bg-aura-cyan/5 blur-[40px] rounded-full"></div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-aura-cyan/20 flex items-center justify-center text-2xl animate-pulse">
                                {aiInsight?.emoji || '🧠'}
                            </div>
                            <div>
                                <h4 className="text-aura-cyan font-bold text-sm uppercase tracking-widest">{t.mind.aiSummaryTitle}</h4>
                                <h3 className="text-white font-display font-medium text-lg leading-tight">
                                    {aiInsight?.title || "AI Mind Analysis"}
                                </h3>
                            </div>
                        </div>

                        <p className="text-gray-300 text-lg font-light leading-relaxed italic relative z-10 min-h-[80px]">
                            {aiLoading ?
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-aura-cyan border-t-transparent rounded-full animate-spin"></span>
                                    Wait...
                                </span> :
                                (aiInsight?.insight ? `"${aiInsight.insight}"` : "Hissiyotlaringiz va diqqatingiz asosida sun'iy intellekt tahlili.")
                            }
                        </p>

                        <div className="mt-8 flex justify-between items-center relative z-10">
                            <button
                                onClick={fetchInsight}
                                disabled={aiLoading}
                                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${aiLoading ? 'bg-white/5 text-gray-500' : 'bg-aura-cyan text-black hover:bg-white hover:scale-105'}`}
                            >
                                {aiLoading ? 'Generating...' : (aiInsight ? 'Refresh Analysis' : 'Start Analysis')}
                            </button>

                            <button onClick={() => setIsHistoryOpen(true)} className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter hover:text-aura-cyan transition-all">
                                {t.mind.historyModalTitle || "History"} →
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: TOOLS (7 columns) */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Focus Timer Card */}
                    <div className="p-10 lg:p-12 rounded-[3rem] bg-gradient-to-br from-white/5 to-aura-purple/5 border border-white/10 relative overflow-hidden shadow-2xl">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full"></div>

                        {/* Task Progress Info */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-white mb-2">{t.mind.focus} Seans</h3>
                                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
                                    <button
                                        onClick={() => { if (isArchived) return; setMode('focus'); setTimeLeft(25 * 60); setIsActive(false); }}
                                        disabled={isArchived}
                                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'focus' ? 'bg-aura-purple text-white shadow-lg shadow-aura-purple/20' : 'text-gray-500 hover:text-white'} ${isArchived ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Focus
                                    </button>
                                    <button
                                        onClick={() => { if (isArchived) return; setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
                                        disabled={isArchived}
                                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'break' ? 'bg-aura-cyan text-black' : 'text-gray-500 hover:text-white'} ${isArchived ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {t.mind.break}
                                    </button>
                                </div>
                            </div>

                            {activeTask && (
                                <div className="bg-aura-purple/10 border border-aura-purple/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-fade-in group hover:bg-aura-purple/20 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-aura-purple flex items-center justify-center text-white font-bold text-xs ring-4 ring-aura-purple/20">
                                        🎯
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-aura-purple font-bold uppercase tracking-widest">{t.mind.focusingOn}</span>
                                        <span className="text-white text-sm font-medium">{activeTask}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Timer Display */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative z-10">
                            <div className="relative w-72 h-72">
                                {/* SVG Ring */}
                                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                    <circle
                                        cx="144" cy="144" r="130"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-white/5"
                                    />
                                    <circle
                                        cx="144" cy="144" r="130"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="816.8"
                                        strokeDashoffset={816.8 - (816.8 * progress) / 100}
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'text-aura-purple' : 'text-aura-cyan'}`}
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-[5rem] font-bold text-white font-mono tracking-tighter tabular-nums leading-none">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                                        {isActive ? "Running" : "Paused"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-6">
                                <button
                                    onClick={() => !isArchived && toggleTimer()}
                                    disabled={isArchived}
                                    className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl transition-all shadow-2xl transform active:scale-90 ${isArchived ? 'bg-white/5 border border-white/10 text-gray-700 cursor-not-allowed' : (isActive ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white text-black hover:scale-105')}`}
                                >
                                    {isActive ? '⏸' : '▶'}
                                </button>
                                <button
                                    onClick={() => !isArchived && resetTimer()}
                                    disabled={isArchived}
                                    className={`w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl transition-all active:scale-90 ${isArchived ? 'text-gray-700 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                    ↺
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Breathing Exercise Card */}
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-aura-cyan/30 transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
                        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-aura-cyan/5 blur-[50px] rounded-full group-hover:bg-aura-cyan/10 transition-all"></div>

                        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                            <h3 className="text-2xl font-display font-bold text-white mb-2">{t.mind.resonanceBreathing}</h3>
                            <p className="text-sm text-gray-400 max-w-xs mb-6">Nafas olishingizni ekrandagi ritm bilan moslashtiring.</p>
                            <button
                                onClick={() => !isArchived && setIsBreathing(!isBreathing)}
                                disabled={isArchived}
                                className={`px-8 py-3.5 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${isArchived ? 'border-white/10 text-gray-500 cursor-not-allowed opacity-50' : (isBreathing ? 'border-aura-purple/50 text-aura-purple bg-aura-purple/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-white/10 text-white hover:bg-white/5')}`}
                            >
                                {isBreathing ? t.mind.stopSession : t.mind.startSession}
                            </button>
                        </div>

                        <div className="w-40 h-40 flex items-center justify-center relative z-10">
                            <div className={`absolute inset-0 rounded-full border-2 border-aura-purple/20 transition-all duration-[4000ms] ease-in-out ${isBreathing ? 'scale-150 opacity-0' : 'scale-75 opacity-20'}`}></div>
                            <div className={`absolute inset-4 rounded-full border border-aura-cyan/20 transition-all duration-[4000ms] ease-in-out ${isBreathing ? 'scale-125 opacity-0' : 'scale-90 opacity-40'}`}></div>

                            <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-aura-purple via-aura-purple/80 to-aura-cyan flex flex-col items-center justify-center text-white text-center shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all duration-[4000ms] ease-in-out z-10 ring-8 ring-white/5 ${isBreathing ? 'scale-110' : 'scale-90 opacity-60'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mb-1">
                                    {breathPhase !== 'ready' ? breathPhase : ""}
                                </span>
                                <span className="text-xs font-bold leading-tight px-3">{getBreathText()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <AlertModal
                    isOpen={alertModal.isOpen}
                    onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                    title={alertModal.title}
                    message={alertModal.message}
                    type={alertModal.type}
                />
            </div>
        </div >
    );
}
