// Interests Screen - Full Duality System (Growth/Control)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function InterestsScreen() {
    const [activeTab, setActiveTab] = useState('growth'); // growth, control
    const [hobbies, setHobbies] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadHobbies();
    }, []);

    const loadHobbies = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'users', uid, 'modules', 'interests', 'hobbies'),
            orderBy('streak', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setHobbies(list);
        });

        return unsubscribe;
    };

    const addHobby = async (name, type) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await addDoc(collection(db, 'users', uid, 'modules', 'interests', 'hobbies'), {
            name,
            type,
            streak: 0,
            frequency: 0,
            lastDone: null,
            createdAt: Timestamp.now(),
        });

        setShowAddModal(false);
    };

    const markDone = async (hobbyId, hobby) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        const today = new Date().toISOString().split('T')[0];
        const lastDoneDate = hobby.lastDone?.toDate?.()?.toISOString?.()?.split('T')[0];

        let newStreak = hobby.streak;
        if (lastDoneDate !== today) {
            // Check if it's consecutive day
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDoneDate === yesterdayStr) {
                newStreak = hobby.streak + 1;
            } else if (!lastDoneDate) {
                newStreak = 1;
            } else {
                newStreak = 1; // Reset streak if missed a day
            }
        }

        await updateDoc(doc(db, 'users', uid, 'modules', 'interests', 'hobbies', hobbyId), {
            streak: newStreak,
            frequency: hobby.frequency + 1,
            lastDone: Timestamp.now(),
        });
    };

    const logControl = async (hobbyId, hobby) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const uid = auth.currentUser?.uid;
        await updateDoc(doc(db, 'users', uid, 'modules', 'interests', 'hobbies', hobbyId), {
            frequency: hobby.frequency + 1,
            lastDone: Timestamp.now(),
        });
    };

    const deleteHobby = async (hobbyId) => {
        const uid = auth.currentUser?.uid;
        await deleteDoc(doc(db, 'users', uid, 'modules', 'interests', 'hobbies', hobbyId));
    };

    const filteredHobbies = hobbies.filter(h => h.type === activeTab);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Interests</Text>
                <Text style={styles.subtitle}>Qiziqishlar va Odatlar</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'growth' && styles.tabActiveGrowth]}
                    onPress={() => setActiveTab('growth')}
                >
                    <Text style={[styles.tabText, activeTab === 'growth' && styles.tabTextActiveGrowth]}>
                        ✨ Growth ({hobbies.filter(h => h.type === 'growth').length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'control' && styles.tabActiveControl]}
                    onPress={() => setActiveTab('control')}
                >
                    <Text style={[styles.tabText, activeTab === 'control' && styles.tabTextActiveControl]}>
                        🛑 Control ({hobbies.filter(h => h.type === 'control').length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Hobbies List */}
            <ScrollView style={styles.scrollView}>
                {filteredHobbies.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>{activeTab === 'growth' ? '🌱' : '🔒'}</Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'growth'
                                ? 'Rivojlanish odatlari qo\'shing'
                                : 'Nazorat qiladigan odatlar qo\'shing'
                            }
                        </Text>
                    </View>
                ) : (
                    filteredHobbies.map((hobby) => (
                        <GlassCard key={hobby.id} style={styles.hobbyCard}>
                            <View style={styles.hobbyRow}>
                                <View style={styles.hobbyInfo}>
                                    <Text style={styles.hobbyName}>{hobby.name}</Text>
                                    <View style={styles.hobbyMeta}>
                                        {activeTab === 'growth' && hobby.streak > 0 && (
                                            <Text style={styles.streakBadge}>🔥 {hobby.streak} kun</Text>
                                        )}
                                        <Text style={styles.frequencyText}>
                                            {hobby.frequency} marta
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.hobbyActions}>
                                    {activeTab === 'growth' ? (
                                        <TouchableOpacity
                                            style={styles.doneButton}
                                            onPress={() => markDone(hobby.id, hobby)}
                                        >
                                            <Text style={styles.doneButtonText}>✓ Bugun</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.logButton}
                                            onPress={() => logControl(hobby.id, hobby)}
                                        >
                                            <Text style={styles.logButtonText}>+1</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteHobby(hobby.id)}
                                    >
                                        <Text style={styles.deleteIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GlassCard>
                    ))
                )}

                {/* AI Recommendations */}
                <GlassCard style={styles.aiCard}>
                    <Text style={styles.aiTitle}>🤖 AI Maslahat</Text>
                    <Text style={styles.aiText}>
                        {activeTab === 'growth'
                            ? 'Har kuni 20 daqiqa kitob o\'qish - eng yaxshi rivojlanish odati!'
                            : 'Ekran vaqtini kamaytirishga harakat qiling - miyangiz minnatdor bo\'ladi.'
                        }
                    </Text>
                    <View style={styles.aiActions}>
                        <TouchableOpacity style={styles.aiActionButton}>
                            <Text style={styles.aiActionText}>👍 Foydali</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.aiActionButton}>
                            <Text style={styles.aiActionText}>📋 Vazifa</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </ScrollView>

            {/* Add FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: activeTab === 'growth' ? Theme.colors.cyan : Theme.colors.red }]}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Modal */}
            {showAddModal && (
                <AddHobbyModal
                    visible={showAddModal}
                    type={activeTab}
                    onClose={() => setShowAddModal(false)}
                    onAdd={addHobby}
                />
            )}
        </View>
    );
}

const AddHobbyModal = ({ visible, type, onClose, onAdd }) => {
    const [name, setName] = useState('');

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name, type);
        setName('');
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.title}>
                        {type === 'growth' ? '✨ Yangi Rivojlanish' : '🛑 Yangi Nazorat'}
                    </Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder={type === 'growth' ? 'Masalan: Kitob o\'qish' : 'Masalan: Ijtimoiy tarmoqlar'}
                        placeholderTextColor={Theme.colors.gray[500]}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <View style={modalStyles.actions}>
                        <GlassButton
                            title="Bekor"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <GlassButton
                            title="Qo'shish"
                            variant="primary"
                            color={type === 'growth' ? Theme.colors.cyan : Theme.colors.red}
                            onPress={handleAdd}
                            style={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
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
    tabs: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 2,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    tabActiveGrowth: {
        backgroundColor: Theme.colors.cyan + '20',
        borderColor: Theme.colors.cyan,
    },
    tabActiveControl: {
        backgroundColor: Theme.colors.red + '20',
        borderColor: Theme.colors.red,
    },
    tabText: {
        color: Theme.colors.gray[600],
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.semibold,
    },
    tabTextActiveGrowth: {
        color: Theme.colors.cyan,
    },
    tabTextActiveControl: {
        color: Theme.colors.red,
    },
    scrollView: {
        flex: 1,
        marginBottom: 80,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Theme.spacing['3xl'],
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: Theme.spacing.md,
    },
    emptyText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[500],
    },
    hobbyCard: {
        marginBottom: Theme.spacing.sm,
    },
    hobbyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hobbyInfo: {
        flex: 1,
    },
    hobbyName: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
    },
    hobbyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
        marginTop: 4,
    },
    streakBadge: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gold,
        fontWeight: Theme.typography.weights.semibold,
    },
    frequencyText: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
    },
    hobbyActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.sm,
    },
    doneButton: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        backgroundColor: Theme.colors.green + '20',
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.green,
    },
    doneButtonText: {
        color: Theme.colors.green,
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.semibold,
    },
    logButton: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        backgroundColor: Theme.colors.red + '20',
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.red,
    },
    logButtonText: {
        color: Theme.colors.red,
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.bold,
    },
    deleteButton: {
        padding: Theme.spacing.sm,
    },
    deleteIcon: {
        fontSize: 18,
    },
    aiCard: {
        marginTop: Theme.spacing.lg,
        marginBottom: Theme.spacing.xl,
    },
    aiTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.sm,
    },
    aiText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        lineHeight: 22,
        marginBottom: Theme.spacing.md,
    },
    aiActions: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
    },
    aiActionButton: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
    },
    aiActionText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.sm,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.xl,
    },
    fabIcon: {
        fontSize: 32,
        color: '#000',
        fontWeight: 'bold',
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.md,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        padding: Theme.spacing.xl,
    },
    title: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.lg,
    },
    input: {
        backgroundColor: Theme.glass.input.backgroundColor,
        borderWidth: Theme.glass.input.borderWidth,
        borderColor: Theme.glass.input.borderColor,
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.base,
        marginBottom: Theme.spacing.lg,
    },
    actions: {
        flexDirection: 'row',
    },
});
