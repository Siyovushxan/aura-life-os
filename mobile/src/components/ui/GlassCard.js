// GlassCard - Base glassmorphism card component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../../styles/theme';

export const GlassCard = ({
    children,
    style,
    glowColor,
    noBorder = false,
    ...props
}) => {
    return (
        <View
            style={[
                styles.card,
                glowColor && Theme.glows[glowColor],
                noBorder && { borderWidth: 0 },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.glass.card.backgroundColor,
        borderRadius: Theme.radius.lg,
        borderWidth: Theme.glass.card.borderWidth,
        borderColor: Theme.glass.card.borderColor,
        padding: Theme.spacing.md,
        overflow: 'hidden',
    },
});
