import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Dimensions
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    interpolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function FocusScreen() {
    const { t } = useLanguage();
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [totalFocusTime, setTotalFocusTime] = useState(0);

    const glowValue = useSharedValue(1);
    const overlayOpacity = useSharedValue(0);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            glowValue.value = withRepeat(
                withSequence(withTiming(1.2, { duration: 2000 }), withTiming(1, { duration: 2000 })),
                -1,
                true
            );
            overlayOpacity.value = withSpring(1);

            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else {
            glowValue.value = withTiming(1);
            overlayOpacity.value = withSpring(0);
            if (seconds === 0) {
                setIsActive(false);
                setTotalFocusTime(prev => prev + 25);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const toggleTimer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsActive(false);
        setSeconds(25 * 60);
    };

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const animatedGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowValue.value }],
        opacity: interpolate(glowValue.value, [1, 1.2], [0.3, 0.6]),
    }));

    const animatedOverlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
        pointerEvents: isActive ? 'auto' : 'none',
    }));

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = (seconds / (25 * 60)) * circumference;

    return (
        <SafeAreaView style={styles.container}>
            {isActive && (
                <Animated.View style={[styles.deepWorkOverlay, animatedOverlayStyle]}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.9)', 'rgba(88, 28, 135, 0.4)', 'rgba(0,0,0,0.9)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.deepWorkText}>DIQQAT REJIMI FAOL</Text>
                </Animated.View>
            )}

            <View style={styles.header}>
                <Text style={styles.title}>{t.focus.title}</Text>
                <Text style={styles.subtitle}>{t.focus.subtitle}</Text>
            </View>

            <View style={styles.timerContainer}>
                <Animated.View style={[styles.pulseCircle, animatedGlowStyle]} />
                <Svg width={300} height={300} viewBox="0 0 300 300">
                    <Circle
                        cx="150"
                        cy="150"
                        r={radius}
                        stroke="rgba(192, 132, 252, 0.1)"
                        strokeWidth="8"
                        fill="none"
                    />
                    <Circle
                        cx="150"
                        cy="150"
                        r={radius}
                        stroke={Theme.colors.purple}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        strokeLinecap="round"
                        fill="none"
                        transform="rotate(-90 150 150)"
                    />
                </Svg>
                <View style={styles.timerOverlay}>
                    <Text style={styles.timeText}>{formatTime(seconds)}</Text>
                    <Text style={styles.statusLabel}>{isActive ? 'FLOW STATE' : 'READY'}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: isActive ? 'rgba(239, 68, 68, 0.2)' : Theme.colors.purple }]}
                    onPress={toggleTimer}
                >
                    <Text style={[styles.buttonText, { color: isActive ? Theme.colors.red : '#000' }]}>
                        {isActive ? t.focus.stop : t.focus.start}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
                    <Text style={styles.resetText}>{t.focus.reset}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t.focus.today}</Text>
                    <Text style={styles.statValue}>{totalFocusTime} MIN</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t.focus.streak}</Text>
                    <Text style={styles.statValue}>5 KUN</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        padding: 24,
    },
    header: {
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Theme.colors.purple,
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        marginTop: 4,
        letterSpacing: 1,
    },
    timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 40,
    },
    timerOverlay: {
        position: 'absolute',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Theme.colors.purple,
        letterSpacing: 3,
        marginTop: 8,
    },
    controls: {
        alignItems: 'center',
        marginBottom: 48,
    },
    mainButton: {
        width: width - 48,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: Theme.colors.purple,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    buttonText: {
        color: '#000',
        fontWeight: '900',
        letterSpacing: 2,
    },
    resetButton: {
        marginTop: 20,
    },
    resetText: {
        color: Theme.colors.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 32,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    mindQuote: {
        paddingHorizontal: 20,
    },
    quoteText: {
        textAlign: 'center',
        color: Theme.colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 20,
        fontSize: 14,
    },
    deepWorkOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deepWorkText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 8,
        opacity: 0.5,
        marginTop: height * 0.4,
    },
    pulseCircle: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: Theme.colors.purple,
        zIndex: -1,
    }
});
