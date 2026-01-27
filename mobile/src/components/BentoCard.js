import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export const BentoCard = ({
    title,
    value,
    subtitle,
    emoji,
    color = Theme.colors.cyan,
    size = 'half',
    trend, // e.g. { value: '+2.4%', up: true }
    onPress,
    style,
    children
}) => {
    const isFull = size === 'full';

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[
                styles.cardContainer,
                isFull ? styles.fullWidth : styles.halfWidth,
                style
            ]}
        >
            <View style={[styles.cardInner, { borderColor: `${color}40` }]}>
                {/* Layered Glassmorphism Glow */}
                <LinearGradient
                    colors={[`${color}15`, 'transparent', `${color}05`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                />

                <View style={styles.topRow}>
                    <View style={[styles.labelBadge, { backgroundColor: `${color}20` }]}>
                        <Text style={styles.emoji}>{emoji}</Text>
                        <Text style={[styles.title, { color: color }]}>{title}</Text>
                    </View>
                    {trend && (
                        <View style={styles.trendBadge}>
                            <Text style={[styles.trendText, { color: trend.up ? Theme.colors.green : Theme.colors.red }]}>
                                {trend.value}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.body}>
                    {value && (
                        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                    )}
                    {subtitle && (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>

                {children}

                {/* Subtle Neural Accent */}
                <View style={[styles.neuralAccent, { backgroundColor: color, shadowColor: color }]} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 12,
    },
    halfWidth: {
        width: (width - 48 - 12) / 2,
    },
    fullWidth: {
        width: width - 48,
    },
    cardInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1.5,
        minHeight: 165,
        overflow: 'hidden',
        justifyContent: 'space-between',
        // Layered Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 8,
    },
    emoji: {
        fontSize: 14,
    },
    title: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    trendBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '900',
    },
    body: {
        marginTop: 'auto',
    },
    value: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 10,
        color: Theme.colors.textDim,
        marginTop: 6,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    neuralAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3,
        height: '100%',
        opacity: 0.8,
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    }
});
