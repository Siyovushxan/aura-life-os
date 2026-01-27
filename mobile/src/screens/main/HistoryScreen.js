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
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={[styles.moduleBadge, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                <Text style={[styles.moduleText, { color: item.color }]}>{item.module.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardInsight}>{item.insight}</Text>
            <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
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
    historyCard: {
        backgroundColor: Theme.colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    moduleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
    },
    moduleText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    cardInsight: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardTimestamp: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: Theme.colors.textDim,
        fontSize: 14,
    }
});
