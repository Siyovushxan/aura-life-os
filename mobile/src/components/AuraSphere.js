import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor,
    useDerivedValue
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Theme } from '../styles/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AuraSphere({ score = 75, onPress }) {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.4);

    // Color based on score
    // Color based on score (Not animated to avoid .value access issues in helper)
    const getColor = (s) => {
        if (s < 40) return Theme.colors.red;
        if (s < 70) return Theme.colors.gold;
        return Theme.colors.cyan;
    };
    const color = getColor(score);

    useEffect(() => {
        // Pulsating animation
        scale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 2000 }),
                withTiming(0.95, { duration: 2000 })
            ),
            -1,
            true
        );

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 3000 }),
                withTiming(0.2, { duration: 3000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        shadowColor: color, // Use static color
        shadowRadius: 40,
        shadowOpacity: glowOpacity.value,
        elevation: 20,
    }));

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
            <Animated.View style={[styles.glowLayer, glowStyle]} />

            <Animated.View style={[styles.sphereWrapper, animatedStyle]}>
                <Svg width="200" height="200" viewBox="0 0 200 200">
                    <Defs>
                        <RadialGradient id="sphereGrad" cx="35%" cy="35%" r="60%">
                            <Stop offset="0%" stopColor="#FFF" stopOpacity="0.4" />
                            <Stop offset="50%" stopColor={color} stopOpacity="0.8" />
                            <Stop offset="100%" stopColor="#000" stopOpacity="1" />
                        </RadialGradient>

                        <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
                            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>

                    {/* Outer Plasma */}
                    <Circle cx="100" cy="100" r="90" fill="url(#innerGlow)" opacity={0.3} />

                    {/* Main Sphere Body */}
                    <Circle cx="100" cy="100" r="70" fill="url(#sphereGrad)" />

                    {/* Highlight / Reflection */}
                    <Circle cx="70" cy="70" r="20" fill="#FFF" opacity={0.2} />
                </Svg>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 40,
    },
    sphereWrapper: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowLayer: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'transparent',
    }
});
