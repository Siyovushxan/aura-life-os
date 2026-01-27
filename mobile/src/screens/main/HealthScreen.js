import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Theme } from '../../styles/theme';
import { startStepTracking } from '../../services/sensorService';
import { auth } from '../../firebaseConfig';
import { useLanguage } from '../../context/LanguageContext';
import { callBackend } from '../../services/groqService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor
} from 'react-native-reanimated';

export default function HealthScreen() {
    const { t, language } = useLanguage();
    const [steps, setSteps] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [healthInsight, setHealthInsight] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const user = auth.currentUser;

    const pulseValue = useSharedValue(1);

    useEffect(() => {
        let stop;
        if (isSyncing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            stop = startStepTracking(user?.uid, (val) => setSteps(val));
            pulseValue.value = withRepeat(
                withSequence(withTiming(1.08, { duration: 1500 }), withTiming(1, { duration: 1500 })),
                -1,
                true
            );
        } else {
            pulseValue.value = withTiming(1);
        }
        return () => stop && stop();
    }, [isSyncing, user?.uid]);

    const fetchHealthAnalysis = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsAnalyzing(true);
        try {
            const result = await callBackend('getHealthInsight', {
                data: { steps, heartRate: 72, sleep: '7.5h' },
                language: language
            });
            setHealthInsight(result.insight || result);
        } catch (error) {
            setHealthInsight("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        borderColor: interpolateColor(
            pulseValue.value,
            [1, 1.08],
            ['rgba(0, 240, 255, 0.1)', 'rgba(0, 240, 255, 0.4)']
        )
    }));

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t.health.title}</Text>
                    <Text style={styles.subtitle}>{t.health.subtitle.toUpperCase()}</Text>
                </View>

                {/* Organic Health Hub */}
                <View style={styles.hubWrapper}>
                    <Animated.View style={[styles.neuralHub, animatedPulseStyle]}>
                        <LinearGradient
                            colors={['rgba(0, 240, 255, 0.05)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                        />
                        <Text style={styles.stepsValue}>{steps}</Text>
                        <Text style={styles.stepsLabel}>{t.health.steps.toUpperCase()}</Text>
                    </Animated.View>
                    {isSyncing && <View style={styles.syncPulse} />}
                </View>

                <TouchableOpacity
                    style={[styles.syncButton, isSyncing && styles.syncButtonActive]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setIsSyncing(!isSyncing);
                    }}
                >
                    <Text style={[styles.syncText, isSyncing && styles.syncTextActive]}>
                        {isSyncing ? "NEURAL SYNC: ON" : "ACTIVATE BIO-SYNC"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.grid}>
                    {[
                        { label: t.health.battery, value: '88%', color: Theme.colors.green, icon: '🔋' },
                        { label: t.health.heartRate, value: '72 BPM', color: Theme.colors.red, icon: '❤️' },
                        { label: t.health.sleep, value: '7.5h', color: Theme.colors.purple, icon: '🌙' },
                    ].map((item, idx) => (
                        <View key={idx} style={styles.gridItem}>
                            <Text style={styles.itemIcon}>{item.icon}</Text>
                            <Text style={styles.itemLabel}>{item.label.toUpperCase()}</Text>
                            <Text style={[styles.itemValue, { color: item.color }]}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.analysisBox}
                    onPress={fetchHealthAnalysis}
                >
                    <View style={styles.analysisHeader}>
                        <Text style={styles.analysisTitle}>BIO-MECHANICAL ANALYSIS</Text>
                        {isAnalyzing && <ActivityIndicator size="small" color={Theme.colors.cyan} />}
                    </View>
                    <Text style={styles.analysisText}>
                        {healthInsight || "Neural scan ready. Tap to analyze biometric patterns."}
                    </Text>
                </TouchableOpacity>
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
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
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
    hubWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    neuralHub: {
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 240, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.02)',
        overflow: 'hidden',
    },
    syncPulse: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 1,
        borderColor: Theme.colors.cyan,
        opacity: 0.1,
    },
    stepsValue: {
        fontSize: 64,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -2,
    },
    stepsLabel: {
        fontSize: 10,
        color: Theme.colors.cyan,
        fontWeight: '900',
        letterSpacing: 3,
        marginTop: -4,
    },
    syncButton: {
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    syncButtonActive: {
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderColor: Theme.colors.cyan,
    },
    syncText: {
        color: Theme.colors.textDim,
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 11,
    },
    syncTextActive: {
        color: Theme.colors.cyan,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    gridItem: {
        width: '31%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    itemIcon: {
        fontSize: 20,
        marginBottom: 12,
    },
    itemLabel: {
        fontSize: 8,
        color: Theme.colors.textDim,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    itemValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    analysisBox: {
        padding: 24,
        backgroundColor: 'rgba(0, 240, 255, 0.03)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.08)',
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    analysisTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Theme.colors.cyan,
        letterSpacing: 2,
    },
    analysisText: {
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        fontSize: 14,
        opacity: 0.8,
    }
});
