import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { ModuleCard } from '../../components/ui';

export default function MenuScreen() {
    const navigation = useNavigation();
    const [moduleData, setModuleData] = useState({
        finance: { balance: 0 },
        tasks: { todayCount: 0, completedCount: 0 },
        health: { energy: 75 },
        food: { calories: 0 },
        focus: { minutes: 0 },
        interests: { streak: 0 },
        family: { members: 0 },
        mind: { mood: null },
    });

    useEffect(() => {
        loadAllModuleData();
    }, []);

    const loadAllModuleData = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Load Finance
        onSnapshot(query(collection(db, 'users', uid, 'modules', 'finance', 'transactions')), (snapshot) => {
            let balance = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                balance += data.type === 'income' ? data.amount : -data.amount;
            });
            setModuleData(prev => ({ ...prev, finance: { balance } }));
        });

        // Load Tasks
        onSnapshot(query(collection(db, 'users', uid, 'modules', 'tasks', 'items')), (snapshot) => {
            let todayCount = 0;
            let completedCount = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            snapshot.forEach((doc) => {
                const data = doc.data();
                const dueDate = data.dueDate?.toDate?.() || new Date(data.dueDate);
                if (dueDate >= today && dueDate < tomorrow) {
                    todayCount++;
                    if (data.completed) completedCount++;
                }
            });
            setModuleData(prev => ({ ...prev, tasks: { todayCount, completedCount } }));
        });

        // Load Health
        const todayStr = new Date().toISOString().split('T')[0];
        onSnapshot(collection(db, 'users', uid, 'modules', 'health', 'daily'), (snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === todayStr) {
                    setModuleData(prev => ({ ...prev, health: { energy: doc.data().energy || 75 } }));
                }
            });
        });

        // Load Family
        onSnapshot(collection(db, 'users', uid, 'modules', 'family', 'members'), (snapshot) => {
            setModuleData(prev => ({ ...prev, family: { members: snapshot.size } }));
        });

        // Load Mind
        onSnapshot(collection(db, 'users', uid, 'modules', 'mind', 'logs'), (snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === todayStr) {
                    setModuleData(prev => ({ ...prev, mind: { mood: doc.data().mood } }));
                }
            });
        });

        // Load Interests
        onSnapshot(collection(db, 'users', uid, 'modules', 'interests', 'hobbies'), (snapshot) => {
            let maxStreak = 0;
            snapshot.forEach((doc) => {
                const streak = doc.data().streak || 0;
                if (streak > maxStreak) maxStreak = streak;
            });
            setModuleData(prev => ({ ...prev, interests: { streak: maxStreak } }));
        });
    };

    const getMoodEmoji = (mood) => {
        switch (mood) {
            case 'positive': return '😊';
            case 'neutral': return '😐';
            case 'negative': return '😢';
            default: return '—';
        }
    };

    const modules = [
        { id: 'finance', title: 'Moliya', icon: '💰', value: `$${moduleData.finance.balance.toLocaleString()}`, subtitle: 'Hozirgi balans', color: Theme.colors.gold, screen: 'Money' },
        { id: 'health', title: 'Salomatlik', icon: '❤️', value: `${moduleData.health.energy}%`, subtitle: 'Energiya', color: Theme.colors.green, screen: 'Health' },
        { id: 'mind', title: 'Aql', icon: '🧠', value: getMoodEmoji(moduleData.mind.mood), subtitle: 'Kayfiyat', color: Theme.colors.red, screen: 'Mind' },
        { id: 'focus', title: 'Fokus', icon: '🎯', value: `${moduleData.focus.minutes}m`, subtitle: 'Bugun', color: Theme.colors.purple, screen: 'Focus' },
        { id: 'tasks', title: 'Vazifalar', icon: '✅', value: `${moduleData.tasks.completedCount}/${moduleData.tasks.todayCount}`, subtitle: 'Vazifalar', color: Theme.colors.purple, screen: 'Tasks' },
        { id: 'food', title: 'Ovqat', icon: '🍽️', value: `${moduleData.food.calories} kcal`, subtitle: 'Kaloriya', color: Theme.colors.gold, screen: 'Food' },
        { id: 'interests', title: 'Qiziqishlar', icon: '🎨', value: moduleData.interests.streak > 0 ? `🔥 ${moduleData.interests.streak}` : '—', subtitle: 'Streak', color: Theme.colors.cyan, screen: 'Interests' },
        { id: 'family', title: 'Oila', icon: '👥', value: `${moduleData.family.members}`, subtitle: 'A\'zolar', color: Theme.colors.cyan, screen: 'Family' },
    ];

    const handleModulePress = (module) => {
        navigation.navigate(module.screen);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Menu</Text>
                    <Text style={styles.subtitle}>Barcha modullar</Text>
                </View>

                <View style={styles.grid}>
                    {modules.map((module) => (
                        <TouchableOpacity
                            key={module.id}
                            style={styles.moduleItem}
                            onPress={() => handleModulePress(module)}
                        >
                            <ModuleCard
                                title={module.title}
                                icon={module.icon}
                                value={module.value}
                                subtitle={module.subtitle}
                                color={module.color}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
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
        marginBottom: Theme.spacing.xl,
        marginTop: Platform.OS === 'ios' ? 40 : 20,
    },
    title: {
        fontSize: Theme.typography.sizes['4xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        fontFamily: Theme.typography.fonts.heading,
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
        paddingBottom: 100,
    },
    moduleItem: {
        width: '47%',
    },
});
