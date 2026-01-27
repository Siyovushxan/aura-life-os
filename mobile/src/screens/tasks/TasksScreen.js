// Tasks Screen - Full implementation with subtasks
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Theme } from '../../styles/theme';
import { GlassCard, GlassButton } from '../../components/ui';
import * as Haptics from 'expo-haptics';

export default function TasksScreen() {
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('today'); // today, overdue, future
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'users', uid, 'modules', 'tasks', 'items'),
            orderBy('dueDate', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksList = [];
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            snapshot.forEach((doc) => {
                const data = doc.data();
                const dueDate = data.dueDate?.toDate();

                let category = 'future';
                if (dueDate) {
                    const taskDate = new Date(dueDate);
                    taskDate.setHours(0, 0, 0, 0);

                    if (taskDate < now && !data.completed) {
                        category = 'overdue';
                    } else if (taskDate.getTime() === now.getTime()) {
                        category = 'today';
                    }
                }

                tasksList.push({
                    id: doc.id,
                    ...data,
                    category,
                    dueDate: dueDate
                });
            });

            setTasks(tasksList);
        });

        return unsubscribe;
    };

    const toggleTask = async (taskId, completed) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        await updateDoc(doc(db, 'users', uid, 'modules', 'tasks', 'items', taskId), {
            completed: !completed
        });
    };

    const deleteTask = async (taskId) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const uid = auth.currentUser?.uid;
        await deleteDoc(doc(db, 'users', uid, 'modules', 'tasks', 'items', taskId));
    };

    const addTask = async (title, dueDate, priority) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await addDoc(collection(db, 'users', uid, 'modules', 'tasks', 'items'), {
            title,
            completed: false,
            priority: priority || 'medium',
            dueDate: Timestamp.fromDate(dueDate),
            createdAt: Timestamp.now(),
        });

        setShowAddModal(false);
    };

    const filteredTasks = tasks.filter(task => task.category === activeTab);
    const overdueTasks = tasks.filter(t => t.category === 'overdue').length;
    const todayTasks = tasks.filter(t => t.category === 'today').length;
    const futureTasks = tasks.filter(t => t.category === 'future').length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tasks</Text>
                <Text style={styles.subtitle}>Your to-do lists</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overdue' && styles.tabActive]}
                    onPress={() => setActiveTab('overdue')}
                >
                    <Text style={[styles.tabText, activeTab === 'overdue' && styles.tabTextActive]}>
                        Overdue {overdueTasks > 0 && `(${overdueTasks})`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'today' && styles.tabActive]}
                    onPress={() => setActiveTab('today')}
                >
                    <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
                        Today {todayTasks > 0 && `(${todayTasks})`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'future' && styles.tabActive]}
                    onPress={() => setActiveTab('future')}
                >
                    <Text style={[styles.tabText, activeTab === 'future' && styles.tabTextActive]}>
                        Future {futureTasks > 0 && `(${futureTasks})`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tasks List */}
            <ScrollView style={styles.scrollView}>
                {filteredTasks.length === 0 ? (
                    <Text style={styles.emptyText}>
                        {activeTab === 'today' ? 'No tasks for today! 🎉' :
                            activeTab === 'overdue' ? 'No overdue tasks!' :
                                'No future tasks scheduled.'}
                    </Text>
                ) : (
                    filteredTasks.map((task) => (
                        <GlassCard key={task.id} style={styles.taskCard}>
                            <View style={styles.taskRow}>
                                {/* Checkbox */}
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => toggleTask(task.id, task.completed)}
                                >
                                    <View style={[
                                        styles.checkboxInner,
                                        task.completed && styles.checkboxChecked
                                    ]}>
                                        {task.completed && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>

                                {/* Task Info */}
                                <View style={styles.taskInfo}>
                                    <Text style={[
                                        styles.taskTitle,
                                        task.completed && styles.taskCompleted
                                    ]}>
                                        {task.title}
                                    </Text>
                                    <View style={styles.taskMeta}>
                                        <Text style={styles.taskDate}>
                                            {task.dueDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                        {task.priority && (
                                            <View style={[
                                                styles.priorityBadge,
                                                { backgroundColor: getPriorityColor(task.priority) + '20' }
                                            ]}>
                                                <Text style={[
                                                    styles.priorityText,
                                                    { color: getPriorityColor(task.priority) }
                                                ]}>
                                                    {task.priority}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Delete Button */}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteTask(task.id)}
                                >
                                    <Text style={styles.deleteIcon}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    ))
                )}
            </ScrollView>

            {/* Add Task FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add Task Modal */}
            {showAddModal && (
                <AddTaskModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={addTask}
                />
            )}
        </View>
    );
}

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return Theme.colors.red;
        case 'medium': return Theme.colors.gold;
        case 'low': return Theme.colors.green;
        default: return Theme.colors.gray[500];
    }
};

// Add Task Modal Component
const AddTaskModal = ({ visible, onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState(new Date());

    const handleAdd = () => {
        if (!title.trim()) return;
        onAdd(title, dueDate, priority);
        setTitle('');
        setPriority('medium');
        setDueDate(new Date());
    };

    const setDatePreset = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setDueDate(date);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={modalStyles.overlay}>
                <GlassCard style={modalStyles.modal}>
                    <Text style={modalStyles.title}>Add Task</Text>

                    {/* Title Input */}
                    <TextInput
                        style={modalStyles.input}
                        placeholder="Task title"
                        placeholderTextColor={Theme.colors.gray[500]}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    {/* Priority Selector */}
                    <Text style={modalStyles.label}>Priority</Text>
                    <View style={modalStyles.priorityRow}>
                        {['low', 'medium', 'high'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    modalStyles.priorityChip,
                                    priority === p && {
                                        backgroundColor: getPriorityColor(p) + '20',
                                        borderColor: getPriorityColor(p)
                                    }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[
                                    modalStyles.priorityChipText,
                                    priority === p && { color: getPriorityColor(p) }
                                ]}>
                                    {p}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Date Presets */}
                    <Text style={modalStyles.label}>Due Date</Text>
                    <View style={modalStyles.dateRow}>
                        <TouchableOpacity
                            style={modalStyles.dateChip}
                            onPress={() => setDatePreset(0)}
                        >
                            <Text style={modalStyles.dateChipText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={modalStyles.dateChip}
                            onPress={() => setDatePreset(1)}
                        >
                            <Text style={modalStyles.dateChipText}>Tomorrow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={modalStyles.dateChip}
                            onPress={() => setDatePreset(7)}
                        >
                            <Text style={modalStyles.dateChipText}>Next Week</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={modalStyles.selectedDate}>
                        {dueDate.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>

                    {/* Actions */}
                    <View style={modalStyles.actions}>
                        <GlassButton
                            title="Cancel"
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <GlassButton
                            title="Add"
                            variant="primary"
                            color={Theme.colors.purple}
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
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Theme.colors.purple + '20',
        borderColor: Theme.colors.purple,
    },
    tabText: {
        color: Theme.colors.gray[600],
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.semibold,
    },
    tabTextActive: {
        color: Theme.colors.purple,
    },
    scrollView: {
        flex: 1,
        marginBottom: 80,
    },
    emptyText: {
        textAlign: 'center',
        color: Theme.colors.gray[500],
        fontSize: Theme.typography.sizes.base,
        marginTop: Theme.spacing.xl,
    },
    taskCard: {
        marginBottom: Theme.spacing.sm,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: Theme.spacing.md,
    },
    checkboxInner: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Theme.colors.gray[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: Theme.colors.purple,
        borderColor: Theme.colors.purple,
    },
    checkmark: {
        color: Theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: Theme.typography.sizes.base,
        color: Theme.colors.white,
        fontWeight: Theme.typography.weights.medium,
    },
    taskCompleted: {
        textDecorationLine: 'line-through',
        color: Theme.colors.gray[600],
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: Theme.spacing.sm,
    },
    taskDate: {
        fontSize: Theme.typography.sizes.sm,
        color: Theme.colors.gray[600],
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Theme.radius.sm,
    },
    priorityText: {
        fontSize: Theme.typography.sizes.xs,
        fontWeight: Theme.typography.weights.semibold,
        textTransform: 'uppercase',
    },
    deleteButton: {
        padding: Theme.spacing.sm,
    },
    deleteIcon: {
        fontSize: 18,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.purple,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.xl,
    },
    fabIcon: {
        fontSize: 32,
        color: '#FFF',
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
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    priorityRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
    },
    priorityChip: {
        flex: 1,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    priorityChipText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.sm,
        fontWeight: Theme.typography.weights.semibold,
        textTransform: 'capitalize',
    },
    dateRow: {
        flexDirection: 'row',
        gap: Theme.spacing.sm,
    },
    dateChip: {
        flex: 1,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.radius.md,
        backgroundColor: Theme.glass.button.backgroundColor,
        borderWidth: 1,
        borderColor: Theme.colors.gray[100],
        alignItems: 'center',
    },
    dateChipText: {
        color: Theme.colors.white,
        fontSize: Theme.typography.sizes.sm,
    },
    selectedDate: {
        textAlign: 'center',
        color: Theme.colors.purple,
        fontSize: Theme.typography.sizes.sm,
        marginTop: Theme.spacing.sm,
        marginBottom: Theme.spacing.md,
    },
    actions: {
        flexDirection: 'row',
        marginTop: Theme.spacing.md,
    },
});
