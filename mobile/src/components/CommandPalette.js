// Command Palette - Quick Actions (Cmd+K equivalent)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../styles/theme';
import { GlassCard } from './ui';
import * as Haptics from 'expo-haptics';

const COMMANDS = [
    { id: 'add_expense', label: 'Xarajat qo\'shish', icon: '💸', screen: 'Money', action: 'add' },
    { id: 'add_income', label: 'Daromad qo\'shish', icon: '💰', screen: 'Money', action: 'add' },
    { id: 'add_task', label: 'Vazifa qo\'shish', icon: '✅', screen: 'Tasks', action: 'add' },
    { id: 'start_focus', label: 'Fokus boshlash', icon: '🎯', screen: 'Focus', action: 'start' },
    { id: 'log_meal', label: 'Ovqat yozish', icon: '🍽️', screen: 'Food', action: 'add' },
    { id: 'log_mood', label: 'Kayfiyat yozish', icon: '🧠', screen: 'Mind', action: 'log' },
    { id: 'add_hobby', label: 'Qiziqish qo\'shish', icon: '🎨', screen: 'Interests', action: 'add' },
    { id: 'add_member', label: 'Oila a\'zosi', icon: '👥', screen: 'Family', action: 'add' },
    { id: 'view_health', label: 'Salomatlik', icon: '❤️', screen: 'Health', action: 'view' },
    { id: 'go_home', label: 'Bosh sahifa', icon: '🏠', screen: 'Home', action: 'navigate' },
];

export default function CommandPalette({ visible, onClose }) {
    const navigation = useNavigation();
    const [query, setQuery] = useState('');
    const [filteredCommands, setFilteredCommands] = useState(COMMANDS);
    const [recentCommands, setRecentCommands] = useState([]);

    useEffect(() => {
        if (query.trim() === '') {
            setFilteredCommands(recentCommands.length > 0 ? recentCommands : COMMANDS);
        } else {
            const filtered = COMMANDS.filter(cmd =>
                cmd.label.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredCommands(filtered);
        }
    }, [query, recentCommands]);

    const executeCommand = (command) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Add to recent
        setRecentCommands(prev => {
            const filtered = prev.filter(c => c.id !== command.id);
            return [command, ...filtered].slice(0, 5);
        });

        // Navigate to screen
        if (command.screen === 'Home') {
            navigation.navigate('MainTabs', { screen: 'Home' });
        } else if (['Money', 'Focus', 'Family'].includes(command.screen)) {
            navigation.navigate('MainTabs', { screen: command.screen });
        } else {
            navigation.navigate(command.screen);
        }

        onClose();
        setQuery('');
    };

    const renderCommand = ({ item }) => (
        <TouchableOpacity
            style={styles.commandItem}
            onPress={() => executeCommand(item)}
        >
            <Text style={styles.commandIcon}>{item.icon}</Text>
            <Text style={styles.commandLabel}>{item.label}</Text>
            <Text style={styles.commandArrow}>→</Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.content}>
                    <GlassCard style={styles.palette}>
                        {/* Search Input */}
                        <View style={styles.searchContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Nima qilmoqchisiz?"
                                placeholderTextColor={Theme.colors.gray[500]}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={styles.micButton}>
                                <Text style={styles.micIcon}>🎤</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Commands List */}
                        <FlatList
                            data={filteredCommands}
                            renderItem={renderCommand}
                            keyExtractor={(item) => item.id}
                            style={styles.commandList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Hech narsa topilmadi</Text>
                            }
                        />

                        {/* Hint */}
                        <View style={styles.hint}>
                            <Text style={styles.hintText}>
                                💡 Aura Sphere'ni bosib turib Command Palette oching
                            </Text>
                        </View>
                    </GlassCard>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: Theme.spacing.md,
    },
    content: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    palette: {
        maxHeight: 500,
        padding: 0,
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.gray[100],
    },
    searchIcon: {
        fontSize: 20,
        marginRight: Theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Theme.typography.sizes.lg,
        color: Theme.colors.white,
        padding: 0,
    },
    micButton: {
        padding: Theme.spacing.sm,
    },
    micIcon: {
        fontSize: 20,
    },
    commandList: {
        maxHeight: 350,
    },
    commandItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.gray[100] + '50',
    },
    commandIcon: {
        fontSize: 24,
        marginRight: Theme.spacing.md,
    },
    commandLabel: {
        flex: 1,
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.white,
    },
    commandArrow: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
    },
    emptyText: {
        textAlign: 'center',
        color: Theme.colors.gray[500],
        padding: Theme.spacing.xl,
    },
    hint: {
        padding: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.gray[100],
    },
    hintText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textAlign: 'center',
    },
});
