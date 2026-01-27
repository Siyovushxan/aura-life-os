// Family Screen - Genealogy Tree with Members Management
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function FamilyScreen() {
    const [members, setMembers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(collection(db, 'users', uid, 'modules', 'family', 'members'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setMembers(list);
        });

        return unsubscribe;
    };

    const addMember = async (name, role, age, relationship) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await addDoc(collection(db, 'users', uid, 'modules', 'family', 'members'), {
            name,
            role,
            age: parseInt(age) || 0,
            relationship,
            avatar: getAvatarEmoji(role),
            createdAt: Timestamp.now(),
        });

        setShowAddModal(false);
    };

    const deleteMember = async (memberId) => {
        const uid = auth.currentUser?.uid;
        await deleteDoc(doc(db, 'users', uid, 'modules', 'family', 'members', memberId));
        setSelectedMember(null);
    };

    const getAvatarEmoji = (role) => {
        const avatars = {
            father: '👨',
            mother: '👩',
            son: '👦',
            daughter: '👧',
            grandfather: '👴',
            grandmother: '👵',
            brother: '🧑',
            sister: '👩',
            uncle: '🧔',
            aunt: '👩‍🦱',
            cousin: '🧒',
            spouse: '💑',
            other: '👤',
        };
        return avatars[role] || '👤';
    };

    const getRoleLabel = (role) => {
        const labels = {
            father: 'Ota',
            mother: 'Ona',
            son: 'O\'g\'il',
            daughter: 'Qiz',
            grandfather: 'Buva',
            grandmother: 'Buvi',
            brother: 'Aka/Uka',
            sister: 'Opa/Singil',
            uncle: 'Tog\'a/Amaki',
            aunt: 'Xola/Amma',
            cousin: 'Jiyan',
            spouse: 'Turmush O\'rtog\'i',
            other: 'Boshqa',
        };
        return labels[role] || role;
    };

    // Group members by relationship level
    const groupedMembers = {
        immediate: members.filter(m => ['father', 'mother', 'spouse', 'son', 'daughter'].includes(m.role)),
        extended: members.filter(m => ['grandfather', 'grandmother', 'brother', 'sister', 'uncle', 'aunt', 'cousin'].includes(m.role)),
        other: members.filter(m => !['father', 'mother', 'spouse', 'son', 'daughter', 'grandfather', 'grandmother', 'brother', 'sister', 'uncle', 'aunt', 'cousin'].includes(m.role)),
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Family</Text>
                    <Text style={styles.subtitle}>Oila Daraxti</Text>
                </View>

                {/* Stats Card */}
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{members.length}</Text>
                            <Text style={styles.statLabel}>A'zolar</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{groupedMembers.immediate.length}</Text>
                            <Text style={styles.statLabel}>Yaqin</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{groupedMembers.extended.length}</Text>
                            <Text style={styles.statLabel}>Qarindosh</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Tree Visualization (Simplified) */}
                <View style={styles.treeSection}>
                    <Text style={styles.sectionTitle}>🌳 Oila Daraxti</Text>

                    {members.length === 0 ? (
                        <GlassCard style={styles.emptyCard}>
                            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
                            <Text style={styles.emptyText}>Oila a'zolarini qo'shing</Text>
                        </GlassCard>
                    ) : (
                        <View style={styles.treeContainer}>
                            {/* Immediate Family Row */}
                            {groupedMembers.immediate.length > 0 && (
                                <View style={styles.treeRow}>
                                    <Text style={styles.treeRowLabel}>Yaqin Oila</Text>
                                    <View style={styles.memberRow}>
                                        {groupedMembers.immediate.map((member) => (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={styles.memberNode}
                                                onPress={() => setSelectedMember(member)}
                                            >
                                                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                                                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                                                <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Extended Family Row */}
                            {groupedMembers.extended.length > 0 && (
                                <View style={styles.treeRow}>
                                    <Text style={styles.treeRowLabel}>Qarindoshlar</Text>
                                    <View style={styles.memberRow}>
                                        {groupedMembers.extended.map((member) => (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={styles.memberNode}
                                                onPress={() => setSelectedMember(member)}
                                            >
                                                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                                                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                                                <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Other Row */}
                            {groupedMembers.other.length > 0 && (
                                <View style={styles.treeRow}>
                                    <Text style={styles.treeRowLabel}>Boshqalar</Text>
                                    <View style={styles.memberRow}>
                                        {groupedMembers.other.map((member) => (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={styles.memberNode}
                                                onPress={() => setSelectedMember(member)}
                                            >
                                                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                                                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                                                <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Activity Feed */}
                <GlassCard style={styles.activityCard}>
                    <Text style={styles.activityTitle}>📋 So'nggi Faoliyat</Text>
                    <Text style={styles.activityText}>
                        {members.length > 0
                            ? `Oilada ${members.length} ta a'zo bor. Tez orada vazifa berish imkoniyati qo'shiladi!`
                            : 'Oila a\'zolarini qo\'shing va vazifalar bering.'
                        }
                    </Text>
                </GlassCard>
            </ScrollView>

            {/* Add FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Member Modal */}
            {showAddModal && (
                <AddMemberModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={addMember}
                />
            )}

            {/* Member Detail Modal */}
            {selectedMember && (
                <MemberDetailModal
                    visible={!!selectedMember}
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onDelete={deleteMember}
                    getRoleLabel={getRoleLabel}
                />
            )}
        </View>
    );
}

const AddMemberModal = ({ visible, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('other');
    const [age, setAge] = useState('');
    const [relationship, setRelationship] = useState('');

    const roles = [
        { id: 'father', label: 'Ota', emoji: '👨' },
        { id: 'mother', label: 'Ona', emoji: '👩' },
        { id: 'son', label: 'O\'g\'il', emoji: '👦' },
        { id: 'daughter', label: 'Qiz', emoji: '👧' },
        { id: 'spouse', label: 'Turmush O\'rtog\'i', emoji: '💑' },
        { id: 'grandfather', label: 'Buva', emoji: '👴' },
        { id: 'grandmother', label: 'Buvi', emoji: '👵' },
        { id: 'brother', label: 'Aka/Uka', emoji: '🧑' },
        { id: 'sister', label: 'Opa/Singil', emoji: '👩' },
        { id: 'other', label: 'Boshqa', emoji: '👤' },
    ];

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name, role, age, relationship);
        setName('');
        setRole('other');
        setAge('');
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.title}>Oila A'zosini Qo'shish</Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Ism"
                        placeholderTextColor={Theme.colors.gray[500]}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={modalStyles.label}>Rol</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.rolesScroll}>
                        <View style={modalStyles.rolesRow}>
                            {roles.map((r) => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={[
                                        modalStyles.roleChip,
                                        role === r.id && modalStyles.roleChipActive
                                    ]}
                                    onPress={() => setRole(r.id)}
                                >
                                    <Text style={modalStyles.roleEmoji}>{r.emoji}</Text>
                                    <Text style={[
                                        modalStyles.roleText,
                                        role === r.id && modalStyles.roleTextActive
                                    ]}>{r.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Yosh (ixtiyoriy)"
                        placeholderTextColor={Theme.colors.gray[500]}
                        keyboardType="numeric"
                        value={age}
                        onChangeText={setAge}
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
                            color={Theme.colors.cyan}
                            onPress={handleAdd}
                            style={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

const MemberDetailModal = ({ visible, member, onClose, onDelete, getRoleLabel }) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.memberAvatar}>{member.avatar}</Text>
                    <Text style={modalStyles.memberName}>{member.name}</Text>
                    <Text style={modalStyles.memberRole}>{getRoleLabel(member.role)}</Text>
                    {member.age > 0 && (
                        <Text style={modalStyles.memberAge}>{member.age} yosh</Text>
                    )}

                    <View style={modalStyles.actions}>
                        <GlassButton
                            title="Yopish"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <TouchableOpacity
                            style={modalStyles.deleteButton}
                            onPress={() => onDelete(member.id)}
                        >
                            <Text style={modalStyles.deleteText}>🗑️ O'chirish</Text>
                        </TouchableOpacity>
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
    statsCard: {
        marginBottom: Theme.spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.cyan,
    },
    statLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: Theme.colors.gray[100],
    },
    treeSection: {
        marginBottom: Theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.md,
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.xl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: Theme.spacing.md,
    },
    emptyText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[500],
    },
    treeContainer: {
        gap: Theme.spacing.lg,
    },
    treeRow: {
        marginBottom: Theme.spacing.md,
    },
    treeRowLabel: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    memberRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.md,
    },
    memberNode: {
        width: 80,
        alignItems: 'center',
        padding: Theme.spacing.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderRadius: Theme.radius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.cyan + '40',
    },
    memberAvatar: {
        fontSize: 36,
        marginBottom: Theme.spacing.sm,
    },
    memberName: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.white,
        fontWeight: Theme.typography.weights.medium,
        textAlign: 'center',
    },
    memberRole: {
        fontSize: Theme.typography.sizes.xs,
        color: Theme.colors.gray[600],
        marginTop: 2,
    },
    activityCard: {
        marginBottom: Theme.spacing.xl,
    },
    activityTitle: {
        fontSize: Theme.typography.sizes.lg,
        fontWeight: Theme.typography.weights.semibold,
        color: Theme.colors.white,
        marginBottom: Theme.spacing.sm,
    },
    activityText: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.gray[600],
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.cyan,
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
    label: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        marginBottom: Theme.spacing.sm,
        marginTop: Theme.spacing.md,
    },
    input: {
        backgroundColor: Theme.glass.input.backgroundColor,
        borderWidth: Theme.glass.input.borderWidth,
        borderColor: Theme.glass.input.borderColor,
        borderRadius: Theme.radius.md,
        padding: Theme.spacing.md,
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.base,
        marginBottom: Theme.spacing.md,
    },
    rolesScroll: {
        marginBottom: Theme.spacing.md,
    },
    rolesRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
    },
    roleChip: {
        alignItems: 'center',
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        minWidth: 70,
    },
    roleChipActive: {
        backgroundColor: Theme.colors.cyan + '20',
        borderColor: Theme.colors.cyan,
    },
    roleEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    roleText: {
        fontSize: Theme.typography.sizes.xs,
        color: Theme.colors.white,
    },
    roleTextActive: {
        color: Theme.colors.cyan,
    },
    actions: {
        flexDirection: 'row',
        marginTop: Theme.spacing.md,
    },
    memberAvatar: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: Theme.spacing.md,
    },
    memberName: {
        fontSize: Theme.typography.sizes['2xl'],
        fontWeight: Theme.typography.weights.bold,
        color: Theme.colors.white,
        textAlign: 'center',
    },
    memberRole: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.cyan,
        textAlign: 'center',
        marginTop: Theme.spacing.sm,
    },
    memberAge: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
        textAlign: 'center',
        marginTop: Theme.spacing.sm,
        marginBottom: Theme.spacing.lg,
    },
    deleteButton: {
        flex: 1,
        marginLeft: 8,
        padding: Theme.spacing.md,
        backgroundColor: Theme.colors.red + '20',
        borderRadius: Theme.radius.md,
        borderWidth: 1,
        borderColor: Theme.colors.red,
        alignItems: 'center',
    },
    deleteText: {
        color: Theme.colors.red,
        fontWeight: Theme.typography.weights.semibold,
    },
});
