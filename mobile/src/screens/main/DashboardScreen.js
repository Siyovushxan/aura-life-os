import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { BentoCard } from '../../components/BentoCard';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceButton from '../../components/VoiceButton';
import ButterflyEffect from '../../components/ButterflyEffect';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { analyzeCorrelations, calculateButterflyScore } from '../../services/correlationService';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';
import { createOrUpdateDailyLog, getLocalTodayStr } from '../../services/dailyService';
import { collection, query, where, getDocs, limit, doc, onSnapshot } from 'firebase/firestore';

export default function DashboardScreen({ navigation }) {
    const { t, language, changeLanguage } = useLanguage();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time Data State
    const [financeData, setFinanceData] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [taskCount, setTaskCount] = useState(0);

    const [correlations, setCorrelations] = useState([]);
    const [butterflyScore, setButterflyScore] = useState({ score: 0 });
    const [aiInsight, setAiInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const user = auth.currentUser;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        if (!user) return;

        // 1. Finance Subscription
        const financeUnsub = onSnapshot(doc(db, `users/${user.uid}/finance/overview`), (snap) => {
            if (snap.exists()) setFinanceData(snap.data());
        });

        // 2. Health Subscription (Today)
        const today = getLocalTodayStr();
        const healthUnsub = onSnapshot(doc(db, `users/${user.uid}/health_logs/${today}`), (snap) => {
            if (snap.exists()) setHealthData(snap.data());
        });

        // 3. Tasks Subscription (Count Pending)
        const tasksUnsub = onSnapshot(query(collection(db, `users/${user.uid}/tasks`), where("status", "==", "pending")), (snap) => {
            setTaskCount(snap.size);
        });

        return () => {
            clearInterval(timer);
            financeUnsub();
            healthUnsub();
            tasksUnsub();
        };
    }, [user?.uid]);

    useEffect(() => {
        // Deep Correlation Analysis (Real Data)
        const dataForAnalysis = {
            health: healthData?.activity?.steps || 0,
            finance: financeData?.totalBalance || 0,
            tasks: taskCount,
            sleep: parseFloat(healthData?.sleep?.duration || '0') || 0,
            mood: healthData?.vitals?.stress || 50
        };

        const foundCorrelations = analyzeCorrelations(dataForAnalysis);
        const scoreData = calculateButterflyScore(dataForAnalysis);

        setCorrelations(foundCorrelations);
        setButterflyScore(scoreData);
    }, [financeData, healthData, taskCount]);

    const fetchAITahlil = async () => {
        if (!user) return;
        setIsAnalyzing(true);
        setAiInsight(t.dashboard.analyzing);

        try {
            // pass real module data to AI
            const insight = await callBackend('getDailyInsight', {
                finance: {
                    totalBalance: financeData?.totalBalance || 0,
                    monthlyIncome: financeData?.monthlyIncome || 0,
                    monthlySpent: financeData?.monthlySpent || 0
                },
                health: {
                    steps: healthData?.activity?.steps || 0,
                    heartRate: healthData?.vitals?.heartRate || 72,
                    sleepDuration: healthData?.sleep?.duration || '0h'
                },
                tasks: { pending: taskCount },
                language: language
            });

            if (insight && insight.insight) {
                setAiInsight(insight.insight);
            } else if (typeof insight === 'string') {
                setAiInsight(insight);
            } else {
                setAiInsight(t.dashboard.needData);
            }
        } catch (error) {
            console.error("AI Tahlil Error:", error);
            setAiInsight(t.common.error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveInsight = async () => {
        if (!user || !aiInsight || isAnalyzing) return;
        try {
            const today = getLocalTodayStr();
            await createOrUpdateDailyLog(user.uid, today, {
                aiInsight: aiInsight
            });
            Alert.alert(t.common.success, "Insight saved to History.");
        } catch (error) {
            Alert.alert(t.common.error, "Failed to save.");
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const handleVoiceCommand = (command) => {
        if (command.module === 'error') {
            Alert.alert(t.common.error, command.confirmation_message);
            return;
        }

        Alert.alert("AURA AI", command.confirmation_message);

        // Navigation logic based on intent
        if (command.module === 'health' || command.module === 'vitals') {
            navigation.navigate('Health');
        } else if (command.module === 'finance' || command.module === 'wealth') {
            navigation.navigate('Finance');
        } else if (command.module === 'family') {
            navigation.navigate('Family');
        } else if (command.module === 'tasks') {
            navigation.navigate('Tasks');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View>
                        <View style={styles.brandContainer}>
                            <View style={styles.brandDot} />
                            <Text style={styles.brandText}>{t.nav.aura}</Text>
                        </View>
                        <Text style={styles.welcomeText}>
                            {t.dashboard.welcome}, {user?.displayName || (user?.email?.split('@')[0]) || 'User'}
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <VoiceButton
                            module="dashboard"
                            onCommand={handleVoiceCommand}
                            color={Theme.colors.cyan}
                        />
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Text style={styles.logoutEmoji}>🚪</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Language Switcher */}
                <View style={styles.langSwitcher}>
                    {['uz', 'en', 'ru'].map(lang => (
                        <TouchableOpacity
                            key={lang}
                            onPress={() => changeLanguage(lang)}
                            style={[styles.langItem, language === lang && styles.langItemActive]}
                        >
                            <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                                {lang.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Butterfly Effect Widget */}
                {butterflyScore && (
                    <ButterflyEffect
                        score={butterflyScore.score}
                        correlations={correlations}
                        onPressCorrelation={(c) => {
                            const target = c.modules[1];
                            if (target === 'Health') navigation.navigate('Health');
                            else if (target === 'Finance') navigation.navigate('Finance');
                            else if (target === 'Tasks') navigation.navigate('Tasks');
                        }}
                    />
                )}

                {/* AI Insight Card (Enhanced) */}
                <TouchableOpacity
                    style={styles.aiInsightCard}
                    onPress={fetchAITahlil}
                    disabled={isAnalyzing}
                >
                    <LinearGradient
                        colors={[Theme.colors.purple + '20', Theme.colors.cyan + '10']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.aiGlow}
                    />
                    <View style={styles.aiCardHeader}>
                        <View style={styles.aiTitleGroup}>
                            <View style={[styles.pulseDot, isAnalyzing && styles.pulseActive]} />
                            <Text style={styles.aiTitleText}>AURA NEURAL INSIGHT</Text>
                        </View>
                        {isAnalyzing && <ActivityIndicator size="small" color={Theme.colors.cyan} />}
                    </View>

                    {aiInsight && !isAnalyzing ? (
                        <View style={styles.insightFrame}>
                            <Text style={styles.insightText}>{aiInsight}</Text>
                            <View style={styles.insightFooter}>
                                <TouchableOpacity style={styles.actionPill} onPress={handleSaveInsight}>
                                    <Text style={styles.actionPillText}>{t.common.save}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconPill} onPress={() => navigation.navigate('History')}>
                                    <Text style={styles.iconPillEmoji}>🧠</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        !isAnalyzing && <Text style={styles.aiPlaceholder}>{t.dashboard.status.toUpperCase()}</Text>
                    )}
                </TouchableOpacity>

                {/* Dynamic Bento Grid (Real Data) */}
                <View style={styles.grid}>
                    {/* Wealth - Full Width Row */}
                    <BentoCard
                        title={t.dashboard.wealth}
                        value={financeData?.totalBalance ? `${financeData.totalBalance.toLocaleString()} UZS` : '0 UZS'}
                        subtitle={financeData?.monthlyIncome ? `+${financeData.monthlyIncome.toLocaleString()} BU OY` : '+0 BU OY'}
                        emoji="💰"
                        color={Theme.colors.gold}
                        size="full"
                        trend={financeData?.monthlyIncome > 0 ? { value: '+2.4%', up: true } : null}
                        onPress={() => navigation.navigate('Finance')}
                    />

                    {/* Health & Tasks - Half Width Row */}
                    <BentoCard
                        title={t.dashboard.vitality}
                        value={healthData?.bodyBattery?.current ? `${healthData.bodyBattery.current}%` : '0%'}
                        subtitle={healthData?.bodyBattery?.status || 'INITIALIZING'}
                        emoji="⚡"
                        color={Theme.colors.green}
                        onPress={() => navigation.navigate('Health')}
                    />
                    <BentoCard
                        title={t.dashboard.tasks}
                        value={taskCount.toString()}
                        subtitle="PENDING"
                        emoji="📝"
                        color={Theme.colors.cyan}
                        onPress={() => navigation.navigate('Tasks')}
                    />

                    {/* Nutrition - Full Width with different style */}
                    <BentoCard
                        title={t.dashboard.nutrition}
                        value={healthData?.activity?.calories ? `${healthData.activity.calories} KCAL` : '0 KCAL'}
                        subtitle="ENERGY CONSUMED"
                        emoji="🥗"
                        color={Theme.colors.green}
                        size="full"
                        onPress={() => navigation.navigate('FoodCamera')}
                        style={styles.wideNutrition}
                    />

                    {/* Family & Goals */}
                    <BentoCard
                        title={t.dashboard.family}
                        value="3 A'ZO"
                        subtitle="ALL SECURE"
                        emoji="👨‍👩‍👧‍👦"
                        color={Theme.colors.cyan}
                        onPress={() => navigation.navigate('Family')}
                    />
                    <BentoCard
                        title="CHRONOS"
                        value={currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        subtitle={currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric' }).toUpperCase()}
                        emoji="⌚"
                        color={Theme.colors.gold}
                        onPress={() => { }}
                    />

                    {/* Secondary Metrics */}
                    <BentoCard
                        title="STRESS"
                        value={healthData?.vitals?.stress ? `${healthData.vitals.stress}%` : '22%'}
                        subtitle="NEURAL LOAD"
                        emoji="🧠"
                        color={Theme.colors.purple}
                    />
                    <BentoCard
                        title="HYDRATION"
                        value={healthData?.hydration?.current ? `${healthData.hydration.current} ML` : '0 ML'}
                        subtitle="GOAL: 2.5L"
                        emoji="💧"
                        color={Theme.colors.cyan}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    langSwitcher: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    langItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    langItemActive: {
        backgroundColor: Theme.colors.cyan + '20',
        borderColor: Theme.colors.cyan,
    },
    langText: {
        color: Theme.colors.textDim,
        fontSize: 10,
        fontWeight: 'bold',
    },
    langTextActive: {
        color: Theme.colors.cyan,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.cyan,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    welcomeText: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    logoutEmoji: {
        fontSize: 18,
    },
    aiInsightCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(192, 132, 252, 0.3)',
        overflow: 'hidden',
        shadowColor: Theme.colors.purple,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 8,
    },
    aiGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    aiCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.purple,
    },
    pulseActive: {
        backgroundColor: Theme.colors.gold,
    },
    aiTitleText: {
        fontSize: 10,
        fontWeight: '900',
        color: Theme.colors.purple,
        letterSpacing: 2,
    },
    aiPlaceholder: {
        color: Theme.colors.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 2,
        marginVertical: 10,
    },
    insightFrame: {
        marginTop: 4,
    },
    insightText: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
        fontWeight: '500',
    },
    insightFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionPill: {
        backgroundColor: Theme.colors.purple + '20',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.purple + '40',
    },
    actionPillText: {
        color: Theme.colors.purple,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 12,
    },
    iconPillEmoji: {
        fontSize: 14,
    },
    wideNutrition: {
        minHeight: 120,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    }
});
