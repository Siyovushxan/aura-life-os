// Home Screen - Complete with Aura Sphere and Command Palette
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, ModuleCard } from '../../components/ui';
import CommandPalette from '../../components/CommandPalette';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [auraScore, setAuraScore] = useState(75);
    const [moduleData, setModuleData] = useState({
        finance: { balance: 0 },
        tasks: { todayCount: 0, completedCount: 0 },
        health: { energy: 75 },
        food: { calories: 0 },
        mind: { mood: null },
    });

    useEffect(() => {
        loadSummaryData();
    }, []);

    const loadSummaryData = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Finance Balance
        onSnapshot(query(collection(db, 'users', uid, 'modules', 'finance', 'transactions')), (snapshot) => {
            let balance = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                balance += data.type === 'income' ? data.amount : -data.amount;
            });
            setModuleData(prev => ({ ...prev, finance: { balance } }));
        });

        // Tasks Summary
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        onSnapshot(query(collection(db, 'users', uid, 'modules', 'tasks', 'items')), (snapshot) => {
            let todayCount = 0;
            let completedCount = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                const dueDate = data.dueDate?.toDate?.() || new Date(data.dueDate);
                if (dueDate >= today && dueDate < tomorrow) {
                    todayCount++;
                    if (data.completed) completedCount++;
                }
            });
            setModuleData(prev => ({ ...prev, tasks: { todayCount, completedCount } }));
        });

        // Health & Mind
        const todayStr = new Date().toISOString().split('T')[0];
        onSnapshot(collection(db, 'users', uid, 'modules', 'health', 'daily'), (snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === todayStr) {
                    setModuleData(prev => ({ ...prev, health: { energy: doc.data().energy || 75 } }));
                }
            });
        });

        onSnapshot(collection(db, 'users', uid, 'modules', 'mind', 'logs'), (snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === todayStr) {
                    setModuleData(prev => ({ ...prev, mind: { mood: doc.data().mood } }));
                }
            });
        });
    };

    const auraColor = auraScore >= 80 ? Theme.colors.cyan : auraScore >= 50 ? Theme.colors.gold : Theme.colors.red;

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadSummaryData();
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.cyan} />
                }
            >
                {/* Executive Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Xush kelibsiz!</Text>
                        <Text style={styles.subGreeting}>Sizning holatingiz xulosasi</Text>
                    </View>
                    <TouchableOpacity style={styles.profileAvatar}>
                        <Text style={styles.avatarText}>👤</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Dashboard - Aura Sphere */}
                <GlassCard style={[styles.auraSphere, { borderColor: auraColor + '40' }]}>
                    <View style={[styles.sphereGlow, { backgroundColor: auraColor + '15' }]}>
                        <Text style={[styles.auraScore, { color: auraColor }]}>{auraScore}</Text>
                        <Text style={styles.auraLabel}>AURA SCORE</Text>
                    </View>
                    <Text style={styles.auraInsight}>Bugun samaradorlik yuqori darajada! 🔥</Text>
                </GlassCard>

                {/* Metrics Summary Grid */}
                <View style={styles.summaryGrid}>
                    <GlassCard style={styles.summaryCard}>
                        <Text style={styles.cardIcon}>💰</Text>
                        <Text style={styles.cardValue}>${moduleData.finance.balance.toLocaleString()}</Text>
                        <Text style={styles.cardLabel}>Balans</Text>
                    </GlassCard>

                    <GlassCard style={styles.summaryCard}>
                        <Text style={styles.cardIcon}>✅</Text>
                        <Text style={styles.cardValue}>{moduleData.tasks.completedCount}/{moduleData.tasks.todayCount}</Text>
                        <Text style={styles.cardLabel}>Vazifalar</Text>
                    </GlassCard>

                    <GlassCard style={styles.summaryCard}>
                        <Text style={styles.cardIcon}>⚡</Text>
                        <Text style={styles.cardValue}>{moduleData.health.energy}%</Text>
                        <Text style={styles.cardLabel}>Energiya</Text>
                    </GlassCard>

                    <GlassCard style={styles.summaryCard}>
                        <Text style={styles.cardIcon}>🧠</Text>
                        <Text style={styles.cardValue}>{moduleData.mind.mood === 'positive' ? '😊' : '😐'}</Text>
                        <Text style={styles.cardLabel}>Kayfiyat</Text>
                    </GlassCard>
                </View>

                {/* AI Suggestions Section */}
                <Text style={styles.sectionTitle}>AI Maslahatlari</Text>
                <GlassCard style={styles.insightCard}>
                    <Text style={styles.insightText}>
                        "Moliya bo'limida xarajatlar ko'paygan. Bugun fokus vaqtini 20 daqiqaga oshirish tavsiya etiladi."
                    </Text>
                </GlassCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollView: {
        flex: 1,
        padding: Theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.xl,
        marginTop: Platform.OS === 'ios' ? 40 : 10,
    },
    greeting: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        fontFamily: Theme.typography.fonts.heading,
    },
    subGreeting: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
    },
    profileAvatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.gray[200],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
    },
    auraSphere: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
    },
    sphereGlow: {
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.md,
    },
    auraScore: {
        fontSize: 72,
        fontWeight: Theme.typography.weights.bold,
    },
    auraLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        letterSpacing: 2,
    },
    auraInsight: {
        color: Theme.colors.gray[400],
        fontSize: Theme.typography.sizes.sm,
        fontStyle: 'italic',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.md,
        justifyContent: 'space-between',
        marginBottom: Theme.spacing.lg,
    },
    summaryCard: {
        width: '47.5%',
        padding: Theme.spacing.md,
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    cardValue: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    cardLabel: {
        fontSize: Theme.typography.sizes.xs,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.md,
    },
    insightCard: {
        padding: Theme.spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.cyan,
    },
    insightText: {
        color: Theme.colors.gray[300],
        fontSize: Theme.typography.sizes.sm,
        lineHeight: 20,
    },
});
