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

const { width } = Dimensions.get('window');

export default function FocusScreen() {
    const { t } = useLanguage();
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [totalFocusTime, setTotalFocusTime] = useState(0);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
            setTotalFocusTime(prev => prev + 25);
            // Alert or sound here
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setSeconds(25 * 60);
    };

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = (seconds / (25 * 60)) * circumference;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t.focus.title}</Text>
                <Text style={styles.subtitle}>{t.focus.subtitle}</Text>
            </View>

            <View style={styles.timerContainer}>
                <Svg width={300} height={300} viewBox="0 0 300 300">
                    <Circle
                        cx="150"
                        cy="150"
                        r={radius}
                        stroke="rgba(192, 132, 252, 0.1)"
                        strokeWidth="10"
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
                    <Text style={styles.statusLabel}>{isActive ? 'DEEP FOCUS' : 'READY'}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: isActive ? Theme.colors.red : Theme.colors.purple }]}
                    onPress={toggleTimer}
                >
                    <Text style={styles.buttonText}>{isActive ? t.focus.stop : t.focus.start}</Text>
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

            <View style={styles.mindQuote}>
                <Text style={styles.quoteText}>
                    &quot;Diqqatni bir joyga jamlash — intellektual salohiyatning kalitidir.&quot;
                </Text>
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
    }
});
