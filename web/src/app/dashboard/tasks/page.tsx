"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import HistoryModal from '@/components/HistoryModal';
import { getLocalTodayStr } from '@/lib/dateUtils';

import ConfirmationModal from '@/components/ConfirmationModal';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/context/AuthContext';
import {
    getTasksByDate,
    getUpcomingTasks,
    getOverdueTasks,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    moveTask,
    seedTasks,
    subscribeToTasksByDate,
    subscribeToOverdueTasks,
    subscribeToUpcomingTasks,
    Task,
    Priority,
    SubTask
} from '@/services/tasksService';
import { getScheduledInsight, dismissInsight } from '@/services/aiPersistenceService';
import Modal from '@/components/Modal';

import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';
import { PremiumEmptyState } from '@/components/dashboard/PremiumEmptyState';

// --- RECURSIVE SUBTASK COMPONENT ---
interface RecursiveSubtaskListProps {
    subtasks: SubTask[];
    onUpdate: (updated: SubTask[]) => void;
    level?: number;
}

const RecursiveSubtaskList: React.FC<RecursiveSubtaskListProps> = ({ subtasks, onUpdate, level = 0 }) => {
    const handleAddChild = (parentId: string) => {
        const updateRecursive = (list: SubTask[]): SubTask[] => {
            return list.map(s => {
                if (s.id === parentId) {
                    return {
                        ...s,
                        subtasks: [...(s.subtasks || []), {
                            id: Date.now().toString(),
                            title: '',
                            status: 'todo',
                            priority: 'medium',
                            subtasks: [],
                            date: s.date || getLocalTodayStr(),
                            startTime: '09:00',
                            endTime: '10:00',
                            parentId: s.id,
                            parentTitle: s.title
                        }]
                    };
                }
                if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
                return s;
            });
        };
        onUpdate(updateRecursive(subtasks));
    };

    const handleToggleStatus = (id: string) => {
        const updateRecursive = (list: SubTask[]): SubTask[] => {
            return list.map(s => {
                if (s.id === id) {
                    return { ...s, status: s.status === 'done' ? 'todo' : 'done' };
                }
                if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
                return s;
            });
        };
        onUpdate(updateRecursive(subtasks));
    };

    const handleFieldChange = (id: string, field: keyof SubTask, value: string | Priority | SubTask[]) => {
        const updateRecursive = (list: SubTask[]): SubTask[] => {
            return list.map(s => {
                if (s.id === id) return { ...s, [field]: value };
                if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
                return s;
            });
        };
        onUpdate(updateRecursive(subtasks));
    };

    const handleDelete = (id: string) => {
        const deleteRecursive = (list: SubTask[]): SubTask[] => {
            return list.filter(s => s.id !== id).map(s => {
                if (s.subtasks) return { ...s, subtasks: deleteRecursive(s.subtasks) };
                return s;
            });
        };
        onUpdate(deleteRecursive(subtasks));
    };

    return (
        <div className="space-y-3">
            {subtasks.map((sub) => (
                <div key={sub.id} className="space-y-2">
                    <div className="flex items-center gap-2 group">
                        <button
                            onClick={() => handleToggleStatus(sub.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${sub.status === 'done' ? 'bg-aura-green border-aura-green' : 'border-gray-500'}`}
                        >
                            {sub.status === 'done' && <span className="text-black text-[10px]">✓</span>}
                        </button>
                        <input
                            type="text"
                            aria-label="Kichik vazifa nomi"
                            placeholder="Kichik vazifa..."
                            className={`bg-transparent border-none focus:outline-none flex-1 text-sm ${sub.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}
                            value={sub.title}
                            onChange={(e) => handleFieldChange(sub.id, 'title', e.target.value)}
                        />
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input
                                type="date"
                                aria-label="Kichik vazifa sanasi"
                                className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-gray-400 focus:outline-none [color-scheme:dark]"
                                value={sub.date}
                                onChange={(e) => handleFieldChange(sub.id, 'date', e.target.value)}
                            />
                            <input
                                type="time"
                                aria-label="Boshlash vaqti"
                                className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-gray-400 focus:outline-none"
                                value={sub.startTime}
                                onChange={(e) => handleFieldChange(sub.id, 'startTime', e.target.value)}
                            />
                            <button
                                onClick={() => handleAddChild(sub.id)}
                                className="p-1 text-aura-cyan text-[10px] uppercase font-black tracking-tighter hover:scale-110 transition-all"
                                title="Add sub-sub task"
                            >
                                + Sub
                            </button>
                            <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-1 text-gray-500 hover:text-aura-red transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    {/* NESTED CHILDREN */}
                    {sub.subtasks && sub.subtasks.length > 0 && (
                        <div className="pl-6 border-l border-white/5 mt-2">
                            <RecursiveSubtaskList
                                subtasks={sub.subtasks}
                                onUpdate={(updated) => {
                                    const updateRecursive = (list: SubTask[]): SubTask[] => {
                                        return list.map(s => {
                                            if (s.id === sub.id) return { ...s, subtasks: updated };
                                            if (s.subtasks) return { ...s, subtasks: updateRecursive(s.subtasks) };
                                            return s;
                                        });
                                    };
                                    onUpdate(updateRecursive(subtasks));
                                }}
                                level={level + 1}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default function TasksDashboard() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('tasks');
    }, []);
    // const router = useRouter();

    // State
    const [todayTasks, setTodayTasks] = useState<Task[]>([]);
    const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
    const [futureTasks, setFutureTasks] = useState<Task[]>([]);
    // const [focusStats, setFocusStats] = useState({ totalMinutes: 0 });
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Task / Edit Task State
    const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'status'>>({
        title: '',
        priority: 'medium',
        startTime: '09:00',
        endTime: '10:00',
        date: '',
        category: 'Personal',
        subtasks: [],
        resources: [],
        createdAt: Date.now()
    });
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'analytics'>('dashboard');
    const [focusedTask, setFocusedTask] = useState<Task | null>(null);
    const [dragedTaskId, setDragedTaskId] = useState<string | null>(null);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const [isArchived, setIsArchived] = useState(false);

    useEffect(() => {
        const todayStr = getLocalTodayStr();
        setIsArchived(selectedDate !== todayStr);
    }, [selectedDate]);

    // AI Insight State
    const [aiInsight, setAiInsight] = useState<any | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
    const [suggestionAdded, setSuggestionAdded] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'info' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' | 'warning' = 'danger') => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, type });
    };

    const [moveTaskData, setMoveTaskData] = useState<{ isOpen: boolean, taskId: string, currentDate: string } | null>(null);

    // V23: Real-time Data Subscriptions
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // 1. Current Date Tasks
        const unsubToday = subscribeToTasksByDate(user.uid, selectedDate, (tasks) => {
            setTodayTasks(tasks);
            setLoading(false);
        });

        // 2. Overdue Tasks
        const todayStr = getLocalTodayStr();
        const unsubOverdue = subscribeToOverdueTasks(user.uid, todayStr, (tasks) => {
            setOverdueTasks(tasks);
        });

        // 3. Upcoming Tasks
        const unsubUpcoming = subscribeToUpcomingTasks(user.uid, todayStr, (tasks) => {
            setFutureTasks(tasks);
        });

        return () => {
            unsubToday();
            unsubOverdue();
            unsubUpcoming();
        };
    }, [user, selectedDate]);

    // V23: Scheduled AI Insight - Manual Trigger Only
    const fetchAiInsight = async () => {
        if (!user) return;
        setAiLoading(true);
        try {
            // Pass tasks for context
            const allTasks = [...todayTasks, ...overdueTasks, ...futureTasks];
            const insight = await getScheduledInsight(user.uid, 'tasks', language, { tasks: allTasks }, { force: true });

            if (insight) {
                setAiInsight(insight.data || insight);
            }
        } catch (err) {
            console.error("Tasks AI Error:", err);
        } finally {
            setAiLoading(false);
        }
    };

    // Auto-fetch REMOVED. User must click button.

    // Unified Data Collector for Analytics
    const getAllRelatedTasks = (deep = false): (Task | SubTask)[] => {
        const allLoaded = Array.from(new Map([...todayTasks, ...overdueTasks, ...futureTasks].map(t => [t.id, t])).values());

        if (!focusedTask) {
            return allLoaded;
        }

        // For focused view, we consider:
        // 1. Direct nested subtasks from focusedTask document
        // 2. Independent documents where parentId === focusedTask.id
        const nestedDirect = (focusedTask.subtasks || []);
        const independentDirect = allLoaded.filter(t => t.parentId === focusedTask.id);

        const topLevelRelated = [...nestedDirect, ...independentDirect];

        if (!deep) return topLevelRelated;

        // If deep is requested (e.g. for time distribution), flatten everything
        const results: (Task | SubTask)[] = [];
        const seenIds = new Set<string>();

        const traverse = (item: any) => {
            if (seenIds.has(item.id)) return;
            seenIds.add(item.id);
            if (item.id !== focusedTask.id) results.push(item);
            if (item.subtasks) item.subtasks.forEach((s: any) => traverse(s));
        };

        topLevelRelated.forEach(t => traverse(t));
        return results;
    };

    // Deep Progress Helper
    const getDeepSubtaskStats = (items: (Task | SubTask)[]): { done: number, total: number } => {
        let done = 0;
        let total = 0;
        const traverse = (list: (Task | SubTask)[]) => {
            list.forEach(s => {
                total++;
                if (s.status === 'done') done++;
                if (s.subtasks && s.subtasks.length > 0) traverse(s.subtasks);
            });
        };
        traverse(items);
        return { done, total };
    };

    // Load Data
    const loadTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [t, o, f] = await Promise.all([
                getTasksByDate(user.uid, selectedDate),
                getOverdueTasks(user.uid, selectedDate),
                getUpcomingTasks(user.uid, selectedDate)
            ]);
            setTodayTasks(t);
            setOverdueTasks(o);
            setFutureTasks(f);

            // Original seeding logic, adapted to use the new fetched data
            const todayStr = getLocalTodayStr();
            if (t.length === 0 && o.length === 0 && f.length === 0 && selectedDate === todayStr) {
                await seedTasks(user.uid);
                const seededToday = await getTasksByDate(user.uid, todayStr);
                setTodayTasks(seededToday);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        if (user) {
            clearNotification('tasks');
            loadTasks();
        }
    }, [user, loadTasks]);

    // Fetch AI Insight





    // Initialize newTask date when modal opens (only if not editing)
    useEffect(() => {
        if (isModalOpen && !editingTaskId) {
            setNewTask(prev => ({ ...prev, date: selectedDate }));
        }
    }, [isModalOpen, selectedDate, editingTaskId]);


    const handleVoiceCommand = async (cmd: any) => {
        if (!user || isArchived) return;
        console.log('Tasks Voice Command:', cmd);

        const { action, data: cmdData } = cmd;

        if (action === 'add' || action === 'tasks.create_task') { // Support both old and new for safety
            const title = cmdData?.title;
            if (title) {
                const taskPayload: Omit<Task, 'id'> = {
                    title,
                    description: cmdData?.description || '',
                    status: 'todo',
                    priority: (cmdData?.priority as Priority) || 'medium',
                    startTime: cmdData?.time || '09:00',
                    endTime: '10:00',
                    category: cmdData?.category || 'Voice',
                    date: cmdData?.date || selectedDate,
                    subtasks: [],
                    resources: []
                };
                await addTask(user.uid, taskPayload);
                if (loadTasks) loadTasks(); // Guard against loadTasks not being available but normally it is
            }
        } else if (action === 'add_subtask') {
            const parentTitle = cmdData?.parent_title;
            const subTitle = cmdData?.title;
            if (parentTitle && subTitle) {
                const parentTask = todayTasks.find(t => t.title.toLowerCase().includes(parentTitle.toLowerCase()));
                if (parentTask) {
                    const newSub: SubTask = {
                        id: Date.now().toString(),
                        title: subTitle,
                        status: 'todo',
                        priority: 'medium',
                        createdAt: Date.now()
                    };
                    const updatedSubtasks = [...(parentTask.subtasks || []), newSub];
                    await updateTask(user.uid, parentTask.id, { subtasks: updatedSubtasks });
                    loadTasks();
                }
            }
        } else if (action === 'log') {
            // If they accidentally say "log steps" in tasks, redirect logic in VoiceInput handles it
            // but we can also handle it here if redirect is denied.
        }
    };

    // Actions
    const handleToggleStatus = async (task: Task) => {
        if (!user || isArchived) return;

        // Completion Dependency Logic
        const pendingSubtasks = task.subtasks?.filter(s => s.status !== 'done') || [];

        const executeToggle = async () => {
            const newStatus = task.status === 'done' ? 'todo' : 'done';
            // Optimistic UI
            setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
            setOverdueTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
            setFutureTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

            await updateTaskStatus(user.uid, task.id, newStatus);
            loadTasks();
        };

        if (task.status !== 'done' && pendingSubtasks.length > 0) {
            // Detailed message with titles to help user identify "invisible" subtasks
            const subtaskTitles = pendingSubtasks
                .slice(0, 3)
                .map(s => `- ${s.title || "Nomsiz vazifa"}`)
                .join('\n');
            const moreCount = pendingSubtasks.length > 3 ? `(+${pendingSubtasks.length - 3} ta)` : '';

            triggerConfirm(
                "Diqqat!",
                `Ushbu vazifada hali ${pendingSubtasks.length} ta bajarilmagan kichik vazifalar bor:\n\n${subtaskTitles}\n${moreCount}\n\nBaribir yakunlaysizmi?`,
                executeToggle,
                'warning'
            );
        } else {
            executeToggle();
        }
    };

    const handleOpenEditModal = (task: any) => {
        // If it's a subtask, we might still want to edit the parent task or the subtask itself.
        // For now, let's allow finding the root parent task if it's a subtask being clicked.
        // But the user usually wants to edit the specific subtask within the context of the root.

        let rootTask = task;
        if (task.isSubtask) {
            // Find the root task in our currently loaded lists
            rootTask = todayTasks.find(t => t.id === task.parentId) ||
                overdueTasks.find(t => t.id === task.parentId) ||
                futureTasks.find(t => t.id === task.parentId);

            if (!rootTask) {
                // If not found in memory, we might need a fetch, but for now we fallback
                rootTask = task;
            }
        }

        // Ensure description is properly set
        const taskDescription = rootTask.description || '';

        setNewTask({
            title: rootTask.title || '',
            description: taskDescription,
            priority: rootTask.priority || 'medium',
            startTime: rootTask.startTime || '09:00',
            endTime: rootTask.endTime || '10:00',
            date: rootTask.date || selectedDate,
            category: rootTask.category || 'Personal',
            subtasks: rootTask.subtasks || [],
            resources: rootTask.resources || [],
            createdAt: rootTask.createdAt || Date.now()
        });
        setEditingTaskId(rootTask.id);
        setIsModalOpen(true);
    };

    // Flattening Helper for Dashboard Visibility
    const flattenTasksForColumn = (rootTasks: Task[], columnType: 'overdue' | 'today' | 'future'): any[] => {
        const result: any[] = [];
        const todayStr = getLocalTodayStr();

        const traverse = (items: any[], parentTitle?: string, parentId?: string) => {
            items.forEach(item => {
                const itemDate = item.date || '';
                let match = false;

                if (columnType === 'today') {
                    match = itemDate === selectedDate;
                } else if (columnType === 'overdue') {
                    // Update: Include DONE tasks in Overdue column too, as requested by user
                    match = itemDate < todayStr && itemDate !== '';
                } else if (columnType === 'future') {
                    match = itemDate > todayStr && itemDate !== selectedDate;
                }

                if (match || (focusedTask && item.parentId === focusedTask.id)) {
                    // Refinement: Hide subtasks from main columns unless we are in focused view
                    // OR if they are specifically matching the column criteria and we want them flat.
                    // But the user specifically asked: "subtasklar asosiy tasklar sahifasida ko'rinmaydi faqatgina tarkibiga qo'shilgan asosiy task nomi click bo'lganida ko'rinadi"

                    // Logic: If focused, show ONLY subtasks of the focused task (and the focused task itself)
                    // If not focused, show ONLY root tasks.
                    const isDirectChild = item.parentId === focusedTask?.id;
                    const isFocusedSelf = item.id === focusedTask?.id;
                    const shouldShow = focusedTask ? (isDirectChild || isFocusedSelf) : !item.parentId;

                    if (shouldShow) {
                        // If it's a subtask with NO date, and its parent is focused, show it in 'today' column by default
                        let finalMatch = match;
                        if (focusedTask && isDirectChild && !item.date && columnType === 'today') {
                            finalMatch = true;
                        }

                        if (finalMatch) {
                            result.push({
                                ...item,
                                isSubtaskDisplay: !!parentTitle,
                                parentTitleDisplay: parentTitle,
                                parentIdDisplay: parentId
                            });
                        }
                    }
                }

                if (item.subtasks && item.subtasks.length > 0) {
                    traverse(item.subtasks, item.title, item.id);
                }
            });
        };

        // We need to look through ALL root tasks to find subtasks that might belong in this column
        // But for performance, let's just use the ones already provided by the service as a starting point.
        // Actually, the service already returns root tasks for the specific columns.
        // So traverse(todayTasks) will find subtasks that match today's date.
        // However, a subtask might be for today, but its parent is for the future.
        // So we should ideally traverse ALL root tasks.
        const allRootTasks = [...todayTasks, ...overdueTasks, ...futureTasks];
        // Deduplicate root tasks just in case
        const uniqueRoots = Array.from(new Map(allRootTasks.map(t => [t.id, t])).values());

        traverse(uniqueRoots);

        // Remove duplicates if a subtask was added twice (shouldn't happen with traverse but safe to check)
        return Array.from(new Map(result.map(t => [t.id, t])).values());
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTaskId(null);
        setNewTask({
            title: '',
            priority: 'medium',
            startTime: '09:00',
            endTime: '10:00',
            date: selectedDate,
            category: 'Personal',
            subtasks: [],
            resources: [],
            createdAt: Date.now()
        });
    };

    const handleSaveTask = async () => {
        if (!user || !newTask.title || isArchived) return;

        if (editingTaskId) {
            await updateTask(user.uid, editingTaskId, {
                title: newTask.title,
                priority: newTask.priority as Priority,
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                date: newTask.date || selectedDate,
                category: newTask.category,
                subtasks: newTask.subtasks,
                resources: newTask.resources
            });
        } else {
            const taskPayload: Omit<Task, 'id'> = {
                title: newTask.title,
                status: 'todo',
                priority: newTask.priority as Priority,
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                category: newTask.category,
                date: newTask.date || selectedDate,
                subtasks: newTask.subtasks,
                resources: newTask.resources,
                createdAt: newTask.createdAt || Date.now(),
                parentId: (newTask as any).parentId || null,
                parentTitle: (newTask as any).parentTitle || null
            };
            await addTask(user.uid, taskPayload);
        }

        handleCloseModal();
        loadTasks();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!user || isArchived) return;

        triggerConfirm(
            "Vazifani o'chirish",
            "Ushbu vazifani o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
            async () => {
                // Optimistic Update
                setTodayTasks(prev => prev.filter(t => t.id !== taskId));
                setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
                setFutureTasks(prev => prev.filter(t => t.id !== taskId));

                await deleteTask(user.uid, taskId);
                loadTasks();
            },
            'danger'
        );
    }

    const handleMoveToDate = async (taskId: string, date: string) => {
        if (!user || isArchived) return;
        await moveTask(user.uid, taskId, date);
        loadTasks();
    };

    const handleAddAISuggestion = async () => {
        if (!user || !aiInsight || isArchived) return;
        setIsAddingSuggestion(true);
        try {
            const today = getLocalTodayStr();
            const effectiveInsight = aiInsight.data || aiInsight;

            const subtasks: SubTask[] = (effectiveInsight.roadmap || []).map((step: string) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: step,
                completed: false
            }));

            const taskPayload: Omit<Task, 'id'> = {
                title: effectiveInsight.title || aiInsight.title || "AI Planned Task",
                description: effectiveInsight.optimization || effectiveInsight.suggestion || aiInsight.suggestion || "AI recommended action plan.",
                status: 'todo',
                priority: (effectiveInsight.priority as Priority) || 'high',
                startTime: '10:00',
                endTime: '11:00',
                // Dynamic Category: Use insight category if available, otherwise default to 'Personal' or context-aware
                category: effectiveInsight.category || aiInsight.category || 'Personal',
                date: today,
                subtasks: subtasks,
                resources: [],
                createdAt: Date.now()
            };
            await addTask(user.uid, taskPayload);
            await dismissInsight(user.uid, 'tasks');

            // Show success state
            setIsAddingSuggestion(false);
            setSuggestionAdded(true);
            loadTasks();

            // Delay clearing to show success message
            setTimeout(() => {
                setAiInsight(null);
                setSuggestionAdded(false);
            }, 2000);
        } catch (error) {
            console.error(error);
            setIsAddingSuggestion(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'text-aura-red bg-aura-red/10 border-aura-red/20';
            case 'medium': return 'text-aura-gold bg-aura-gold/10 border-aura-gold/20';
            case 'low': return 'text-aura-green bg-aura-green/10 border-aura-green/20';
            default: return 'text-gray-400 bg-gray-800';
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        if (isArchived) {
            e.preventDefault();
            return;
        }
        setDragedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetDate: string) => {
        e.preventDefault();
        if (!user || !dragedTaskId || isArchived) return;

        // Optimistic update
        setTodayTasks(prev => prev.filter(t => t.id !== dragedTaskId));
        setOverdueTasks(prev => prev.filter(t => t.id !== dragedTaskId));
        setFutureTasks(prev => prev.filter(t => t.id !== dragedTaskId));

        // When dropping on a column, we also want to "promote" it to a root task
        // by removing the parentId.
        await updateTask(user.uid, dragedTaskId, {
            date: targetDate,
            parentId: null as any, // Nullify parentId to make it a root task
            parentTitle: null as any
        });

        setDragedTaskId(null);
        loadTasks();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const TaskCard = ({ task }: { task: Task & { isSubtaskDisplay?: boolean, parentTitleDisplay?: string } }) => {
        const [isDragOver, setIsDragOver] = useState(false);

        const handleCardDrop = async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (!user || !dragedTaskId || dragedTaskId === task.id) return;

            if (dragedTaskId === task.id || task.parentId === dragedTaskId) return;

            // When dropping ONTO another task, it becomes a subtask
            await updateTask(user.uid, dragedTaskId, {
                parentId: task.id,
                parentTitle: task.title,
                date: task.date || selectedDate
            });
            setDragedTaskId(null);
            loadTasks();
        };

        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={(e) => {
                    if (dragedTaskId && dragedTaskId !== task.id) {
                        e.preventDefault();
                        setIsDragOver(true);
                    }
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleCardDrop}
                className={`group relative flex flex-col justify-between p-6 rounded-[2rem] border transition-all duration-500 overflow-visible
                    ${isDragOver ? 'border-aura-cyan bg-aura-cyan/10 scale-[1.05] z-30 shadow-[0_0_40px_rgba(0,240,255,0.2)]' :
                        task.status === 'done'
                            ? 'bg-black/40 border-white/5 opacity-50 grayscale hover:scale-[1.01]'
                            : 'bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl'
                    } mb-8`} // Added mb-8 for spacing for the bottom button
            >

                {/* DONE STRIPE */}
                {task.status === 'done' && (
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10 rotate-[-5deg] pointer-events-none z-0"></div>
                )}

                <div className="relative z-10 space-y-4">
                    {/* TOP META */}
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500">
                                {task.category || t.family.task}
                            </span>
                            {task.parentTitleDisplay && (
                                <span className="text-[9px] font-black text-aura-cyan bg-aura-cyan/10 px-3 py-1 rounded-xl border border-aura-cyan/20">
                                    🔗 {task.parentTitleDisplay}
                                </span>
                            )}
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${task.priority === 'high' ? 'text-aura-red border-aura-red/30 bg-aura-red/10' :
                            task.priority === 'medium' ? 'text-aura-gold border-aura-gold/30 bg-aura-gold/10' :
                                'text-aura-cyan border-aura-cyan/30 bg-aura-cyan/10'
                            }`}>
                            {t.tasks[task.priority] || task.priority}
                        </div>
                    </div>

                    {/* TITLE & CHECKBOX */}
                    <div className="flex gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                            className={`mt-1 flex-shrink-0 w-7 h-7 rounded-xl border-2 transition-all flex items-center justify-center ${task.status === 'done'
                                ? 'bg-aura-green border-aura-green text-black scale-110'
                                : 'border-white/20 hover:border-aura-cyan hover:bg-aura-cyan/10'
                                }`}
                        >
                            {task.status === 'done' && <span className="font-black text-xs">✓</span>}
                        </button>

                        <div className="flex-1" onClick={() => setFocusedTask(task)}>
                            <h4 className={`font-display font-black text-lg leading-tight transition-all ${task.status === 'done' ? 'text-gray-600 line-through' : 'text-white group-hover:text-aura-cyan'}`}>
                                {task.title}
                            </h4>
                            {task.description && (
                                <p className="mt-2 text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                    {task.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-4 flex flex-wrap gap-4 items-center text-[10px] font-mono font-bold text-gray-500 border-t border-white/5">
                        {task.startTime && (
                            <div className="flex items-center gap-2 group-hover:text-aura-gold transition-colors">
                                <span>⏰</span>
                                <span>{task.startTime} — {task.endTime}</span>
                            </div>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-2 text-aura-cyan ml-auto bg-aura-cyan/5 px-2 py-0.5 rounded-lg border border-aura-cyan/10">
                                <span>⛓️</span>
                                <span>{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* HOVER ACTIONS - FLOATING PREMIUM OVERLAY (BOTTOM) */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-[#0A0A0A] rounded-[1.5rem] border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(null);
                            setNewTask({ title: '', priority: task.priority, date: task.date || selectedDate, category: task.category, parentId: task.id, parentTitle: task.title } as any);
                            setIsModalOpen(true);
                        }}
                        className="h-9 px-3 rounded-xl bg-white/10 hover:bg-aura-cyan hover:text-black text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                        title={t.tasks.actions.subtask}
                    >
                        <span>+</span> {t.tasks.actions.subtask}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setMoveTaskData({ isOpen: true, taskId: task.id, currentDate: task.date || selectedDate }); }}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white transition-all flex items-center justify-center text-lg"
                        title={t.tasks.actions.move}
                    >
                        🚚
                    </button>

                    {task.status !== 'done' && (
                        <Link
                            href={`/dashboard/focus?taskId=${task.id}&taskName=${encodeURIComponent(task.title)}`}
                            prefetch={false}
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 rounded-xl bg-aura-purple/20 hover:bg-aura-purple text-white transition-all flex items-center justify-center text-lg"
                            title={t.tasks.actions.focus}
                        >
                            🎯
                        </Link>
                    )}

                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(task); }}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white transition-all flex items-center justify-center text-lg"
                        title={t.tasks.actions.edit}
                    >
                        ✏️
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="w-9 h-9 rounded-xl bg-aura-red/10 hover:bg-aura-red hover:text-white text-aura-red transition-all flex items-center justify-center text-lg"
                        title={t.tasks.actions.delete}
                    >
                        🗑️
                    </button>
                </div>
            </div>
        );
    };

    // Stats
    const completedCount = todayTasks.filter(t => t.status === 'done').length;
    const pendingCount = todayTasks.filter(t => t.status !== 'done').length;
    const efficiency = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

    // Helper for display
    const getDisplayTasks = (colType: 'overdue' | 'today' | 'future') => {
        // When focused, we need to include ALL tasks in the flattening source 
        // to find independent documents that point to the focused parent.
        const source = focusedTask
            ? Array.from(new Map([...todayTasks, ...overdueTasks, ...futureTasks, focusedTask].map(t => [t.id, t])).values())
            : [...todayTasks, ...overdueTasks, ...futureTasks];

        const flat = flattenTasksForColumn(source, colType);
        return focusedTask ? flat.filter(t => t.id !== focusedTask.id) : flat;
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in relative">

                {/* SINGLE LINE HEADER (V9.1) */}
                <div className="flex items-center justify-between gap-6 mb-8 relative z-20 bg-black/40 p-4 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-6">
                        {focusedTask ? (
                            <button
                                onClick={async () => {
                                    // Smart navigation: go back one level
                                    if (focusedTask.parentId) {
                                        // Find parent task and focus on it
                                        const parentTask = [...todayTasks, ...overdueTasks, ...futureTasks].find(t => t.id === focusedTask.parentId);
                                        if (parentTask) {
                                            setFocusedTask(parentTask);
                                        } else {
                                            // Parent not found in memory, go back to dashboard
                                            setFocusedTask(null);
                                        }
                                    } else {
                                        // Root task, go back to dashboard
                                        setFocusedTask(null);
                                    }
                                }}
                                className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all"
                            >
                                <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                                <div>
                                    <h1 className="text-xl font-display font-black text-white tracking-tight leading-none">
                                        {focusedTask.title}
                                    </h1>
                                    <span className="text-[10px] text-aura-cyan font-black uppercase tracking-[0.2em]">Focus View</span>
                                </div>
                            </button>
                        ) : (
                            <div>
                                <h1 className="text-3xl font-display font-black text-white tracking-tighter flex items-center gap-2 leading-none">
                                    {t.tasks.title}
                                </h1>
                                <p className="text-gray-500 font-medium text-xs mt-1">{t.tasks.subtitle}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

                        <div className="h-10 w-[1px] bg-white/10"></div>

                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'dashboard' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                            >
                                DASHBOARD
                            </button>
                            <button
                                onClick={() => setViewMode('analytics')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'analytics' ? 'bg-aura-cyan text-black shadow-lg scale-105' : 'text-gray-500 hover:text-white'}`}
                            >
                                ANALYTICS
                            </button>
                        </div>

                        <VoiceInput
                            module="tasks"
                            onCommand={handleVoiceCommand}
                            color="purple"
                            className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                        />

                        <button
                            onClick={() => {
                                setEditingTaskId(null);
                                setNewTask({
                                    title: '',
                                    priority: 'medium',
                                    startTime: '09:00',
                                    endTime: '10:00',
                                    date: selectedDate,
                                    category: focusedTask ? focusedTask.category : 'Asosiy',
                                    subtasks: [],
                                    resources: [],
                                    parentId: focusedTask ? focusedTask.id : undefined,
                                    parentTitle: focusedTask ? focusedTask.title : undefined
                                } as any);
                                setIsModalOpen(true);
                            }}
                            className="px-6 py-3 rounded-xl bg-aura-purple hover:bg-aura-purple/80 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-aura-purple/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>+</span> {focusedTask ? "qo'shimcha vazifa" : t.tasks.newTask}
                        </button>
                    </div>
                </div>

                {isArchived && (
                    <ReadOnlyBanner
                        title={t.tasks.readOnly || "Archive Mode"}
                        description={t.tasks.readOnlyDesc || "Historical tasks are read-only."}
                    />
                )}

                {/* AI Suggestion Block */}
                {viewMode === 'dashboard' && !focusedTask && (
                    <>
                        {aiLoading ? (
                            <div className="mb-12 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 animate-pulse flex items-center justify-between gap-6">
                                <div className="flex items-center gap-8 w-full">
                                    <div className="w-20 h-20 rounded-3xl bg-white/10"></div>
                                    <div className="space-y-3 flex-1">
                                        <div className="w-32 h-4 bg-white/10 rounded-full"></div>
                                        <div className="w-full h-4 bg-white/10 rounded-full"></div>
                                        <div className="w-2/3 h-4 bg-white/10 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ) : aiInsight ? (
                            <div className="mb-12 p-8 rounded-[2.5rem] bg-gradient-to-r from-aura-purple/20 via-black to-aura-cyan/10 border border-aura-purple/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-aura-purple/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-aura-purple/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-aura-purple/20 transition-all duration-700"></div>
                                <div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
                                    <div className="w-20 h-20 rounded-3xl bg-aura-purple/20 flex items-center justify-center text-5xl shake-animation border border-aura-purple/30 shadow-inner flex-shrink-0">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 rounded-full bg-aura-purple text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                                {t.tasks.aiSuggestion.title}
                                            </span>
                                            <span className="text-gray-500 text-xs font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white mb-2 max-w-2xl leading-relaxed">
                                            {aiInsight.suggestion || t.tasks.aiSuggestion.suggestion}
                                        </h3>
                                        <p className="text-gray-400 text-sm italic opacity-80">{t.tasks.actions.focus}: &quot;{aiInsight.title || t.tasks.aiSuggestion.title}&quot;</p>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <button
                                        onClick={handleAddAISuggestion}
                                        className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2 group/btn"
                                    >
                                        <span className="text-aura-purple group-hover/btn:rotate-12 transition-transform">✨</span>
                                        {t.tasks.aiSuggestion.add}
                                        <span className="text-[10px] opacity-50 ml-1 block text-center">+</span>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}

                {viewMode === 'dashboard' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* OVERDUE COLUMN */}
                        <div
                            className="space-y-6"
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                                const prevDay = new Date(selectedDate);
                                prevDay.setDate(prevDay.getDate() - 1);
                                handleDrop(e, prevDay.toISOString().split('T')[0]);
                            }}
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-aura-red shadow-[0_0_10px_rgba(255,50,50,0.5)]"></div>
                                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{t.tasks.sections.overdue}</h2>
                                </div>
                                <span className="bg-aura-red/10 text-aura-red px-2 py-0.5 rounded text-[10px] font-bold">
                                    {getDisplayTasks('overdue').length}
                                </span>
                            </div>
                            <div className={`space-y-4 min-h-[200px] p-4 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 ${dragedTaskId ? 'bg-aura-red/5 border-aura-red/30 scale-[1.02] shadow-[0_0_50px_rgba(255,50,50,0.1)]' : 'border-white/5'}`}>
                                {(() => {
                                    const tasks = getDisplayTasks('overdue');
                                    const active = tasks.filter(t => t.status !== 'done');
                                    const done = tasks.filter(t => t.status === 'done');

                                    return (
                                        <>
                                            {active.map((task: Task) => (
                                                <div key={task.id} className="animate-fade-in-up">
                                                    <TaskCard task={task} />
                                                </div>
                                            ))}

                                            {done.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-4 py-2 opacity-50">
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Bajarilgan</span>
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                    </div>
                                                    {done.map((task: Task) => (
                                                        <div key={task.id} className="animate-fade-in-up opacity-60 hover:opacity-100 transition-opacity">
                                                            <TaskCard task={task} />
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                {getDisplayTasks('overdue').length === 0 && (
                                    <PremiumEmptyState
                                        title={t.tasks.sections.overdue}
                                        description={t.tasks.allClear || "Ajoyib! Qarz vazifalar yo'q."}
                                        icon="✅"
                                        className="py-10"
                                    />
                                )}
                            </div>
                        </div>

                        {/* TODAY COLUMN (Drop Zone) */}
                        <div
                            className="space-y-6"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, selectedDate)}
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-aura-cyan shadow-[0_0_15px_rgba(0,240,255,0.6)] animate-pulse"></div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{t.tasks.sections.today}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-aura-cyan/10 text-aura-cyan px-2.5 py-1 rounded-lg text-[10px] font-black border border-aura-cyan/20">
                                        {selectedDate}
                                    </span>
                                    <span className="bg-white/5 text-white px-2.5 py-1 rounded-lg text-[10px] font-black border border-white/10">
                                        {getDisplayTasks('today').length}
                                    </span>
                                </div>
                            </div>
                            <div className={`space-y-4 min-h-[400px] p-4 rounded-[2.5rem] transition-all duration-500 border-2 border-dashed ${dragedTaskId ? 'bg-aura-cyan/5 border-aura-cyan/30 scale-[1.02] shadow-[0_0_50px_rgba(0,240,255,0.1)]' : 'border-white/5'}`}>
                                {(() => {
                                    const tasks = getDisplayTasks('today');
                                    const active = tasks.filter(t => t.status !== 'done');
                                    const done = tasks.filter(t => t.status === 'done');

                                    return (
                                        <>
                                            {active.map((task: Task) => (
                                                <div key={task.id} className="animate-fade-in-up">
                                                    <TaskCard task={task} />
                                                </div>
                                            ))}

                                            {done.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-4 py-2 opacity-50">
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Bajarilgan</span>
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                    </div>
                                                    {done.map((task: Task) => (
                                                        <div key={task.id} className="animate-fade-in-up opacity-60 hover:opacity-100 transition-opacity">
                                                            <TaskCard task={task} />
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                {getDisplayTasks('today').length === 0 && (
                                    <PremiumEmptyState
                                        title={t.tasks.sections.today}
                                        description={t.tasks.allClear || "Bugun hamma narsa silliq!"}
                                        icon="🚀"
                                        action={{
                                            label: t.tasks.newTask || "Yangi vazifa",
                                            onClick: () => setIsModalOpen(true)
                                        }}
                                        className="py-12"
                                    />
                                )}
                            </div>
                        </div>

                        {/* FUTURE COLUMN (Drop Zone) */}
                        <div
                            className="space-y-6"
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                                const nextDay = new Date(selectedDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                handleDrop(e, nextDay.toISOString().split('T')[0]);
                            }}
                        >
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-aura-purple shadow-[0_0_15px_rgba(157,78,221,0.6)]"></div>
                                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{t.tasks.sections.future}</h2>
                                </div>
                                <span className="bg-aura-purple/10 text-aura-purple px-2.5 py-1 rounded-lg text-[10px] font-black border border-aura-purple/20">
                                    {getDisplayTasks('future').length}
                                </span>
                            </div>
                            <div className={`space-y-4 min-h-[200px] p-4 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 ${dragedTaskId ? 'bg-aura-purple/5 border-aura-purple/30 scale-[1.02] shadow-[0_0_50px_rgba(157,78,221,0.1)]' : 'border-white/5'}`}>
                                {(() => {
                                    const tasks = getDisplayTasks('future');
                                    const active = tasks.filter(t => t.status !== 'done');
                                    const done = tasks.filter(t => t.status === 'done');

                                    return (
                                        <>
                                            {active.map((task: Task) => (
                                                <div key={task.id} className="animate-fade-in-up">
                                                    <TaskCard task={task} />
                                                </div>
                                            ))}

                                            {done.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-4 py-2 opacity-50">
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Bajarilgan</span>
                                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                                    </div>
                                                    {done.map((task: Task) => (
                                                        <div key={task.id} className="animate-fade-in-up opacity-60 hover:opacity-100 transition-opacity">
                                                            <TaskCard task={task} />
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                {getDisplayTasks('future').length === 0 && (
                                    <PremiumEmptyState
                                        title={t.tasks.sections.future}
                                        description={t.tasks.allClear || "Kelajak rejalari hali bo'sh."}
                                        icon="📅"
                                        className="py-10"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in px-2">
                        {/* STATS CALCULATION FIXED */}
                        {(() => {
                            // Use explicit root tasks to match visual cards
                            const aTasks = [...todayTasks, ...overdueTasks, ...futureTasks];
                            // Deduplicate
                            const uniqueTasks = Array.from(new Map(aTasks.map(t => [t.id, t])).values());

                            // Count ROOT tasks only (matching dashboard cards)
                            const aTotal = uniqueTasks.length;
                            const aDone = uniqueTasks.filter(t => t.status === 'done').length;
                            const aPending = aTotal - aDone;
                            // Override Overdue to match root overdue
                            const aOverdue = uniqueTasks.filter(t => t.status !== 'done' && t.date && t.date < selectedDate).length;

                            // Subtask stats for efficiency (optional, but keep pulse logic if needed)
                            // For Pulse, we might still want deep stats, but for "Jami Vazifalar" card, use root.
                            const deepStats = getDeepSubtaskStats(uniqueTasks);
                            const aEfficiency = deepStats.total > 0 ? Math.round((deepStats.done / deepStats.total) * 100) : 0;

                            const todayStr = getLocalTodayStr();
                            const aToday = Math.max(0, aTasks.filter(t => t.date === todayStr).length);
                            const aFuture = Math.max(0, aTasks.filter(t => t.date && t.date > todayStr).length);

                            return (
                                <>
                                    {/* TOP STATS CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl group hover:border-white/10 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Jami Vazifalar</h3>
                                            <div className="text-4xl font-display font-black text-white group-hover:text-aura-cyan transition-colors">
                                                {aTotal}
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl border-aura-green/20 group hover:border-aura-green/40 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-green mb-2">Tugallangan</h3>
                                            <div className="text-4xl font-display font-black text-aura-green">
                                                {aDone}
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl border-aura-cyan/20 group hover:border-aura-cyan/40 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-cyan mb-2">Salmoqli (Todo)</h3>
                                            <div className="text-4xl font-display font-black text-aura-cyan">
                                                {aPending}
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl border-aura-red/20 group hover:border-aura-red/40 transition-all">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-aura-red mb-2">Muddati O'tgan</h3>
                                            <div className="text-4xl font-display font-black text-aura-red">
                                                {aOverdue}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 px-2">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Bugungi:</span>
                                            <span className="text-xs font-black text-white">{aToday}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Kelajak:</span>
                                            <span className="text-xs font-black text-white">{aFuture}</span>
                                        </div>
                                    </div>

                                    {/* AI Intelligent Planner (Relocated to top for better space management) */}
                                    <AiInsightSection
                                        onAnalyze={fetchAiInsight}
                                        isLoading={aiLoading}
                                        insight={aiInsight}
                                        title="AI Planner & Analysis"
                                        description="Sizning rejangiz va unumdorligingizni tahlil qilish hamda aqlli tavsiyalar olish uchun tugmani bosing."
                                        buttonText={aiInsight ? "Regenerate" : "Generate Plan"}
                                        color="cyan"
                                    >
                                        <button
                                            onClick={handleAddAISuggestion}
                                            disabled={isAddingSuggestion || suggestionAdded}
                                            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${suggestionAdded ? 'bg-aura-green text-black shadow-aura-green/20 scale-105' : 'bg-aura-cyan text-black hover:bg-white hover:scale-105 active:scale-95 shadow-aura-cyan/20'}`}
                                        >
                                            {isAddingSuggestion ? (
                                                <><span>⏳</span> Saqlanmoqda...</>
                                            ) : suggestionAdded ? (
                                                <><span>✅</span> Reja Qo'shildi!</>
                                            ) : (
                                                <><span>+</span> {t.tasks?.aiSuggestion?.add || "Rejani Qo'shish"}</>
                                            )}
                                        </button>
                                    </AiInsightSection>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* ROW 1: Productivity Pulse (8) & Priority Mix (4) */}
                                        <div className="lg:col-span-8">
                                            {/* Productivity Score & Daily Trend */}
                                            <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group h-full">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-aura-cyan/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                                                    <div className="space-y-2">
                                                        <h2 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-aura-cyan animate-pulse"></span>
                                                            Productivity Pulse
                                                        </h2>
                                                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Performance metrics for your current focus</p>
                                                    </div>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-6xl font-display font-black text-white leading-none">{aEfficiency}</span>
                                                        <span className="text-xl font-black text-aura-cyan mb-1.5">%</span>
                                                    </div>
                                                </div>

                                                {/* HEATMAP / HOURLY ACTIVITY */}
                                                <div className="mt-12 space-y-6">
                                                    <div className="flex justify-between items-end">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Heatmap</h3>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-gray-500">
                                                                <span>Kam</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-sm bg-white/5"></div>
                                                                    <div className="w-2 h-2 rounded-sm bg-aura-purple/20"></div>
                                                                    <div className="w-2 h-2 rounded-sm bg-aura-purple/50"></div>
                                                                    <div className="w-2 h-2 rounded-sm bg-aura-purple"></div>
                                                                </div>
                                                                <span>Ko'p</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-12 md:grid-cols-24 gap-1.5 h-16">
                                                        {(() => {
                                                            const aTasksSub = getAllRelatedTasks(true);
                                                            return Array.from({ length: 24 }).map((_, hour) => {
                                                                const tasksInHour = aTasksSub.filter(t => {
                                                                    const startHour = parseInt(t.startTime?.split(':')[0] || '-1');
                                                                    return startHour === hour;
                                                                }).length;

                                                                let intensityClass = "bg-white/5";
                                                                if (tasksInHour > 0) intensityClass = "bg-aura-purple/20";
                                                                if (tasksInHour > 1) intensityClass = "bg-aura-purple/40 shadow-[0_0_10px_rgba(157,78,221,0.2)]";
                                                                if (tasksInHour > 2) intensityClass = "bg-aura-purple/70 shadow-[0_0_15px_rgba(157,78,221,0.3)]";
                                                                if (tasksInHour >= 4) intensityClass = "bg-aura-purple shadow-[0_0_20px_rgba(157,78,221,0.5)]";

                                                                return (
                                                                    <div key={hour} className="group/hour relative h-full">
                                                                        <div className={`w-full h-full rounded-[0.5rem] transition-all duration-500 cursor-help ${intensityClass} hover:scale-110 hover:z-20`}></div>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-[9px] font-black rounded-lg opacity-0 group-hover/hour:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-30">
                                                                            {hour}:00 — {tasksInHour} vazifa
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">
                                                        <span>00:00</span>
                                                        <span>06:00</span>
                                                        <span>12:00</span>
                                                        <span>18:00</span>
                                                        <span>23:00</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-4">
                                            {/* Priority Distribution */}
                                            <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl h-full flex flex-col justify-center">
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">Priority Mix</h3>
                                                <div className="space-y-6">
                                                    {(() => {
                                                        const priorities = [
                                                            { label: 'High', key: 'high', color: 'bg-aura-red', text: 'text-aura-red' },
                                                            { label: 'Medium', key: 'medium', color: 'bg-aura-gold', text: 'text-aura-gold' },
                                                            { label: 'Low', key: 'low', color: 'bg-aura-cyan', text: 'text-aura-cyan' }
                                                        ];

                                                        return priorities.map(p => {
                                                            const count = aTasks.filter(t => t.priority === p.key).length;
                                                            const percent = aTotal > 0 ? Math.round((count / aTotal) * 100) : 0;

                                                            return (
                                                                <div key={p.key} className="flex items-center gap-4 group">
                                                                    <div className={`w-12 text-[10px] font-black uppercase tracking-widest ${p.text}`}>{p.label}</div>
                                                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                                        <div
                                                                            className={`h-full ${p.color} rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] w-[var(--width)]`}
                                                                            style={{ '--width': `${percent}%` } as React.CSSProperties}
                                                                        ></div>
                                                                    </div>
                                                                    <div className="text-[10px] font-mono font-bold text-gray-500 w-8">{count}</div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ROW 2: Top Categories (4), Momentum (4), AI Guard (4) */}
                                        <div className="lg:col-span-4">
                                            <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl h-full">
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                                    <span className="text-aura-cyan">📂</span> Top Categories
                                                </h3>
                                                <div className="space-y-5">
                                                    {(() => {
                                                        const cats = Array.from(new Set(aTasks.map(t => t.category || focusedTask?.category || 'Boshqa'))).slice(0, 4);
                                                        if (cats.length === 0 && focusedTask) cats.push(focusedTask.category || 'Boshqa');

                                                        return cats.map(cat => {
                                                            const catTasks = aTasks.filter(t => (t.category || focusedTask?.category || 'Boshqa') === cat);
                                                            const catStats = getDeepSubtaskStats(catTasks);
                                                            const catPercent = catStats.total > 0 ? Math.round((catStats.done / catStats.total) * 100) : 0;

                                                            return (
                                                                <div key={cat} className="space-y-2 group/cat">
                                                                    <div className="flex justify-between items-end">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover/cat:text-white transition-colors">{cat}</span>
                                                                        <span className="text-[10px] font-black text-aura-cyan">{catPercent}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                        <div
                                                                            className="h-full bg-aura-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-1000 w-[var(--width)]"
                                                                            style={{ '--width': `${catPercent}%` } as React.CSSProperties}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                    {aTasks.length === 0 && (
                                                        <div className="py-10 text-center text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic">No data available</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-4">
                                            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-aura-gold/10 to-transparent border border-white/5 backdrop-blur-3xl relative overflow-hidden h-full">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-aura-gold/5 rounded-full blur-[80px]"></div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                                    <span className="text-aura-gold">⚡</span> Momentum
                                                </h3>
                                                <div className="flex flex-col items-center justify-center py-4 space-y-4 relative z-10">
                                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                                            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * aEfficiency) / 100} className="text-aura-gold transition-all duration-1000" />
                                                        </svg>
                                                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-display font-black text-white">{aEfficiency}%</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bajarilgan</p>
                                                        <p className="text-xs font-black text-white mt-1">{aDone} / {aTotal} vazifa</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-4">
                                            {/* Intelligent Guard (AI Insights) */}
                                            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-aura-purple/20 via-black/40 to-transparent border border-aura-purple/30 backdrop-blur-3xl relative overflow-hidden group h-full">
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-aura-purple/20 rounded-full blur-[50px] group-hover:bg-aura-purple/30 transition-all duration-700"></div>

                                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                                    <div className="w-10 h-10 rounded-2xl bg-aura-purple/20 flex items-center justify-center text-xl border border-aura-purple/30">💡</div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">AI Guard</h3>
                                                </div>

                                                <div className="space-y-4 relative z-10">
                                                    {(() => {
                                                        const aOverdueList = aTasks.filter(t => t.status !== 'done' && t.date && t.date < selectedDate);
                                                        const aDoneList = aTasks.filter(t => t.status === 'done');
                                                        const progress = aTotal > 0 ? (aDoneList.length / aTotal) : 0;

                                                        return (
                                                            <>
                                                                {aOverdueList.length > 0 ? (
                                                                    <div className="p-4 rounded-2xl bg-aura-red/5 border border-aura-red/20 space-y-3">
                                                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                                                            <span className="text-aura-red font-black">DIQQAT:</span> {aOverdueList.length} ta vazifa kechikmoqda.
                                                                        </p>
                                                                        <button
                                                                            onClick={async () => {
                                                                                const tomorrow = new Date();
                                                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                                                const tStr = tomorrow.toISOString().split('T')[0];
                                                                                for (const t of aOverdueList) await moveTask(user!.uid, t.id, tStr);
                                                                                loadTasks();
                                                                            }}
                                                                            className="w-full py-2.5 bg-aura-red text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-aura-red/20"
                                                                        >
                                                                            Move to Tomorrow
                                                                        </button>
                                                                    </div>
                                                                ) : progress > 0.8 ? (
                                                                    <div className="p-4 rounded-2xl bg-aura-green/5 border border-aura-green/20">
                                                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                                                            <span className="text-aura-green font-black">AJOYIB:</span> Siz deyarli maqsadingizga etdingiz!
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                                                            Hozircha ishlaringiz reja bo&apos;yicha ketmoqda.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingTaskId ? "Vazifani tahrirlash" : (('parentId' in newTask) ? "Qo&apos;shimcha vazifa qo&apos;shish" : t.tasks.newTask)}
            >
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">{t.tasks.taskName}</label>
                        <input
                            type="text"
                            placeholder="Masalan: Fizika kitobini o'qish"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none transition-all placeholder:text-gray-700"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">Batafsil ma&apos;lumot</label>
                        <textarea
                            placeholder="Vazifa haqida qo&apos;shimcha..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none h-24 resize-none transition-all placeholder:text-gray-700"
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setNewTask({ ...newTask, priority: p })}
                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTask.priority === p ? getPriorityColor(p) + ' shadow-lg scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {t.tasks[p] || p}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">Sana (Date)</label>
                            <input
                                aria-label="Task Date"
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none [color-scheme:dark]"
                                value={newTask.date}
                                onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">Kategoriya</label>
                            <select
                                aria-label="Task Category"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none appearance-none cursor-pointer [color-scheme:dark]"
                                value={newTask.category}
                                onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                            >
                                <option value="Asosiy" className="bg-[#1a1a1a] text-white py-2">Asosiy</option>
                                <option value="Ish" className="bg-[#1a1a1a] text-white py-2">Ish</option>
                                <option value="O'qish" className="bg-[#1a1a1a] text-white py-2">O&apos;qish</option>
                                <option value="Shaxsiy" className="bg-[#1a1a1a] text-white py-2">Shaxsiy</option>
                                <option value="Sog'liq" className="bg-[#1a1a1a] text-white py-2">Sog&apos;liq</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">{t.tasks.startTime}</label>
                            <input
                                aria-label={t.tasks.startTime}
                                type="time"
                                value={newTask.startTime}
                                onChange={e => setNewTask({ ...newTask, startTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black ml-1">{t.tasks.endTime}</label>
                            <input
                                aria-label={t.tasks.endTime}
                                type="time"
                                value={newTask.endTime}
                                onChange={e => setNewTask({ ...newTask, endTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-aura-cyan focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveTask}
                        className="w-full py-5 bg-aura-cyan text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all mt-8 active:scale-[0.98] shadow-2xl"
                    >
                        {editingTaskId ? "O'zgarishlarni Saqlash" : "Vazifani Yaratish"}
                    </button>
                </div>
            </Modal>



            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />

            <Modal
                isOpen={moveTaskData?.isOpen || false}
                onClose={() => setMoveTaskData(null)}
                title=""
                className="max-w-md"
            >
                <div className="text-center space-y-6 pt-4 pb-2">
                    <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl bg-aura-cyan/20 border border-aura-cyan/30 text-aura-cyan shadow-inner">
                        🚚
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-black text-white tracking-tight mb-2">
                            Vazifani ko&apos;chirish
                        </h3>
                        <p className="text-gray-400 text-sm">Vazifa uchun yangi vaqtni tanlang:</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 px-2">
                        {[
                            { label: 'Bugunga o\'tkazish', icon: '☀️', date: getLocalTodayStr(), color: 'bg-aura-cyan text-black' },
                            { label: 'Ertaga o\'tkazish', icon: '🚀', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], color: 'bg-white/10 text-white' },
                            { label: 'Keyingi haftaga', icon: '📅', date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], color: 'bg-white/5 text-gray-400' },
                            { label: 'Taqvimdan tanlash', icon: '🗓️', date: 'custom', color: 'bg-white/5 text-gray-400 border-dashed border-white/10' }
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => {
                                    if (opt.date === 'custom') {
                                        setMoveTaskData(null);
                                        setIsCalendarOpen(true);
                                    } else if (moveTaskData) {
                                        handleMoveToDate(moveTaskData.taskId, opt.date);
                                        setMoveTaskData(null);
                                    }
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent ${opt.color}`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-xl">{opt.icon}</span>
                                    {opt.label}
                                </span>
                                <span className="text-xs opacity-50">{opt.date !== 'custom' ? opt.date : ''}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Arxiv" >
                <div className="p-8 text-center text-gray-500 uppercase tracking-widest text-[10px] font-black opacity-30">Arxiv bo&apos;sh</div>
            </HistoryModal>
        </>
    )
}
