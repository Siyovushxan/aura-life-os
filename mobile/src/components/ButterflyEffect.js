import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function ButterflyEffect({ score = 0, correlations = [], onPressCorrelation }) {
    const radius = 85;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Pulse animation for the glow (conceptually handled by the glow logic)
    const getScoreColor = (value) => {
        if (value < 40) return Theme.colors.red;
        if (value < 70) return Theme.colors.cyan;
        return Theme.colors.purple;
    };

    const color = getScoreColor(progress);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>BUTTERFLY EFFECT</Text>
                    <Text style={styles.subtitle}>BALANS VA BOG'LIQLIKLAR</Text>
                </View>
                <View style={styles.betaBadge}>
                    <Text style={styles.betaText}>NEURAL</Text>
                </View>
            </View>

            <View style={styles.gaugeContainer}>
                {/* Dynamic Background Glow */}
                <View style={[styles.glow, { backgroundColor: color, shadowColor: color }]} />

                <Svg width={radius * 2 + 40} height={radius * 2 + 40} style={styles.svg}>
                    <Defs>
                        <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={color} stopOpacity="1" />
                            <Stop offset="100%" stopColor={`${color}80`} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>

                    {/* Background Track */}
                    <Circle
                        cx={radius + 20}
                        cy={radius + 20}
                        r={radius}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {/* Progress Circle */}
                    <Circle
                        cx={radius + 20}
                        cy={radius + 20}
                        r={radius}
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90, ${radius + 20}, ${radius + 20})`}
                        fill="transparent"
                    />
                </Svg>

                <View style={styles.scoreInfo}>
                    <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
                    <Text style={styles.scoreLabel}>HARMONY SCORE</Text>
                </View>
            </View>

            {/* Correlations Section */}
            <View style={styles.correlationsWrapper}>
                {correlations.length > 0 ? (
                    correlations.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.correlationRow}
                            onPress={() => onPressCorrelation?.(item)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.indicator, { backgroundColor: color }]} />
                            <View style={styles.correlationContent}>
                                <Text style={styles.categoryText}>
                                    {item.category1.toUpperCase()} — {item.category2.toUpperCase()}
                                </Text>
                                <Text style={styles.correlationText}>{item.insight}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>BARCHA TIZIMLAR UYG'UNLASHMOQDA...</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 32,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2.5,
    },
    subtitle: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    betaBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    betaText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    gaugeContainer: {
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        opacity: 0.15,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 100,
    },
    scoreInfo: {
        position: 'absolute',
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 72,
        fontWeight: '900',
        letterSpacing: -2,
    },
    scoreLabel: {
        fontSize: 10,
        color: Theme.colors.textDim,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: -5,
    },
    correlationsWrapper: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 24,
    },
    correlationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 10,
    },
    indicator: {
        width: 3,
        height: 30,
        borderRadius: 2,
        marginRight: 16,
    },
    correlationContent: {
        flex: 1,
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '900',
        color: Theme.colors.textDim,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    correlationText: {
        fontSize: 13,
        color: '#FFF',
        fontWeight: '500',
    },
    arrow: {
        color: Theme.colors.textDim,
        fontSize: 18,
        marginLeft: 10,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: Theme.colors.textDim,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    }
});
