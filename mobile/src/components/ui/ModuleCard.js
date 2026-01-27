// ModuleCard - Collapsible module card for home screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';
import { Theme, getModuleColor, getModuleGlow } from '../../styles/theme';

export const ModuleCard = ({
    title,
    moduleName,
    icon,
    value,
    subtitle,
    onPress,
    children,
}) => {
    const [expanded, setExpanded] = useState(false);
    const moduleColor = getModuleColor(moduleName);

    return (
        <GlassCard
            style={[styles.card, getModuleGlow(moduleName)]}
        >
            <TouchableOpacity
                onPress={() => onPress ? onPress() : setExpanded(!expanded)}
                activeOpacity={0.8}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: moduleColor + '20' }]}>
                            <Text style={styles.icon}>{icon}</Text>
                        </View>
                        <View>
                            <Text style={styles.title}>{title}</Text>
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    </View>

                    {value && (
                        <Text style={[styles.value, { color: moduleColor }]}>
                            {value}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>

            {expanded && children && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: Theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: Theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Theme.spacing.md,
    },
    icon: {
        fontSize: 24,
    },
    title: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
    },
    value: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
    },
    content: {
        marginTop: Theme.spacing.md,
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.gray[100],
    },
});
