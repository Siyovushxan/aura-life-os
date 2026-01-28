"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getLocalTodayStr } from '@/lib/dateUtils';
import Modal from '@/components/Modal';
import HistoryModal from '@/components/HistoryModal';
import VoiceInput from '@/components/VoiceInput';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getInterestsData, seedInterestsData, InterestsData, Interest, addInterest, updateInterestProgress, subscribeToInterestsData, deleteInterest, updateInterest } from '@/services/interestsService';
import { getHealthData } from '@/services/healthService';
import { getTasksByDate, addTask } from '@/services/tasksService';
import { getScheduledInsight } from '@/services/aiPersistenceService';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { getInterestLogsByDate, InterestLog, logInterestActivity, saveDailyRecs, AIRec, DailyRecs, saveAIRecFeedback, logHabitOccurrence, saveHabitAdvice, markAIRecAsTask, markAIRecDone, getInterestLogsInRange } from '@/services/interestsService';
import { getFinanceOverview } from '@/services/financeService';
import { getFoodLog } from '@/services/foodService';
import { getMindData } from '@/services/mindService';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { format } from 'date-fns';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';

// Extracted HobbyCard Component
const HobbyCard = ({
    hobby,
    t,
    dailyLogs,
    isArchived,
    isLogging,
    setIsLogging,
    onLog,
    onEdit,
    onDelete,
    onHabitLog
}: {
    hobby: Interest,
    t: any,
    dailyLogs: InterestLog[],
    isArchived: boolean,
    isLogging: string | null,
    setIsLogging: (id: string | null) => void,
    onLog: (hobby: Interest, duration: number) => void,
    onEdit: (hobby: Interest) => void,
    onDelete: (id: string, name: string) => void,
    onHabitLog: (hobby: Interest) => void
}) => {
    const [localLogDuration, setLocalLogDuration] = useState(30);

    return (
        <div className="group relative p-4 rounded-[1.5rem] bg-black/40 backdrop-blur-xl border border-white/10 hover:border-aura-cyan/30 transition-all overflow-hidden flex flex-row items-center gap-4 shadow-2xl w-full max-w-5xl text-white">
            {/* Background Glow */}
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 blur-[50px] transition-colors rounded-full opacity-40 ${hobby.type === 'positive' || !hobby.type ? 'bg-aura-cyan/10 group-hover:bg-aura-purple/20' : 'bg-aura-red/10 group-hover:bg-aura-gold/20'}`}></div>

            {/* Icon Section */}
            <div className="flex-shrink-0 relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] ${hobby.type === 'negative' ? 'border-aura-red/20' : ''} group-hover:scale-105 transition-transform duration-300`}>
                    {hobby.image}
                </div>
            </div>

            {/* Info Section */}
            <div className={`flex-grow flex flex-col justify-center gap-1 relative z-10 transition-all ${isLogging === hobby.id ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
                <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold leading-tight transition-colors ${hobby.type === 'positive' || !hobby.type ? 'group-hover:text-aura-cyan' : 'group-hover:text-aura-red'}`}>{hobby.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest font-bold ${hobby.type === 'positive' || !hobby.type ? 'text-gray-400' : 'text-aura-red'}`}>
                        {hobby.category} {hobby.type === 'negative' && '⚠️'}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <p className={`font-medium transition-colors ${hobby.type === 'positive' || !hobby.type ? 'group-hover:text-gray-300' : ''}`}>
                        {hobby.type === 'positive' || !hobby.type ? `${t.interests.level} ${hobby.level}` : (hobby.trackingMode === 'binary' ? `${t.interests.status}: ${dailyLogs.some(l => l.hobbyId === hobby.id) ? t.interests.done : t.interests.notDone}` : `${t.interests.todayLabel}: ${dailyLogs.filter(l => l.hobbyId === hobby.id).reduce((sum, l) => sum + (l.count || 0), 0)} ${t.interests.times}`)}
                    </p>
                    {hobby.totalHours > 0 && (
                        <span className={`font-mono ${hobby.type === 'positive' || !hobby.type ? 'text-aura-green' : 'text-gray-500'}`}>
                            {hobby.type === 'positive' || !hobby.type ? `+${hobby.totalHours}${t.interests.totalHours}` : `${hobby.totalHours}${t.interests.totalControl}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Section (Switches between Normal and Inline Logging) */}
            <div className="flex-shrink-0 flex items-center justify-end relative z-20 min-w-[200px]">
                {isLogging === hobby.id ? (
                    // INLINE LOGGING CONTROLS (Vertical/Horizontal Compact)
                    <div className="flex items-center gap-3 animate-fade-in bg-black/80 backdrop-blur-md rounded-xl p-1.5 border border-aura-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                        {/* Time Controls */}
                        <div className="flex items-center gap-2 px-2 border-r border-white/10">
                            <button
                                onClick={(e) => { e.stopPropagation(); setLocalLogDuration(Math.max(5, localLogDuration - 5)); }}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold text-white transition-all active:scale-95"
                            >
                                -
                            </button>
                            <span className="text-xl font-mono font-bold text-aura-cyan min-w-[3ch] text-center">{localLogDuration}m</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setLocalLogDuration(localLogDuration + 5); }}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold text-white transition-all active:scale-95"
                            >
                                +
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onLog(hobby, localLogDuration)}
                                className="px-4 py-2 rounded-lg bg-aura-cyan text-black text-xs font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all active:scale-95"
                            >
                                {t.common.save}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsLogging(null); }}
                                className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ) : (
                    // NORMAL STATE
                    <div className="flex flex-col items-end gap-2 w-full">
                        {/* Progress Bar */}
                        {(hobby.type === 'positive' || !hobby.type) && (
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-aura-cyan to-aura-purple transition-all duration-1000 w-[var(--value)]"
                                    style={{ '--value': `${hobby.progress}%` } as React.CSSProperties}
                                ></div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 w-full">
                            {/* Edit/Delete - Inline */}
                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(hobby); }}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all flex items-center justify-center"
                                    title="Tahrirlash"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(hobby.id, hobby.name); }}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-aura-red/20 text-gray-400 hover:text-aura-red border border-white/10 hover:border-aura-red/30 transition-all flex items-center justify-center"
                                    title="O'chirish"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Main Action Button */}
                            {(hobby.type === 'positive' || !hobby.type) ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isArchived) setIsLogging(hobby.id);
                                    }}
                                    disabled={isArchived}
                                    className="flex-1 py-2 rounded-xl bg-white text-black text-xs font-bold hover:shadow-lg hover:shadow-white/20 transition-all disabled:opacity-50 hover:bg-aura-cyan hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {t.interests.done}
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onHabitLog(hobby);
                                    }}
                                    disabled={hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id)}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id) ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-aura-red/10 border-aura-red/20 text-aura-red hover:bg-aura-red/20 hover:shadow-aura-red/20'}`}
                                >
                                    <span>{hobby.trackingMode === 'binary' && dailyLogs.some(l => l.hobbyId === hobby.id) ? '✅' : '🛑'}</span>
                                    {hobby.trackingMode === 'binary' ? (dailyLogs.some(l => l.hobbyId === hobby.id) ? t.interests.done : t.interests.log) : t.interests.logCount}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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
    const [fullAiInsight, setFullAiInsight] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
    const [editingInterest, setEditingInterest] = useState<Interest | null>(null);

    // Analytics State
    const [historicalLogs, setHistoricalLogs] = useState<InterestLog[]>([]);
    const [rangeLoading, setRangeLoading] = useState(false);

    useEffect(() => {
        const fetchRange = async () => {
            if (!user) return;
            setRangeLoading(true);
            try {
                const end = getLocalTodayStr();
                const start = new Date();
                start.setDate(start.getDate() - 13);
                const startStr = start.toISOString().split('T')[0];
                const logs = await getInterestLogsInRange(user.uid, startStr, end);
                setHistoricalLogs(logs);
            } catch (error) {
                console.error("Failed to fetch range logs", error);
            } finally {
                setRangeLoading(false);
            }
        };
        if (activeTab === 'analytics') fetchRange();
    }, [user, activeTab]);

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
                    let richRecs: AIRec[] = insight.data.recommendations.map((r: any) => ({
                        recommendation: r.recommendation,
                        reason: r.reason,
                        emoji: r.emoji || '💡',
                        category: 'AI',
                        type: r.type || 'growth', // growth or correction
                        isDone: false
                        // feedback key is omitted to avoid Firestore 'undefined' error
                    }));

                    // Logic: Persistence requires a stable target in Firestore
                    if (data) {
                        const insightDateStr = insight.generatedAt.split('T')[0];
                        const generatedDate = new Date(insight.generatedAt);
                        const genHour = generatedDate.getHours();
                        const genWindow = genHour >= 6 && genHour < 12 ? 'morning' : genHour >= 12 && genHour < 18 ? 'lunch' : 'evening';

                        // Check if we already have saved interaction state for this specific insight window
                        const savedRecs = data.dailyRecs?.[insightDateStr]?.[genWindow];

                        // RESTORE only if NOT forcing new data
                        if (!force && savedRecs && Array.isArray(savedRecs) && savedRecs.length > 0) {
                            // RESTORE: Use the saved state (which includes feedback)
                            console.log(`[Interests] Restoring ${savedRecs.length} saved recs for ${insightDateStr} ${genWindow}`);
                            richRecs = savedRecs.map((saved, i) => {
                                // Merge saved state with fresh content (in case content format updates, but unlikely for same day)
                                // We trust saved state for status fields
                                return {
                                    ...richRecs[i], // default content
                                    ...saved // overrides status and potentially content
                                };
                            });
                        } else {
                            // INIT: First time seeing this (OR forced refresh). Save it to persistence layer.
                            // If force=true, this OVERWRITES the old savedRecs with the new clean clean ones, effectively resetting status.
                            console.log(`[Interests] Initializing persistence for ${insightDateStr} ${genWindow} (Force: ${force})`);
                            saveDailyRecs(user.uid, insightDateStr, genWindow, richRecs).catch(err => {
                                console.error("Failed to initialize saved recs", err);
                            });
                        }
                    }

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
                setFullAiInsight(insight);
            }
        } catch (err) {
            console.error("Interests AI Error:", err);
        } finally {
            setRecLoading(false);
        }
    }, [user, data, language, dailyLogs]);

    useEffect(() => {
        // Only fetch if data exists and hasn't been fetched for current window
        if (!loading && data && aiRecs.length === 0) {
            fetchAiRecs(false);
        }
    }, [loading, data]);

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
        if (!user || !aiRecs[index] || isArchived || !data || !fullAiInsight) return;
        const rec = aiRecs[index];

        const generatedDate = new Date(fullAiInsight.generatedAt);
        const dateKey = fullAiInsight.generatedAt.split('T')[0];
        const hour = generatedDate.getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        // Update local state IMMEDIATELY for snappy UI
        const newRecs = [...aiRecs];
        newRecs[index].feedback = feedback;
        setAiRecs(newRecs);

        // 1. Save feedback status
        await saveAIRecFeedback(user.uid, dateKey, window, index, feedback);

        // 2. Persist as actual Interest/Habit
        const exists = data.hobbies.some(h => h.name.toLowerCase() === rec.recommendation.toLowerCase());

        if (!exists) {
            const newInterest: Interest = {
                id: Date.now().toString(),
                name: rec.recommendation,
                category: rec.category || t.interests.categories.general,
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
            // Note: subscribingToInterestsData handles the 'setData' update, 
            // and our useEffect [loading, data] has a check 'aiRecs.length === 0' 
            // which prevents fetchAiRecs from being called again and resetting local state.
        } else {
        }
    };

    const handleAddToTask = async (index: number) => {
        if (!user || !aiRecs[index] || isArchived || !fullAiInsight) return;
        const rec = aiRecs[index];

        const dateKey = fullAiInsight.generatedAt.split('T')[0];
        const generatedDate = new Date(fullAiInsight.generatedAt);
        const hour = generatedDate.getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        await addTask(user.uid, {
            title: rec.recommendation,
            description: rec.reason,
            status: 'todo',
            priority: 'medium',
            startTime: '10:00',
            endTime: '11:00',
            category: rec.category || (rec.type === 'growth' ? 'Growth' : 'Control'),
            date: getLocalTodayStr()
        });

        await markAIRecAsTask(user.uid, dateKey, window, index, 'task_id_placeholder');

        const newRecs = [...aiRecs];
        newRecs[index].isAddedToTasks = true;
        setAiRecs(newRecs);

    };

    const handleAIRecDone = async (index: number) => {
        if (!user || !aiRecs[index] || isArchived || !fullAiInsight) return;
        const rec = aiRecs[index];

        const dateKey = fullAiInsight.generatedAt.split('T')[0];
        const generatedDate = new Date(fullAiInsight.generatedAt);
        const hour = generatedDate.getHours();
        const window: keyof DailyRecs = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'lunch' : 'evening';

        await logInterestActivity(user.uid, {
            hobbyId: `ai-${rec.recommendation.toLowerCase().replace(/\s+/g, '-')}`,
            hobbyName: `${rec.type === 'growth' ? '🚀' : '🛡️'} ${rec.recommendation}`,
            durationMinutes: rec.type === 'growth' ? 30 : 0,
            count: rec.type === 'correction' ? 1 : 0,
            date: getLocalTodayStr()
        });

        await markAIRecDone(user.uid, dateKey, window, index);

        const newRecs = [...aiRecs];
        newRecs[index].isDone = true;
        setAiRecs(newRecs);


        const logs = await getInterestLogsByDate(user.uid, selectedDate);
        setDailyLogs(logs);
    };

    const handleLogActivity = async (hobby: Interest, duration: number) => {
        if (!user || isArchived) return;
        await logInterestActivity(user.uid, {
            hobbyId: hobby.id,
            hobbyName: hobby.name,
            durationMinutes: duration,
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
            if (editingInterest) {
                const updated: Interest = {
                    ...editingInterest,
                    name: newHobbyName,
                    category: newHobbyCategory,
                    type: newHobbyType,
                    image: getEmojiForCategory(newHobbyCategory),
                    trackingMode: newHobbyType === 'negative' ? newHobbyTrackingMode : 'frequency'
                };
                await updateInterest(user.uid, updated);
            } else {
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
            }
            await refreshData();
            setIsAddModalOpen(false);
            setNewHobbyName('');
            setEditingInterest(null);
        } catch (error) {
            console.error("Failed to save interest", error);
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

    const handleDeleteInterest = async (id: string, name: string) => {
        if (!user || isArchived) return;
        if (confirm(`${name} ni o'chirishni tasdiqlaysizmi?`)) {
            await deleteInterest(user.uid, id);
            await refreshData();
        }
    };

    const handleEditClick = (hobby: Interest) => {
        setEditingInterest(hobby);
        setNewHobbyName(hobby.name);
        setNewHobbyCategory(hobby.category);
        setNewHobbyType(hobby.type);
        if (hobby.trackingMode) setNewHobbyTrackingMode(hobby.trackingMode);
        setIsAddModalOpen(true);
    };

    if (loading || !data) return <div className="text-white p-10">{t.interests.loading}</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* HEADER (V9.1 Unified Layout) */}
            <div className="flex items-center justify-between gap-6 mb-8 relative z-20 bg-black/40 p-4 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-display font-black text-white tracking-tighter flex items-center gap-2 leading-none">
                            {t.interests.title}
                        </h1>
                        <p className="text-gray-500 font-medium text-xs mt-1">{t.interests.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

                    {/* SEPARATOR */}
                    <div className="h-10 w-[1px] bg-white/10"></div>

                    {/* TABS SWITCHER */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard'
                                ? 'bg-white text-black shadow-lg scale-105'
                                : 'text-gray-500 hover:text-white'}`}
                        >
                            DASHBOARD
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics'
                                ? 'bg-aura-cyan text-black shadow-lg scale-105'
                                : 'text-gray-500 hover:text-white'}`}
                        >
                            ANALYTICS
                        </button>
                    </div>

                    <VoiceInput
                        module="interests"
                        onCommand={handleVoiceCommand}
                        color="cyan"
                        className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                    />
                    <button
                        onClick={() => {
                            if (!isArchived) {
                                setEditingInterest(null);
                                setNewHobbyName('');
                                setIsAddModalOpen(true);
                            }
                        }}
                        disabled={isArchived}
                        className="px-6 py-3 rounded-2xl bg-white text-black font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-shadow disabled:opacity-30 uppercase text-[10px] tracking-widest"
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

            {/* CONTENT AREA */}
            <div className="animate-fade-in">
                {activeTab === 'dashboard' && (
                    <div className="space-y-12">
                        {/* AI PROPOSALS */}
                        <AiInsightSection
                            onAnalyze={() => fetchAiRecs(true)}
                            isLoading={recLoading}
                            insight={fullAiInsight || (aiRecs.length > 0 ? { title: "AI Analysis", text: t.interests.aiRecTitleGrowth || "Recommendations Ready", emoji: "🎨" } : null)}
                            title="AURA AI Interests"
                            description={t.interests.subtitle || "AI-powered recommendations based on your interests."}
                            buttonText={aiRecs.length > 0 ? (t.common?.refresh || "Refresh") : "Start Analysis"}
                            color="purple"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                {aiRecs.map((rec, index) => (
                                    <div key={index} className={`p-6 rounded-[2rem] bg-black/40 border relative overflow-hidden group flex flex-col justify-between min-h-[250px] transition-all ${rec.isDone ? 'opacity-50 grayscale-[0.5]' : ''} ${rec.type === 'correction' ? 'border-aura-red/30' : 'border-aura-cyan/30'}`}>
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
                                                    ✅ Done
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
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAddToTask(index)}
                                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${rec.type === 'correction' ? 'bg-aura-red text-white hover:bg-aura-red/80' : 'bg-aura-cyan text-black hover:bg-aura-cyan/80'}`}
                                                        >
                                                            {rec.isAddedToTasks ? `✅ ${t.interests.aiRecTask}` : `+ ${t.interests.aiRecAddTask}`}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAIRecDone(index)}
                                                            className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all text-xs"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AiInsightSection>

                        {/* LISTS */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6 underline decoration-aura-cyan/30 decoration-4 underline-offset-8">{t.interests.positiveInterests}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {data.hobbies.filter(h => h.type === 'positive' || !h.type).map(hobby => (
                                    <HobbyCard
                                        key={hobby.id}
                                        hobby={hobby}
                                        t={t}
                                        dailyLogs={dailyLogs}
                                        isArchived={isArchived}
                                        isLogging={isLogging}
                                        setIsLogging={setIsLogging}
                                        onLog={handleLogActivity}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteInterest}
                                        onHabitLog={handleHabitLog}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6 underline decoration-aura-red/30 decoration-4 underline-offset-8">{t.interests.negativeHabits}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {data.hobbies.filter(h => h.type === 'negative').map(hobby => (
                                    <HobbyCard
                                        key={hobby.id}
                                        hobby={hobby}
                                        t={t}
                                        dailyLogs={dailyLogs}
                                        isArchived={isArchived}
                                        isLogging={isLogging}
                                        setIsLogging={setIsLogging}
                                        onLog={handleLogActivity}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteInterest}
                                        onHabitLog={handleHabitLog}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* DASHBOARD SUMMARY */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 p-8 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/10 relative overflow-hidden">
                                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                    Kunlik Holat <span className="text-xl">📊</span>
                                </h3>
                                {dailyLogs.length > 0 ? (
                                    <div className="space-y-4">
                                        {aggregatedLogs.map((log) => (
                                            <div key={log.hobbyId} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                                                    {data.hobbies.find(h => h.id === log.hobbyId)?.image || '✨'}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <h4 className="font-bold text-white">{log.hobbyName}</h4>
                                                        <span className="text-sm font-mono text-aura-cyan">
                                                            {log.totalDuration > 0 ? `${log.totalDuration} daqiqa` : `${log.totalCount} marta`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-aura-cyan transition-all duration-1000" style={{ width: `${Math.min(100, (log.totalDuration / 60) * 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-gray-500 italic">Hech qanday amaliyot topilmadi.</div>
                                )}
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/10">
                                <h3 className="text-2xl font-bold text-white mb-8">Statistika</h3>
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-aura-cyan/50 transition-all">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Jami</p>
                                        <p className="text-4xl font-display font-bold text-white group-hover:text-aura-cyan">{data.hobbies.length}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-aura-purple/50 transition-all">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Faollik</p>
                                        <p className="text-4xl font-display font-bold text-white group-hover:text-aura-purple">
                                            {aggregatedLogs.reduce((sum, l) => sum + (l.totalDuration || 0), 0)}m
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-aura-red/50 transition-all">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Nazorat</p>
                                        <p className="text-4xl font-display font-bold text-white group-hover:text-aura-red">
                                            {data.hobbies.filter(h => h.type === 'negative').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-12 animate-fade-in px-4">
                        {/* ROW 1: LIFE HARMONY ORBIT & CORE METRICS */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 p-8 rounded-[3rem] bg-black/40 backdrop-blur-3xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-aura-cyan/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                <div className="relative flex flex-col md:flex-row items-center gap-12">
                                    <div className="relative w-64 h-64 flex-shrink-0">
                                        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                                            <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                            <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                strokeDasharray={691}
                                                strokeDashoffset={691 * (1 - (data.hobbies.filter(h => h.type === 'positive').length / Math.max(1, data.hobbies.length)))}
                                                className="text-aura-cyan transition-all duration-1000"
                                                strokeLinecap="round"
                                            />
                                            <circle cx="128" cy="128" r="90" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-white/5" />
                                            <circle cx="128" cy="128" r="90" stroke="currentColor" strokeWidth="20" fill="transparent"
                                                strokeDasharray={565}
                                                strokeDashoffset={565 * (1 - (aggregatedLogs.length / Math.max(1, data.hobbies.length)))}
                                                className="text-aura-purple transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span className="text-5xl font-black text-white tracking-tighter">
                                                {Math.round((data.hobbies.filter(h => h.type === 'positive').length / Math.max(1, data.hobbies.length)) * 100)}%
                                            </span>
                                            <span className="text-[10px] text-aura-cyan font-black uppercase tracking-[0.2em] mt-2">Life Harmony</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-6">
                                        <div>
                                            <h3 className="text-3xl font-display font-black text-white mb-2 italic">Hayot Orbitasi</h3>
                                            <p className="text-gray-400 text-sm leading-relaxed max-w-md">Sizning ijobiy rivojlanishingiz va odatlaringiz muvozanati.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="text-aura-cyan text-xs font-black uppercase tracking-widest mb-1">Growth</div>
                                                <div className="text-2xl font-display font-bold text-white">+{data.hobbies.filter(h => h.type === 'positive').length}</div>
                                            </div>
                                            <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="text-aura-red text-xs font-black uppercase tracking-widest mb-1">Control</div>
                                                <div className="text-2xl font-display font-bold text-white">{data.hobbies.filter(h => h.type === 'negative').length}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="flex-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-aura-cyan/20 to-transparent border border-aura-cyan/20 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                    <p className="text-[10px] text-aura-cyan font-black uppercase tracking-[0.3em] mb-4">Consistency Rate</p>
                                    <div className="text-5xl font-display font-black text-white">92%</div>
                                </div>
                                <div className="flex-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-aura-purple/20 to-transparent border border-aura-purple/20 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                    <p className="text-[10px] text-aura-purple font-black uppercase tracking-[0.3em] mb-4">Mastery Points</p>
                                    <div className="text-5xl font-display font-black text-white">{data.hobbies.reduce((sum, h) => sum + (h.level || 1), 0) * 10}</div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: MASTERY PATH */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-display font-black text-white tracking-tight uppercase">Mastery Path</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.hobbies.filter(h => h.type === 'positive').map((hobby) => (
                                    <div key={hobby.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-aura-cyan/30 transition-all group overflow-hidden relative">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center text-3xl border border-white/5">{hobby.image || '✨'}</div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-aura-cyan font-black uppercase tracking-widest mb-1">Level</div>
                                                <div className="text-3xl font-display font-black text-white">{hobby.level || 1}</div>
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-4">{hobby.name}</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                <span>Progress</span>
                                                <span className="text-white">{Math.round(hobby.progress || 0)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-aura-cyan to-aura-purple transition-all duration-1000" style={{ width: `${hobby.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ROW 3: HEATMAP */}
                        <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl overflow-hidden relative group">
                            <h3 className="text-2xl font-display font-black text-white uppercase mb-8">Consistency Heatmap</h3>
                            <div className="flex flex-wrap gap-3">
                                {Array.from({ length: 14 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (13 - i));
                                    const dateStr = d.toISOString().split('T')[0];
                                    const activeDayLogs = historicalLogs.filter(log => log.date === dateStr);
                                    const isActive = activeDayLogs.length > 0;
                                    const dayName = d.toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'en-US', { weekday: 'short' });
                                    return (
                                        <div key={i} className="flex-1 min-w-[60px] flex flex-col items-center gap-2">
                                            <div className={`w-full aspect-square rounded-xl border transition-all duration-500 flex items-center justify-center
                                                ${isActive ? 'bg-aura-cyan/20 border-aura-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'bg-white/5 border-white/5'}
                                            `}>
                                                {isActive && <div className="w-2 h-2 rounded-full bg-aura-cyan animate-pulse"></div>}
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{dayName}</span>
                                            <span className="text-[8px] text-gray-600 font-bold">{d.getDate()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingInterest ? t.interests.editHobbyTitle : t.interests.addHobbyTitle}>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="hobby-name" className="text-xs text-gray-500 uppercase tracking-widest">{t.interests.hobbyName}</label>
                        <input
                            id="hobby-name"
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
                            aria-label="Kategoriyani tanlash"
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
                            <button onClick={() => setNewHobbyType('positive')} className={`py-4 rounded-xl border font-bold transition-all ${newHobbyType === 'positive' ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan' : 'bg-white/5 border-white/10 text-gray-500'}`}>✨ {t.interests.positive}</button>
                            <button onClick={() => setNewHobbyType('negative')} className={`py-4 rounded-xl border font-bold transition-all ${newHobbyType === 'negative' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500'}`}>⚠️ {t.interests.negative}</button>
                        </div>
                    </div>
                    {newHobbyType === 'negative' && (
                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t.interests.trackingMode}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setNewHobbyTrackingMode('frequency')} className={`py-3 rounded-xl border text-xs font-bold transition-all ${newHobbyTrackingMode === 'frequency' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500'}`}>🔢 {t.interests.trackingFrequency}</button>
                                <button onClick={() => setNewHobbyTrackingMode('binary')} className={`py-3 rounded-xl border text-xs font-bold transition-all ${newHobbyTrackingMode === 'binary' ? 'bg-aura-red/20 border-aura-red text-aura-red' : 'bg-white/5 border-white/10 text-gray-500'}`}>✅ {t.interests.trackingBinary}</button>
                            </div>
                        </div>
                    )}
                    <button onClick={handleManualAdd} disabled={!!isSaving} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${!!isSaving ? 'opacity-50' : ''} ${newHobbyType === 'positive' ? 'bg-white text-black' : 'bg-aura-red text-white'}`}>
                        {!!isSaving ? 'Saving...' : t.common.save}
                    </button>
                    <button onClick={() => setIsAddModalOpen(false)} className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:text-white transition-colors">{t.common.cancel}</button>
                </div>
            </Modal>
        </div>
    );
}

