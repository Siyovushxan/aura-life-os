// Focus Screen - Full Pomodoro Timer Implementation
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Vibration, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function FocusScreen() {
    const [isRunning, setIsRunning] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(25);
    const [timeRemaining, setTimeRemaining] = useState(25 * 60);
    const [totalFocusToday, setTotalFocusToday] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const intervalRef = useRef(null);

    const durations = [5, 10, 15, 20, 25];

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const handleTimerComplete = async () => {
        setIsRunning(false);
        clearInterval(intervalRef.current);

        // Vibration pattern
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        }

        // Log session to Firebase
        const uid = auth.currentUser?.uid;
        if (uid && sessionStartTime) {
            await addDoc(collection(db, 'users', uid, 'modules', 'focus', 'sessions'), {
                duration: selectedDuration,
                completed: true,
                failed: false,
                startTime: sessionStartTime,
                endTime: Timestamp.now(),
            });
        }

        setTotalFocusToday((prev) => prev + selectedDuration);
        setShowCompleteModal(true);
    };

    const startTimer = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setTimeRemaining(selectedDuration * 60);
        setSessionStartTime(Timestamp.now());
        setIsRunning(true);
    };

    const giveUp = async () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setIsRunning(false);
        clearInterval(intervalRef.current);

        // Log failed session
        const uid = auth.currentUser?.uid;
        if (uid && sessionStartTime) {
            const elapsed = Math.floor((selectedDuration * 60 - timeRemaining) / 60);
            await addDoc(collection(db, 'users', uid, 'modules', 'focus', 'sessions'), {
                duration: selectedDuration,
                completed: false,
                failed: true,
                actualMinutes: elapsed,
                startTime: sessionStartTime,
                endTime: Timestamp.now(),
            });
        }

        setTimeRemaining(selectedDuration * 60);
    };

    const selectDuration = (duration) => {
        if (!isRunning) {
            setSelectedDuration(duration);
            setTimeRemaining(duration * 60);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 1 - (timeRemaining / (selectedDuration * 60));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Focus</Text>
                <Text style={styles.subtitle}>Chuqur Ish Rejimi</Text>
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                    {/* Progress Ring */}
                    <View style={[styles.progressRing, { opacity: progress }]} />

                    <View style={styles.timerInner}>
                        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                        <Text style={styles.timerLabel}>
                            {isRunning ? 'Davom etyapti...' : 'Tayyor'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Duration Selector */}
            {!isRunning && (
                <View style={styles.durationSection}>
                    <Text style={styles.sectionTitle}>Vaqtni Tanlang</Text>
                    <View style={styles.durationRow}>
                        {durations.map((duration) => (
                            <TouchableOpacity
                                key={duration}
                                style={[
                                    styles.durationButton,
                                    selectedDuration === duration && styles.durationButtonActive
                                ]}
                                onPress={() => selectDuration(duration)}
                            >
                                <Text style={[
                                    styles.durationText,
                                    selectedDuration === duration && styles.durationTextActive
                                ]}>
                                    {duration}
                                </Text>
                                <Text style={styles.durationLabel}>min</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
                {isRunning ? (
                    <TouchableOpacity style={styles.giveUpButton} onPress={giveUp}>
                        <Text style={styles.giveUpText}>🛑 Bekor qilish</Text>
                    </TouchableOpacity>
                ) : (
                    <GlassButton
                        title="🎯 Fokusni Boshlash"
                        variant="primary"
                        color={Theme.colors.purple}
                        onPress={startTimer}
                        style={{ paddingVertical: Theme.spacing.lg }}
                    />
                )}
            </View>

            {/* Today's Stats */}
            <GlassCard style={styles.statsCard}>
                <Text style={styles.statsTitle}>Bugungi Fokus</Text>
                <Text style={styles.statsValue}>{totalFocusToday} daqiqa</Text>
                <Text style={styles.statsSubtitle}>
                    {totalFocusToday >= 120 ? '🏆 Ajoyib ishlash!' :
                        totalFocusToday >= 60 ? '👍 Yaxshi davom eting!' :
                            'Fokus vaqtini oshiring!'}
                </Text>
            </GlassCard>

            {/* Tips */}
            <GlassCard style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Maslahat</Text>
                <Text style={styles.tipsText}>
                    {isRunning
                        ? 'Telefonni yopib qo\'ying va faqat vazifangizga e\'tibor bering.'
                        : 'Optimal fokus vaqti 25 daqiqa (Pomodoro). Keyin 5 daqiqa dam oling.'
                    }
                </Text>
            </GlassCard>

            {/* Complete Modal */}
            <Modal visible={showCompleteModal} transparent animationType="fade">
                <View style={modalStyles.overlay}>
                    <GlassCard style={modalStyles.modal}>
                        <Text style={modalStyles.emoji}>🎉</Text>
                        <Text style={modalStyles.title}>Tabriklayman!</Text>
                        <Text style={modalStyles.text}>
                            {selectedDuration} daqiqalik fokus sessiyasini muvaffaqiyatli yakunladingiz!
                        </Text>
                        <GlassButton
                            title="Davom etish"
                            variant="primary"
                            color={Theme.colors.green}
                            onPress={() => setShowCompleteModal(false)}
                        />
                    </GlassCard>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
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
    timerContainer: {
        alignItems: 'center',
        marginVertical: Theme.spacing.xl,
    },
    timerCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 6,
        borderColor: Theme.colors.purple + '40',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    progressRing: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 6,
        borderColor: Theme.colors.purple,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
    timerInner: {
        alignItems: 'center',
    },
    timerText: {
        fontSize: 64,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    timerLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: Theme.spacing.sm,
    },
    durationSection: {
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.md,
        textAlign: 'center',
    },
    durationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Theme.spacing.sm,
    },
    durationButton: {
        width: 56,
        height: 56,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 2,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationButtonActive: {
        backgroundColor: Theme.colors.purple + '20',
        borderColor: Theme.colors.purple,
    },
    durationText: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    durationTextActive: {
        color: Theme.colors.purple,
    },
    durationLabel: {
        fontSize: Theme.typography.sizes.xs,
        color: Theme.colors.gray[600],
    },
    actionSection: {
        marginBottom: Theme.spacing.lg,
    },
    giveUpButton: {
        padding: Theme.spacing.lg,
        backgroundColor: Theme.colors.red + '20',
        borderRadius: Theme.radius.lg,
        borderWidth: 2,
        borderColor: Theme.colors.red,
        alignItems: 'center',
    },
    giveUpText: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.red,
    },
    statsCard: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    statsTitle: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsValue: {
        fontSize: Theme.typography.sizes['3xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.purple,
        marginVertical: Theme.spacing.sm,
    },
    statsSubtitle: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[500],
    },
    tipsCard: {
        marginBottom: Theme.spacing.xl,
    },
    tipsTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.sm,
    },
    tipsText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        lineHeight: 22,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    modal: {
        width: '100%',
        maxWidth: 320,
        padding: Theme.spacing.xl,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: Theme.spacing.md,
    },
    title: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.green,
        marginBottom: Theme.spacing.sm,
    },
    text: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        textAlign: 'center',
        marginBottom: Theme.spacing.lg,
        lineHeight: 22,
    },
});
