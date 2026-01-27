import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Theme } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export default function TasksScreen({ navigation }) {
    const { t } = useLanguage();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const user = auth.currentUser;

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, `users/${user.uid}/tasks`));
            const querySnapshot = await getDocs(q);
            const taskList = [];
            querySnapshot.forEach((doc) => {
                taskList.push({ id: doc.id, ...doc.data() });
            });
            setTasks(taskList);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (!newTask.trim() || !user) return;
        try {
            const docRef = await addDoc(collection(db, `users/${user.uid}/tasks`), {
                title: newTask,
                status: 'active',
                createdAt: new Date().toISOString(),
                priority: 'medium'
            });
            setTasks([...tasks, { id: docRef.id, title: newTask, status: 'active' }]);
            setNewTask('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const toggleTask = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'active' : 'completed';
            await updateDoc(doc(db, `users/${user.uid}/tasks`, task.id), {
                status: newStatus
            });
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>{t.common.back}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t.tasks.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.input}
                    placeholder={t.tasks.add}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={newTask}
                    onChangeText={setNewTask}
                />
                <TouchableOpacity style={styles.addButton} onPress={addTask}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={Theme.colors.cyan} style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.tasks.pending} ({pendingTasks.length})</Text>
                        {pendingTasks.map(task => (
                            <TouchableOpacity
                                key={task.id}
                                style={styles.taskItem}
                                onPress={() => toggleTask(task)}
                            >
                                <View style={styles.checkbox} />
                                <Text style={styles.taskText}>{task.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.tasks.completed} ({completedTasks.length})</Text>
                        {completedTasks.map(task => (
                            <TouchableOpacity
                                key={task.id}
                                style={[styles.taskItem, styles.taskItemCompleted]}
                                onPress={() => toggleTask(task)}
                            >
                                <View style={[styles.checkbox, styles.checkboxChecked]}>
                                    <Text style={styles.checkIcon}>✓</Text>
                                </View>
                                <Text style={[styles.taskText, styles.taskTextCompleted]}>{task.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: Theme.colors.cyan,
        fontSize: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    inputArea: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    input: {
        flex: 1,
        backgroundColor: Theme.colors.card,
        borderRadius: 12,
        padding: 16,
        color: '#FFF',
    },
    addButton: {
        backgroundColor: Theme.colors.cyan,
        width: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    taskItemCompleted: {
        opacity: 0.5,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Theme.colors.textDim,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Theme.colors.green,
        borderColor: Theme.colors.green,
    },
    checkIcon: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    taskText: {
        color: '#FFF',
        fontSize: 14,
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    }
});
