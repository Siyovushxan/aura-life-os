// More Screen - Updated with full navigation
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { Theme } from '../../styles/theme';
import { GlassCard } from '../../components/ui';

export default function MoreScreen() {
    const navigation = useNavigation();

    const modules = [
        { id: 'health', title: 'Health', icon: '❤️', color: Theme.colors.green, screen: 'Health' },
        { id: 'tasks', title: 'Tasks', icon: '✅', color: Theme.colors.purple, screen: 'Tasks' },
        { id: 'food', title: 'Food', icon: '🍽️', color: Theme.colors.gold, screen: 'Food' },
        { id: 'interests', title: 'Interests', icon: '🎨', color: Theme.colors.cyan, screen: 'Interests' },
        { id: 'mind', title: 'Mind', icon: '🧠', color: Theme.colors.red, screen: 'Mind' },
        { id: 'settings', title: 'Settings', icon: '⚙️', color: Theme.colors.gray[500], screen: null },
    ];

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleModulePress = (module) => {
        if (module.screen) {
            navigation.navigate(module.screen);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>More</Text>
                    <Text style={styles.subtitle}>Qo'shimcha modullar va sozlamalar</Text>
                </View>

                <View style={styles.grid}>
                    {modules.map((module) => (
                        <TouchableOpacity
                            key={module.id}
                            style={styles.gridItem}
                            onPress={() => handleModulePress(module)}
                        >
                            <GlassCard style={[styles.moduleCard, { borderColor: module.color + '40' }]}>
                                <Text style={styles.moduleIcon}>{module.icon}</Text>
                                <Text style={styles.moduleTitle}>{module.title}</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <GlassCard style={styles.infoCard}>
                    <Text style={styles.infoTitle}>AURA Mobile</Text>
                    <Text style={styles.infoVersion}>Version 1.0.0</Text>
                    <Text style={styles.infoText}>
                        8 ta modul • Glassmorphism dizayn • Firebase sync
                    </Text>
                </GlassCard>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Chiqish</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollView: {
        flex: 1,
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.md,
    },
    gridItem: {
        width: '47%',
    },
    moduleCard: {
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    moduleIcon: {
        fontSize: 48,
        marginBottom: Theme.spacing.sm,
    },
    moduleTitle: {
        fontSize: Theme.typography.sizes.base,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
    },
    infoCard: {
        marginTop: Theme.spacing.xl,
        alignItems: 'center',
    },
    infoTitle: {
        fontSize: Theme.typography.sizes.xl,
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
    },
    infoVersion: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.cyan,
        marginTop: 4,
    },
    infoText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
    logoutButton: {
        marginTop: Theme.spacing.xl,
        marginBottom: Theme.spacing.xl,
        padding: Theme.spacing.md,
        backgroundColor: Theme.colors.red + '20',
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.red,
        alignItems: 'center',
    },
    logoutText: {
        color: Theme.colors.red,
        fontSize: Theme.typography.sizes.base,
        fontWeight: Theme.typography.weights.semibold,
    },
});
