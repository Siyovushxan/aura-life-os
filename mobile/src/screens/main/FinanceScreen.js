import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function FinanceScreen({ navigation }) {
    const { t, language } = useLanguage();
    const [balance] = useState(1450200);
    const [income] = useState(5000000);
    const [spent] = useState(3549800);
    const [financeInsight, setFinanceInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [amount, setAmount] = useState(0);

    const wheelValues = Array.from({ length: 100 }, (_, i) => (i + 1) * 10000);

    const fetchFinanceAnalysis = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getFinanceInsight', {
                data: { balance, income, spent },
                language: language
            });
            setFinanceInsight(result.insight || result);
        } catch (error) {
            setFinanceInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleWheelScroll = () => {
        Haptics.selectionAsync();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                {!navigation.canGoBack() ? null : (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>{t.common.back}</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{t.finance.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.wealthHero}>
                    <LinearGradient
                        colors={['rgba(0, 240, 255, 0.15)', 'transparent']}
                        style={styles.heroGradient}
                    />
                    <Text style={styles.wealthLabel}>TOTAL WEALTH</Text>
                    <Text style={styles.wealthValue}>{balance.toLocaleString()} UZS</Text>
                    <View style={styles.trendContainer}>
                        <Text style={styles.trendText}>+2.4% {t.dashboard.thisMonth}</Text>
                    </View>
                </View>

                {/* Haptic Wheel Trigger */}
                <TouchableOpacity
                    style={styles.quickAddCard}
                    onPress={() => setShowPicker(!showPicker)}
                >
                    <Text style={styles.quickAddText}>KIRITISH REJIMI: {showPicker ? 'FAOL' : 'YOPILGAN'}</Text>
                    <Text style={styles.quickAddAmount}>{amount.toLocaleString()} UZS</Text>
                </TouchableOpacity>

                {showPicker && (
                    <View style={styles.wheelWrapper}>
                        <Text style={styles.wheelHint}>SURISH ORQALI QIYMATHI TANLANG</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleWheelScroll}
                            scrollEventThrottle={16}
                            contentContainerStyle={styles.wheelScrollContent}
                        >
                            {wheelValues.map(v => (
                                <TouchableOpacity
                                    key={v}
                                    style={[styles.wheelItem, amount === v && styles.wheelItemSelected]}
                                    onPress={() => {
                                        setAmount(v);
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    }}
                                >
                                    <View style={styles.wheelLine} />
                                    <Text style={[styles.wheelText, amount === v && styles.wheelTextSelected]}>
                                        {(v / 1000)}K
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* AI Insight */}
                <TouchableOpacity
                    style={styles.analysisBox}
                    onPress={fetchFinanceAnalysis}
                >
                    <View style={styles.analysisHeader}>
                        <Text style={styles.analysisTitle}>FINANCIAL STRATEGY</Text>
                        {isAnalyzing && <ActivityIndicator size="small" color={Theme.colors.gold} />}
                    </View>
                    <Text style={styles.analysisText}>
                        {financeInsight || "Tap for AI financial growth analysis."}
                    </Text>
                </TouchableOpacity>

                <View style={styles.timeline}>
                    <Text style={styles.sectionTitle}>TIMELINE</Text>
                    {[
                        { id: 1, title: 'Oziq-ovqat', amount: -50000, time: '12:30', emoji: '🛒' },
                        { id: 2, title: 'Oylik Maosh', amount: 5000000, time: '09:00', emoji: '💰' },
                        { id: 3, title: 'Kofe', amount: -25000, time: 'Kecha', emoji: '☕' },
                    ].map((item, index) => (
                        <View key={item.id} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <Text style={styles.timelineTime}>{item.time}</Text>
                                <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                                <View style={styles.timelineLine} />
                            </View>
                            <View style={styles.timelineContent}>
                                <View style={styles.txRow}>
                                    <Text style={styles.txTitle}>{item.emoji} {item.title}</Text>
                                    <Text style={[styles.txAmount, { color: item.amount > 0 ? Theme.colors.green : '#FFF' }]}>
                                        {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
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
    scroll: {
        padding: 24,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: Theme.colors.cyan,
        fontSize: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    wealthHero: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 32,
        padding: 32,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    wealthLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Theme.colors.textDim,
        letterSpacing: 3,
        marginBottom: 12,
    },
    wealthValue: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
    },
    trendContainer: {
        marginTop: 16,
        backgroundColor: 'rgba(0, 255, 148, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        alignSelf: 'flex-start',
    },
    trendText: {
        color: Theme.colors.green,
        fontSize: 10,
        fontWeight: '900',
    },
    quickAddCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quickAddText: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    quickAddAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: Theme.colors.cyan,
    },
    wheelWrapper: {
        marginBottom: 32,
    },
    wheelHint: {
        fontSize: 9,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 2,
    },
    wheelScrollContent: {
        paddingHorizontal: 150,
        alignItems: 'center',
    },
    wheelItem: {
        width: 60,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        opacity: 0.3,
    },
    wheelItemSelected: {
        opacity: 1,
        transform: [{ scale: 1.2 }],
    },
    wheelLine: {
        width: 2,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 8,
    },
    wheelText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    wheelTextSelected: {
        color: Theme.colors.cyan,
    },
    analysisBox: {
        padding: 24,
        backgroundColor: 'rgba(250, 204, 21, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.1)',
        marginBottom: 32,
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analysisTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.gold,
        letterSpacing: 2,
    },
    analysisText: {
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        fontSize: 14,
    },
    timeline: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: Theme.colors.textDim,
        marginBottom: 24,
        letterSpacing: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
        minHeight: 80,
    },
    timelineLeft: {
        width: 60,
        alignItems: 'center',
    },
    timelineTime: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 1,
    },
    timelineDotActive: {
        backgroundColor: Theme.colors.cyan,
        shadowColor: Theme.colors.cyan,
        shadowRadius: 10,
        shadowOpacity: 1,
    },
    timelineLine: {
        width: 1,
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 20,
        paddingBottom: 24,
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
    },
    txTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '900',
    },
});
