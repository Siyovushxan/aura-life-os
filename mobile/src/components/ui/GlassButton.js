// GlassButton - Themed button with glassmorphism
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../styles/theme';

export const GlassButton = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, accent
    color, // custom color override
    loading = false,
    disabled = false,
    style,
    textStyle,
    ...props
}) => {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    const getButtonStyle = () => {
        if (variant === 'primary') {
            return {
                backgroundColor: color || Theme.colors.cyan,
                borderColor: 'transparent',
            };
        }
        if (variant === 'secondary') {
            return {
                backgroundColor: Theme.glass.button.backgroundColor,
                borderColor: color || Theme.colors.cyan,
            };
        }
        if (variant === 'accent') {
            return {
                backgroundColor: 'transparent',
                borderColor: color || Theme.colors.cyan,
            };
        }
    };

    const getTextColor = () => {
        if (variant === 'primary') return '#000000';
        return color || Theme.colors.cyan;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabled,
                style,
            ]}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    text: {
        fontSize: Theme.typography.sizes.base,
        fontWeight: Theme.typography.weights.semibold,
    },
    disabled: {
        opacity: 0.5,
    },
});
