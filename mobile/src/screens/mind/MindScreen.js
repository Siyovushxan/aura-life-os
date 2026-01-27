// Mind Screen - Full Mood Tracking Implementation
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function MindScreen() {
    const [todayMood, setTodayMood] = useState(null);
    const [todayEnergy, setTodayEnergy] = useState(5);
    const [todayNote, setTodayNote] = useState('');
    const [history, setHistory] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);

    useEffect(() => {
        loadTodayMood();
        loadHistory();
    }, []);

    const loadTodayMood = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, 'users', uid, 'modules', 'mind', 'logs', today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setTodayMood(data.mood);
            setTodayEnergy(data.energy || 5);
            setTodayNote(data.note || '');
        }
    };

    const loadHistory = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'users', uid, 'modules', 'mind', 'logs'),
            orderBy('timestamp', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = [];
            snapshot.forEach((doc) => {
                logs.push({ id: doc.id, ...doc.data() });
            });
            setHistory(logs);
        });

        return unsubscribe;
    };

    const logMood = async (mood) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        await setDoc(doc(db, 'users', uid, 'modules', 'mind', 'logs', today), {
            mood,
            energy: todayEnergy,
            note: todayNote,
            timestamp: new Date(),
        });

        setTodayMood(mood);
        setShowLogModal(false);
    };

    const getMoodEmoji = (mood) => {
        switch (mood) {
            case 'positive': return '😊';
            case 'neutral': return '😐';
            case 'negative': return '😢';
            default: return '❓';
        }
    };

    const getMoodColor = (mood) => {
        switch (mood) {
            case 'positive': return Theme.colors.green;
            case 'neutral': return Theme.colors.gold;
            case 'negative': return Theme.colors.red;
            default: return Theme.colors.gray[500];
        }
    };

    const getMoodLabel = (mood) => {
        switch (mood) {
            case 'positive': return 'Yaxshi';
            case 'neutral': return 'O\'rtacha';
            case 'negative': return 'Yomon';
            default: return 'Noma\'lum';
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Mind</Text>
                    <Text style={styles.subtitle}>Kayfiyat va ruhiy holat</Text>
                </View>

                {/* Today's Mood Card */}
                <GlassCard style={[styles.moodCard, todayMood && { borderColor: getMoodColor(todayMood) }]}>
                    <Text style={styles.moodLabel}>Bugungi Kayfiyat</Text>

                    {todayMood ? (
                        <View style={styles.moodDisplay}>
                            <Text style={styles.moodEmoji}>{getMoodEmoji(todayMood)}</Text>
                            <Text style={[styles.moodText, { color: getMoodColor(todayMood) }]}>
                                {getMoodLabel(todayMood)}
                            </Text>
                            <Text style={styles.energyText}>
                                Energiya: {todayEnergy}/10
                            </Text>
                            {todayNote ? (
                                <Text style={styles.noteText}>"{todayNote}"</Text>
                            ) : null}
                        </View>
                    ) : (
                        <View style={styles.noMoodDisplay}>
                            <Text style={styles.noMoodText}>Hali kiritilmagan</Text>
                        </View>
                    )}

                    <GlassButton
                        title={todayMood ? "Yangilash" : "Kayfiyatni Kiriting"}
                        variant="primary"
                        color={Theme.colors.red}
                        onPress={() => setShowLogModal(true)}
                        style={{ marginTop: Theme.spacing.md }}
                    />
                </GlassCard>

                {/* Quick Mood Buttons */}
                <View style={styles.quickMoodSection}>
                    <Text style={styles.sectionTitle}>Tezkor Belgilash</Text>
                    <View style={styles.quickMoodRow}>
                        <TouchableOpacity
                            style={[styles.quickMoodButton, { borderColor: Theme.colors.green }]}
                            onPress={() => logMood('positive')}
                        >
                            <Text style={styles.quickMoodEmoji}>😊</Text>
                            <Text style={[styles.quickMoodText, { color: Theme.colors.green }]}>Yaxshi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickMoodButton, { borderColor: Theme.colors.gold }]}
                            onPress={() => logMood('neutral')}
                        >
                            <Text style={styles.quickMoodEmoji}>😐</Text>
                            <Text style={[styles.quickMoodText, { color: Theme.colors.gold }]}>O'rtacha</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickMoodButton, { borderColor: Theme.colors.red }]}
                            onPress={() => logMood('negative')}
                        >
                            <Text style={styles.quickMoodEmoji}>😢</Text>
                            <Text style={[styles.quickMoodText, { color: Theme.colors.red }]}>Yomon</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* History */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>So'nggi 7 kun</Text>

                    <View style={styles.historyRow}>
                        {history.slice(0, 7).map((log, index) => (
                            <View key={log.id} style={styles.historyItem}>
                                <Text style={[styles.historyEmoji, { opacity: 1 - (index * 0.1) }]}>
                                    {getMoodEmoji(log.mood)}
                                </Text>
                                <Text style={styles.historyDate}>
                                    {new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {history.length === 0 && (
                        <Text style={styles.emptyText}>Hali ma'lumot yo'q</Text>
                    )}
                </View>

                {/* AI Insights Card */}
                <GlassCard style={styles.insightsCard}>
                    <Text style={styles.insightsTitle}>🧠 AI Tahlil</Text>
                    <Text style={styles.insightsText}>
                        {history.length >= 3
                            ? `So'nggi ${Math.min(history.length, 7)} kunda ${history.filter(h => h.mood === 'positive').length} kun yaxshi kayfiyatda bo'ldingiz.`
                            : 'Kamida 3 kun ma\'lumot to\'plang, AI tahlil qiladi.'
                        }
                    </Text>
                </GlassCard>
            </ScrollView>

            {/* Log Mood Modal */}
            {showLogModal && (
                <Modal visible={showLogModal} transparent animationType="fade" onRequestClose={() => setShowLogModal(false)}>
                    <View style={modalStyles.overlay}>
                        <GlassCard style={modalStyles.modal}>
                            <Text style={modalStyles.title}>Kayfiyatni Kiriting</Text>

                            {/* Mood Selection */}
                            <Text style={modalStyles.label}>Bugun qanday his qilyapsiz?</Text>
                            <View style={modalStyles.moodRow}>
                                {['positive', 'neutral', 'negative'].map((mood) => (
                                    <TouchableOpacity
                                        key={mood}
                                        style={[
                                            modalStyles.moodOption,
                                            todayMood === mood && {
                                                backgroundColor: getMoodColor(mood) + '20',
                                                borderColor: getMoodColor(mood)
                                            }
                                        ]}
                                        onPress={() => setTodayMood(mood)}
                                    >
                                        <Text style={modalStyles.moodOptionEmoji}>{getMoodEmoji(mood)}</Text>
                                        <Text style={[
                                            modalStyles.moodOptionText,
                                            todayMood === mood && { color: getMoodColor(mood) }
                                        ]}>
                                            {getMoodLabel(mood)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Energy Slider */}
                            <Text style={modalStyles.label}>Energiya darajasi: {todayEnergy}/10</Text>
                            <View style={modalStyles.energyRow}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            modalStyles.energyDot,
                                            todayEnergy >= level && { backgroundColor: Theme.colors.cyan }
                                        ]}
                                        onPress={() => setTodayEnergy(level)}
                                    />
                                ))}
                            </View>

                            {/* Note */}
                            <Text style={modalStyles.label}>Izoh (ixtiyoriy)</Text>
                            <TextInput
                                style={modalStyles.input}
                                placeholder="Bugun nima bo'ldi?"
                                placeholderTextColor={Theme.colors.gray[500]}
                                value={todayNote}
                                onChangeText={setTodayNote}
                                multiline
                            />

                            {/* Actions */}
                            <View style={modalStyles.actions}>
                                <GlassButton
                                    title="Bekor"
                                    variant="secondary"
                                    onPress={() => setShowLogModal(false)}
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <GlassButton
                                    title="Saqlash"
                                    variant="primary"
                                    color={getMoodColor(todayMood)}
                                    onPress={() => logMood(todayMood)}
                                    style={{ flex: 1, marginLeft: 8 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>
            )}
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
        marginBottom: Theme.spacing.lg,
    },
    title: {
        fontSize: Theme.typography.sizes['3xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    subtitle: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        marginTop: 4,
    },
    moodCard: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
        marginBottom: Theme.spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    moodLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    moodDisplay: {
        alignItems: 'center',
        marginTop: Theme.spacing.md,
    },
    moodEmoji: {
        fontSize: 80,
        marginBottom: Theme.spacing.sm,
    },
    moodText: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
    },
    energyText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
        marginTop: Theme.spacing.sm,
    },
    noteText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        fontStyle: 'italic',
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
    noMoodDisplay: {
        alignItems: 'center',
        marginVertical: Theme.spacing.xl,
    },
    noMoodText: {
        fontSize: Theme.typography.sizes.lg,
        color: Theme.colors.gray[500],
    },
    quickMoodSection: {
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.md,
    },
    quickMoodRow: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
    },
    quickMoodButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Theme.spacing.lg,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderRadius: Theme.radius.lg,
        borderWidth: 2,
    },
    quickMoodEmoji: {
        fontSize: 36,
        marginBottom: Theme.spacing.sm,
    },
    quickMoodText: {
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.semibold,
    },
    historySection: {
        marginBottom: Theme.spacing.lg,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    historyItem: {
        alignItems: 'center',
    },
    historyEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    historyDate: {
        fontSize: Theme.typography.sizes.xs,
        color: Theme.colors.gray[600],
    },
    emptyText: {
        textAlign: 'center',
        color: Theme.colors.gray[500],
        marginTop: Theme.spacing.md,
    },
    insightsCard: {
        marginBottom: Theme.spacing.xl,
    },
    insightsTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.sm,
    },
    insightsText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        lineHeight: 22,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        padding: Theme.spacing.xl,
    },
    title: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.lg,
    },
    label: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
    },
    moodRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
    },
    moodOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderRadius: Theme.radius.md,
        borderWidth: 2,
        borderColor: Theme.colors.gray[100],
    },
    moodOptionEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    moodOptionText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.white,
    },
    energyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    energyDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.colors.gray[300],
        borderWidth: 2,
        borderColor: Theme.colors.gray[500],
    },
    input: {
        backgroundColor: Theme.glass.input.backgroundColor,
        borderWidth: Theme.glass.input.borderWidth,
        borderColor: Theme.glass.input.borderColor,
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.base,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        marginTop: Theme.spacing.xl,
    },
});
