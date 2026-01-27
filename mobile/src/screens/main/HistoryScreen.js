import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { auth } from '../../firebaseConfig';
import { getRecentLogs } from '../../services/dailyService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function HistoryScreen() {
    const { t } = useLanguage();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const user = auth.currentUser;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const logs = await getRecentLogs(user.uid);
            // Filter logs that have AI insights
            const insights = logs
                .filter(log => log.aiInsight)
                .map(log => ({
                    id: log.id,
                    module: 'AI Insight',
                    title: 'Daily Analysis',
                    insight: log.aiInsight,
                    timestamp: log.date,
                    color: Theme.colors.cyan
                }));
            setHistory(insights);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.timelineItem}>
            <View style={styles.timelineSide}>
                <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
                <View style={[styles.timelineLine, { height: '100%' }]} />
            </View>
            <View style={styles.historyCard}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.02)', 'transparent']}
                    style={styles.cardGradient}
                />
                <View style={styles.cardHeader}>
                    <View style={[styles.moduleBadge, { borderColor: item.color + '40' }]}>
                        <Text style={[styles.moduleText, { color: item.color }]}>{item.module.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardInsight}>{item.insight}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t.history.title}</Text>
                <Text style={styles.subtitle}>{t.history.subtitle}</Text>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator color={Theme.colors.cyan} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.cyan} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t.history.empty}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    timelineItem: {
        flexDirection: 'row',
    },
    timelineSide: {
        width: 20,
        alignItems: 'center',
        marginRight: 10,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        zIndex: 1,
        marginTop: 24,
    },
    timelineLine: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        position: 'absolute',
        top: 34,
        bottom: 0,
    },
    historyCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    moduleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    moduleText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    cardTimestamp: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    cardInsight: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        opacity: 0.8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: Theme.colors.textDim,
        fontSize: 14,
        letterSpacing: 1,
    }
});
