"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getLocalTodayStr } from '@/lib/dateUtils';
import Modal from '@/components/Modal';
import HistoryModal from '@/components/HistoryModal';
import VoiceInput from '@/components/VoiceInput';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getInterestsData, seedInterestsData, InterestsData, Interest, addInterest, updateInterestProgress, subscribeToInterestsData } from '@/services/interestsService';
import { getHealthData } from '@/services/healthService';
import { getTasksByDate, addTask } from '@/services/tasksService';
import { getScheduledInsight } from '@/services/aiPersistenceService';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { getInterestLogsByDate, InterestLog, logInterestActivity, saveDailyRecs, AIRec, DailyRecs, saveAIRecFeedback, logHabitOccurrence, saveHabitAdvice, markAIRecAsTask, markAIRecDone } from '@/services/interestsService';
import { getFinanceOverview } from '@/services/financeService';
import { getFoodLog } from '@/services/foodService';
import { getMindData } from '@/services/mindService';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { format } from 'date-fns';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';

export default function InterestsDashboard() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('interests');
    }, []);

    // State
    const [data, setData] = useState<InterestsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [aiRecs, setAiRecs] = useState<AIRec[]>([]);
    const [recLoading, setRecLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const [dailyLogs, setDailyLogs] = useState<InterestLog[]>([]);
    const [habitAdvice, setHabitAdvice] = useState<string | null>(null);
    const [newHobbyTrackingMode, setNewHobbyTrackingMode] = useState<'frequency' | 'binary'>('frequency');
    const [isArchived, setIsArchived] = useState(false);

    useEffect(() => {
        const todayStr = getLocalTodayStr();
        setIsArchived(selectedDate !== todayStr);
    }, [selectedDate]);

    const aggregatedLogs = useMemo(() => {
        const stats: { [key: string]: InterestLog & { totalCount: number; totalDuration: number } } = {};
        dailyLogs.forEach(log => {
            if (!stats[log.hobbyId]) {
                stats[log.hobbyId] = { ...log, totalCount: 0, totalDuration: 0 };
            }
            if (log.count) stats[log.hobbyId].totalCount += log.count;
            if (log.durationMinutes) stats[log.hobbyId].totalDuration += log.durationMinutes;
        });
        return Object.values(stats);
    }, [dailyLogs]);
    const [isLogging, setIsLogging] = useState<string | null>(null); // hobbyId being logged
    const [logDuration, setLogDuration] = useState(30);
    const [isSaving, setIsSaving] = useState(false);

    // New Hobby Form
    const [newHobbyName, setNewHobbyName] = useState('');
    const [newHobbyCategory, setNewHobbyCategory] = useState('General');
    const [newHobbyType, setNewHobbyType] = useState<'positive' | 'negative'>('positive');

    const refreshData = async () => {
        if (!user) return;
        const doc = await getInterestsData(user.uid);
        if (doc) setData(doc);
    };

    // V23: Real-time Data Subscription
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const unsub = subscribeToInterestsData(user.uid, (doc) => {
            setData(doc);
            setLoading(false);
        });

        // Initial check for seeding
        getInterestsData(user.uid).then(doc => {
            if (!doc) seedInterestsData(user.uid);
        });

        return () => unsub();
    }, [user?.uid]);

    // FETCH DAILY LOGS - MOUNT & DATE CHANGE
    useEffect(() => {
        if (!user) return;
        const fetchLogs = async () => {
            try {
                const logs = await getInterestLogsByDate(user.uid, selectedDate);
                setDailyLogs(logs);
            } catch (error) {
                console.error("Failed to fetch daily logs", error);
            }
        };
        fetchLogs();
    }, [user, selectedDate]);

    // V23: Scheduled AI Recommendations
    const fetchAiRecs = React.useCallback(async (force = false) => {
        if (!user || !data) return;
        setRecLoading(true);
        try {
            // Fetch additional context
            const health = await getHealthData(user.uid, getLocalTodayStr());

            const insight = await getScheduledInsight(user.uid, 'interests', language, {
                hobbies: data.hobbies.map(h => h.name),
                healthGoal: health?.biometrics?.goal || 'General Health',
                habitStats: dailyLogs.map(l => l.hobbyName)
            }, { force });

            if (insight) {
                if (insight.data && insight.data.recommendations) {
                    // V2: Use rich data from AI
                    const richRecs: AIRec[] = insight.data.recommendations.map((r: any) => ({
                        recommendation: r.recommendation,
                        reason: r.reason,
                        emoji: r.emoji || '💡',
                        category: 'AI',
                        type: r.type || 'growth', // growth or correction
                        isDone: false,
                        feedback: undefined
                    }));
                    setAiRecs(richRecs);
                } else {
                    // Fallback V1
                    const recs: AIRec[] = [{
                        recommendation: insight.title,
                        reason: insight.insight,
                        emoji: insight.emoji || '💡',
                        category: 'AI',
                        type: 'growth',
                        isDone: false
                    }];
                    setAiRecs(recs);
                }
            }
        } catch (err) {
            console.error("Interests AI Error:", err);
        } finally {
            setRecLoading(false);
        }
    }, [user, data, language, dailyLogs]);

    // useEffect(() => {
    //     fetchAiRecs();
    // }, [fetchAiRecs]);

    const handleVoiceCommand = async (command: any) => {
        if (!user || !data || isArchived) return;
        console.log('Interests Voice Command:', command);

        const { action, data: cmdData } = command;

        if (action === 'add') {
            const hobbyName = cmdData?.hobby || cmdData?.title || t.interests.newHobby;
            const newInterest: Interest = {
                id: Date.now().toString(),
                name: hobbyName,
                category: t.interests.categories.general,
                type: 'positive',
                level: 1,
                progress: 0,
                totalHours: 0,
                image: '🎨' // Default icon
            };
            await addInterest(user.uid, newInterest);
            await refreshData();
        } else if (action === 'log') {
            const hobbyName = cmdData?.hobby;
            const duration = cmdData?.duration || 30;

            if (!hobbyName) return;

            const hobby = data.hobbies.find(h => h.name.toLowerCase().includes(hobbyName.toLowerCase()));

            if (hobby) {
                await updateInterestProgress(user.uid, hobby.id, duration / 60);
                await refreshData();
            } else {
                const newInterest: Interest = {
                    id: Date.now().toString(),
                    name: hobbyName,
                    category: t.interests.categories.general,
                    type: 'positive',
                    level: 1,
                    progress: 0,
                    totalHours: duration / 60,
                    image: '✨'
                };
                await addInterest(user.uid, newInterest);
                await refreshData();
            }
        }
    };

    const handleHabitLog = async (hobby: Interest) => {
        if (!user || isArchived) return;
        const today = getLocalTodayStr();
        // Ensure we only log for today
        if (selectedDate !== today) return;
        await logHabitOccurrence(user.uid, hobby, today);
        const logs = await getInterestLogsByDate(user.uid, selectedDate);
        setDailyLogs(logs);
    };

    const handleAIRecFeedback = async (index: number, feedback: 'like' | 'dislike') => {
        if (!user || !aiRecs[index] || isArchived || !data) return;
        const rec = aiRecs[index];
        const today = getLocalTodayStr();
        const hour = new Date().getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        // 1. Save feedback status
        await saveAIRecFeedback(user.uid, today, window, index, feedback);

        // 2. Persist as actual Interest/Habit
        // Check if already exists to prevent duplicates
        const exists = data.hobbies.some(h => h.name.toLowerCase() === rec.recommendation.toLowerCase());

        if (!exists) {
            const newInterest: Interest = {
                id: Date.now().toString(),
                name: rec.recommendation,
                category: rec.category || t.interests.categories.general,
                // Rule: Like -> Positive, Dislike -> Negative
                type: feedback === 'like' ? 'positive' : 'negative',
                level: 1,
                progress: 0,
                totalHours: 0,
                image: rec.emoji || '✨'
            };

            if (feedback === 'dislike') {
                newInterest.trackingMode = 'frequency';
            }

            await addInterest(user.uid, newInterest);
            await refreshData();
        }

        // Update local state
        const newRecs = [...aiRecs];
        newRecs[index].feedback = feedback;
        setAiRecs(newRecs);
    };

    const handleAddToTask = async (index: number) => {
        if (!user || !aiRecs[index] || isArchived) return;
        const rec = aiRecs[index];
        const today = getLocalTodayStr();
        const hour = new Date().getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        // 1. Add to Tasks module
        await addTask(user.uid, {
            title: rec.recommendation,
            description: rec.reason,
            status: 'todo',
            priority: 'medium',
            startTime: '10:00',
            endTime: '11:00',
            category: rec.category || rec.type === 'growth' ? 'Growth' : 'Control',
            date: today
        });

        // 2. Mark in Interests
        await markAIRecAsTask(user.uid, today, window, index, 'task_id_placeholder');

        // Update local state
        const newRecs = [...aiRecs];
        newRecs[index].isAddedToTasks = true;
        setAiRecs(newRecs);
    };

    const handleAIRecDone = async (index: number) => {
        if (!user || !aiRecs[index] || isArchived) return;
        const rec = aiRecs[index];
        const today = getLocalTodayStr();
        const hour = new Date().getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        // 1. Save activity log so it appears in daily logs
        await logInterestActivity(user.uid, {
            hobbyId: `ai-${rec.recommendation.toLowerCase().replace(/\s+/g, '-')}`,
            hobbyName: `${rec.type === 'growth' ? '🚀' : '🛡️'} ${rec.recommendation}`,
            durationMinutes: rec.type === 'growth' ? 30 : 0,
            count: rec.type === 'correction' ? 1 : 0,
            date: today
        });

        // 2. Mark AI rec as Done
        await markAIRecDone(user.uid, today, window, index);

        // Update local state
        const newRecs = [...aiRecs];
        newRecs[index].isDone = true;
        setAiRecs(newRecs);

        // Refresh logs
        const logs = await getInterestLogsByDate(user.uid, selectedDate);
        setDailyLogs(logs);
    };

    const handleLogActivity = async (hobby: Interest) => {
        if (!user || isArchived) return;
        await logInterestActivity(user.uid, {
            hobbyId: hobby.id,
            hobbyName: hobby.name,
            durationMinutes: logDuration,
            date: selectedDate
        });
        await refreshData();
        const logs = await getInterestLogsByDate(user.uid, selectedDate);
        setDailyLogs(logs);
        setIsLogging(null);
    };

    const handleManualAdd = async () => {
        if (!user || !newHobbyName || isArchived) return;
        setIsSaving(true);
        try {
            const newInterest: Interest = {
                id: Date.now().toString(),
                name: newHobbyName,
                category: newHobbyCategory,
                type: newHobbyType,
                level: 1,
                progress: 0,
                totalHours: 0,
                image: getEmojiForCategory(newHobbyCategory),
                trackingMode: newHobbyType === 'negative' ? newHobbyTrackingMode : 'frequency'
            };
            await addInterest(user.uid, newInterest);
            await refreshData();
            setIsAddModalOpen(false);
            setNewHobbyName('');
        } catch (error) {
            console.error("Failed to add interest", error);
        } finally {
            setIsSaving(false);
        }
    };

    const getEmojiForCategory = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'art': return '🎨';
            case 'physical': return '🏃';
            case 'mind': return '🧘';
            case 'music': return '🎸';
            default: return '✨';
        }
    };

    const HobbyCard = ({ hobby }: { hobby: Interest }) => (
        <div className="group relative p-6 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/10 hover:border-aura-cyan/30 transition-all overflow-hidden flex flex-col justify-between h-[320px] shadow-2xl">
            {/* Background Glow */}
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 blur-[50px] transition-colors rounded-full ${hobby.type === 'positive' || !hobby.type ? 'bg-aura-cyan/10 group-hover:bg-aura-purple/20' : 'bg-aura-red/10 group-hover:bg-aura-gold/20'}`}></div>

            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] ${hobby.type === 'negative' ? 'border-aura-red/20' : ''} group-hover:scale-110 transition-transform duration-300`}>
                        {hobby.image}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] uppercase tracking-widest font-bold ${hobby.type === 'positive' || !hobby.type ? 'text-gray-400' : 'text-aura-red'}`}>
                            {hobby.category} {hobby.type === 'negative' && '⚠️'}
                        </span>
                        {hobby.totalHours > 0 && (
                            <span className={`text-[10px] font-mono ${hobby.type === 'positive' || !hobby.type ? 'text-aura-green' : 'text-gray-500'}`}>
                                {hobby.type === 'positive' || !hobby.type ? `+${hobby.totalHours}${t.interests.totalHours}` : `${hobby.totalHours}${t.interests.totalControl}`}
                            </span>
                        )}
                    </div>
                </div>

                <h3 className={`text-lg font-bold text-white mb-2 leading-tight transition-colors line-clamp-3 ${hobby.type === 'positive' || !hobby.type ? 'group-hover:text-aura-cyan' : 'group-hover:text-aura-red'}`}>{hobby.name}</h3>
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-medium tracking-wide transition-colors ${hobby.type === 'positive' || !hobby.type ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400'}`}>
                        {hobby.type === 'positive' || !hobby.type ? `${t.interests.level} ${hobby.level}` : (hobby.trackingMode === 'binary' ? `${t.interests.status}: ${dailyLogs.some(l => l.hobbyId === hobby.id) ? t.interests.done : t.interests.notDone}` : `${t.interests.todayLabel}: ${dailyLogs.filter(l => l.hobbyId === hobby.id).reduce((sum, l) => sum + (l.count || 0), 0)} ${t.interests.times}`)}
                    </p>
                    {dailyLogs.filter(l => l.hobbyId === hobby.id).length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse ${hobby.type === 'positive' ? 'bg-aura-cyan/20 text-aura-cyan' : 'bg-aura-red/20 text-aura-red'}`}>
                            {t.interests.done.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
                {(hobby.type === 'positive' || !hobby.type) && (
                    <div className="space-y-3">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-aura-cyan to-aura-purple transition-all duration-1000"
                                style={{ width: `${hobby.progress}%` }}
                            ></div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isArchived) setIsLogging(hobby.id);
                            }}
                            disabled={isArchived}
                            className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {t.interests.done}
                        </button>
                    </div>
                )}

                {hobby.type === 'negative' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleHabitLog(hobby);
                        }}
                        disabled={hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id)}
                        className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id) ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-aura-red/10 border-aura-red/20 text-aura-red hover:bg-aura-red/20'}`}
                    >
                        <span>{hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id) ? '✅' : '🛑'}</span>
                        {hobby.trackingMode === 'binary' ? (dailyLogs.some(l => l.hobbyId === hobby.id) ? t.interests.done.toUpperCase() : t.interests.log) : t.interests.logCount}
                    </button>
                )}

                {isLogging === hobby.id && (
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fade-in z-20">
                        <h4 className="text-sm font-bold text-white mb-4 text-center">{t.interests.logDurationQuestion}</h4>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <button onClick={() => setLogDuration(Math.max(5, logDuration - 5))} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10">-</button>
                            <span className="text-2xl font-mono font-bold text-aura-cyan">{logDuration}m</span>
                            <button onClick={() => setLogDuration(logDuration + 5)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10">+</button>
                        </div>
                        <button
                            onClick={() => handleLogActivity(hobby)}
                            className="w-full py-3 rounded-xl bg-aura-cyan text-black font-bold text-sm hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                        >
                            {t.interests.log}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading || !data) return <div className="text-white p-10">{t.interests.loading}</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">



            {/* HEADER */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">{t.interests.title}</h1>
                    <p className="text-gray-400">{t.interests.subtitle}</p>
                </div>

                <div className="flex items-center gap-4">
                    <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    <VoiceInput
                        module="interests"
                        onCommand={handleVoiceCommand}
                        color="cyan"
                        className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                    />
                    <button
                        onClick={() => !isArchived && setIsAddModalOpen(true)}
                        disabled={isArchived}
                        className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-shadow disabled:opacity-30"
                    >
                        {t.interests.newHobby}
                    </button>
                </div>
            </div>

            {isArchived && (
                <ReadOnlyBanner
                    title={t.interests.readOnly}
                    description={t.interests.readOnlyDesc}
                />
            )}

            {/* AI PROPOSALS */}
            <AiInsightSection
                onAnalyze={() => fetchAiRecs(true)}
                isLoading={recLoading}
                insight={aiRecs.length > 0 ? { title: "AI Analysis", text: t.interests.aiRecTitleGrowth || "Recommendations Ready", emoji: "🎨" } : null}
                title="AURA AI Interests"
                description={t.interests.subtitle || "AI-powered recommendations based on your interests."}
                buttonText={aiRecs.length > 0 ? (t.common?.refresh || "Refresh") : "Start Analysis"}
                color="purple"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {aiRecs.map((rec, index) => (
                        <div key={index} className={`p-6 rounded-[2rem] bg-black/40 border relative overflow-hidden group flex flex-col justify-between min-h-[250px] transition-all ${rec.isDone ? 'opacity-50 grayscale-[0.5]' : ''} ${rec.type === 'correction' ? 'border-aura-red/30' : 'border-aura-cyan/30'}`}>
                            {/* Simple Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 ${rec.type === 'correction' ? 'bg-aura-red/10' : 'bg-aura-cyan/10'}`}></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-3xl">{rec.emoji}</span>
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${rec.type === 'correction' ? 'bg-aura-red/20 text-aura-red' : 'bg-aura-cyan/20 text-aura-cyan'}`}>
                                        {rec.type === 'correction' ? t.interests.aiRecTitleCorrection : t.interests.aiRecTitleGrowth}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{rec.recommendation}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed italic">"{rec.reason}"</p>
                            </div>

                            <div className="relative z-10 mt-4 flex flex-col gap-2">
                                {rec.isDone ? (
                                    <div className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-center text-white font-bold flex items-center justify-center gap-2 text-xs">
                                        ✅ {t.interests.aiRecDone}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAIRecFeedback(index, 'like')}
                                                className={`flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-xs ${rec.feedback === 'like' ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan' : 'text-gray-400'}`}
                                            >
                                                👍
                                            </button>
                                            <button
                                                onClick={() => handleAIRecFeedback(index, 'dislike')}
                                                className={`flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-xs ${rec.feedback === 'dislike' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'text-gray-400'}`}
                                            >
                                                👎
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleAddToTask(index)}
                                            className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${rec.type === 'correction' ? 'bg-aura-red text-white hover:bg-aura-red/80' : 'bg-aura-cyan text-black hover:bg-aura-cyan/80'}`}
                                        >
                                            {rec.isAddedToTasks ? `✅ ${t.interests.aiRecTask}` : `+ ${t.interests.aiRecAddTask}`}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {
                    aiRecs.some(r => r.feedback || r.isAddedToTasks) && (
                        <div className="mt-8">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{t.interests.aiRecStatus}</div>
                            <div className="flex flex-wrap gap-4">
                                {aiRecs.map((rec, i) => (
                                    (rec.feedback || rec.isAddedToTasks) && (
                                        <div key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs">
                                            <span>{rec.emoji}</span>
                                            <span className="text-gray-300 font-medium">{rec.recommendation}</span>
                                            <div className="flex gap-1">
                                                {rec.feedback === 'like' && <span className="text-aura-cyan">👍</span>}
                                                {rec.feedback === 'dislike' && <span className="text-aura-red">👎</span>}
                                                {rec.isAddedToTasks && <span className="text-aura-green">📝</span>}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )
                }
            </AiInsightSection>

            {/* POSITIVE INTERESTS */}
            <h3 className="text-2xl font-bold text-white mt-12 mb-6">{t.interests.positiveInterests}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <button
                    onClick={() => !isArchived && setIsAddModalOpen(true)}
                    disabled={isArchived}
                    className={`group p-6 rounded-[2.5rem] border border-dashed border-white/20 hover:border-aura-cyan/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 h-[320px] ${isArchived ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform text-white group-hover:text-aura-cyan">+</div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-aura-cyan transition-colors">{t.interests.newHobbyCardTitle}</h3>
                        <p className="text-xs text-gray-500">{t.interests.newHobbyCardDesc}</p>
                    </div>
                </button>

                {data.hobbies.filter(h => h.type === 'positive' || !h.type).map(hobby => (
                    <HobbyCard key={hobby.id} hobby={hobby} />
                ))}
            </div>

            {/* NEGATIVE HABITS */}
            <h3 className="text-2xl font-bold text-white mt-12 mb-6">{t.interests.negativeHabits}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.hobbies.filter(h => h.type === 'negative').map(hobby => (
                    <HobbyCard key={hobby.id} hobby={hobby} />
                ))}
            </div>


            {/* ADD HOBBY MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={t.interests.addHobbyTitle}
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest">{t.interests.hobbyName}</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-aura-cyan outline-none transition-all"
                            placeholder={t.interests.placeholderName}
                            value={newHobbyName}
                            onChange={(e) => setNewHobbyName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest">{t.interests.category}</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all font-bold"
                            value={newHobbyCategory}
                            onChange={(e) => setNewHobbyCategory(e.target.value)}
                        >
                            <option value="General" className="bg-black">{t.interests.categories.general}</option>
                            <option value="Art" className="bg-black">{t.interests.categories.art}</option>
                            <option value="Physical" className="bg-black">{t.interests.categories.physical}</option>
                            <option value="Mind" className="bg-black">{t.interests.categories.mind}</option>
                            <option value="Music" className="bg-black">{t.interests.categories.music}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest">{t.interests.type}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setNewHobbyType('positive')}
                                className={`py-4 rounded-xl border font-bold transition-all ${newHobbyType === 'positive' ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                            >
                                ✨ {t.interests.positive}
                            </button>
                            <button
                                onClick={() => setNewHobbyType('negative')}
                                className={`py-4 rounded-xl border font-bold transition-all ${newHobbyType === 'negative' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                            >
                                ⚠️ {t.interests.negative}
                            </button>
                        </div>
                    </div>

                    {newHobbyType === 'negative' && (
                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t.interests.trackingMode}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setNewHobbyTrackingMode('frequency')}
                                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${newHobbyTrackingMode === 'frequency' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                >
                                    🔢 {t.interests.trackingFrequency}
                                </button>
                                <button
                                    onClick={() => setNewHobbyTrackingMode('binary')}
                                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${newHobbyTrackingMode === 'binary' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                >
                                    ✅ {t.interests.trackingBinary}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600 italic">
                                {newHobbyTrackingMode === 'frequency' ? t.interests.trackingFrequencyDesc : t.interests.trackingBinaryDesc}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleManualAdd}
                        disabled={!!isSaving}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl ${!!isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${newHobbyType === 'positive' ? 'bg-white text-black hover:shadow-white/20' : 'bg-aura-red text-white hover:shadow-aura-red/20'}`}
                    >
                        {!!isSaving ? 'Saving...' : t.common.save}
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(false)}
                        className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:text-white transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                </div>
            </Modal>
        </div >
    );
}
