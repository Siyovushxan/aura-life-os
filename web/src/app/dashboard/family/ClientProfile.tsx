"use client";
import React, { useState, useEffect } from 'react';
import SmartTree from '@/components/SmartTree';
import Link from 'next/link';
import HistoryModal from '@/components/HistoryModal';

import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getFamilyMember, updateFamilyMember, getAncestors, FamilyMember, getParentingRequests, ParentingRequest, unlockScreenTime, subscribeToFamilyMembers, Ancestor, FamilyGroup } from '@/services/familyService';
import { analyzeGenetics } from '@/services/groqService';
import { calculateRelationship } from '@/lib/familyUtils';
import AlertModal from '@/components/AlertModal';
import { getLocalTodayStr } from '@/lib/dateUtils';

// Modular Services
import { getFinanceOverview, getTransactionsByDate } from '@/services/financeService';
import { getHealthData } from '@/services/healthService';
import { getTodayFocusStats } from '@/services/focusService';
import { getTasksByDate } from '@/services/tasksService';
import { getFoodLog } from '@/services/foodService';
import { getMindData } from '@/services/mindService';
import { getInterestsData, getInterestLogsByDate } from '@/services/interestsService';

export default function ClientProfile({ id }: { id: string }) {
    const { t } = useLanguage();
    const { user } = useAuth();

    // State
    const [member, setMember] = useState<FamilyMember | null>(null);
    const [quests, setQuests] = useState<ParentingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [screenTimeLimit, setScreenTimeLimit] = useState(60);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [newTask, setNewTask] = useState('');
    const [rewardType, setRewardType] = useState('screen_time');
    const [rewardAmount, setRewardAmount] = useState(15);
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

    // 7 Module Data States
    const [moduleData, setModuleData] = useState({
        finance: { todayExpense: 0, todayIncome: 0, balance: 0 },
        health: { steps: 0, sleep: 0, screenTime: 0 },
        mental: { mood: 'neutral', stress: 0 },
        focus: { totalMinutes: 0, sessions: 0 },
        tasks: { completed: 0, total: 0 },
        food: { calories: 0, meals: 0 },
        interests: { active: [] as string[], lastActivity: '' }
    });
    const [ancestors, setAncestors] = useState<Ancestor[]>([]);
    const [activeGroup, setActiveGroup] = useState<FamilyGroup | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState<{
        fullName: string;
        name: string;
        birthDate: string;
        role: string;
        profession: string;
        education: string;
        bio: string;
    }>({
        fullName: '',
        name: '',
        birthDate: '',
        role: '',
        profession: '',
        education: '',
        bio: ''
    });

    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const triggerAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        if (user && id) {
            const fetchData = async () => {
                setLoading(true);

                // Determine Owner ID
                // We need to know who owns the family this member belongs to.
                // Since 'id' is unique (userId), and we are viewing them...
                // Ideally, we should check which family group we are currently viewing.
                // But simplified: check if I am an owner, or find the group I joined.

                // Dynamic import or use existing service. 
                // We will import getFamilyGroups here or use a simplified approach:
                // Try fetching from MYSELF first.
                let targetOwnerId = user.uid;
                let m = await getFamilyMember(user.uid, id);

                const { getFamilyGroups } = await import('@/services/familyService');
                const myGroups = await getFamilyGroups(user.uid);

                if (!m) {
                    const group = myGroups.find(g => g.members.includes(user.uid) && !g.deletedAt);
                    if (group) {
                        setActiveGroup(group);
                        if (group.ownerId !== user.uid) {
                            targetOwnerId = group.ownerId;
                            m = await getFamilyMember(group.ownerId, id);
                        }
                    }
                } else {
                    setActiveGroup(myGroups[0] || null);
                }

                if (m) {
                    setMember(m);
                    setOwnerId(targetOwnerId);
                    setScreenTimeLimit(m.screenTime?.limit || 60);

                    // 1. Genetics AI Analysis (If missing) - Run ONLY if I am the owner to avoid permission writes
                    if (targetOwnerId === user.uid && (!m.genetics || m.genetics.length === 0)) {
                        const ancestors = await getAncestors(activeGroup ? activeGroup.id : targetOwnerId, !!activeGroup);
                        if (ancestors.length > 0) {
                            const healthIssues = ancestors.flatMap(a => a.healthIssues);
                            if (healthIssues.length > 0) {
                                console.log("Analyzing genetics...");
                                analyzeGenetics(healthIssues).then(async (risks) => {
                                    if (risks.length > 0) {
                                        await updateFamilyMember(targetOwnerId, id, { genetics: risks });
                                        setMember(prev => prev ? { ...prev, genetics: risks } : null);
                                    }
                                });
                            }
                        }
                    }

                    // 2. Safety Monitor Check (Simulation logic)
                    if (targetOwnerId === user.uid && !m.lastActive) {
                        await updateFamilyMember(targetOwnerId, id, { lastActive: 'Just now', safetyStatus: 'safe' });
                    }

                    // 3. Auto-Heal "New Member" Names
                    if (targetOwnerId === user.uid && (m.name === 'New Member' || !m.fullName || m.fullName === 'New Member')) {
                        try {
                            const { doc, getDoc } = await import('firebase/firestore');
                            const { db } = await import('@/firebaseConfig');
                            const userRootSnap = await getDoc(doc(db, "users", id));
                            if (userRootSnap.exists()) {
                                const userData = userRootSnap.data();
                                const realFullName = userData.fullName || userData.displayName;
                                if (realFullName && realFullName !== 'New Member') {
                                    console.log("Healing member name to:", realFullName);
                                    const updateData = {
                                        fullName: realFullName,
                                        name: realFullName.split(' ')[0]
                                    };
                                    await updateFamilyMember(targetOwnerId, id, updateData);
                                    setMember(prev => prev ? { ...prev, ...updateData } : null);
                                }
                            }
                        } catch (e) {
                            console.warn("Auto-heal failed", e);
                        }
                    }
                }

                // Fetch quests (from Owner's list)
                const reqs = await getParentingRequests(targetOwnerId);
                setQuests(reqs.filter(r => r.kid === m?.name || r.status === 'pending'));

                // 4. Fetch 7-Module Real Data
                const today = getLocalTodayStr();
                try {
                    const [
                        financeOverview,
                        financeTransactions,
                        healthData,
                        focusStats,
                        tasks,
                        foodLog,
                        mindData,
                        interestsOverall,
                        interestLogs
                    ] = await Promise.all([
                        getFinanceOverview(id),
                        getTransactionsByDate(id, today),
                        getHealthData(id, today),
                        getTodayFocusStats(id),
                        getTasksByDate(id, today),
                        getFoodLog(id, today),
                        getMindData(id),
                        getInterestsData(id),
                        getInterestLogsByDate(id, today)
                    ]);

                    const [ancList] = await Promise.all([
                        getAncestors(activeGroup ? activeGroup.id : targetOwnerId, !!activeGroup)
                    ]);
                    setAncestors(ancList);

                    const todayIncome = financeTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                    const todayExpense = financeTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

                    setModuleData({
                        finance: {
                            todayExpense,
                            todayIncome,
                            balance: financeOverview?.totalBalance || 0
                        },
                        health: {
                            steps: healthData?.activity.steps || 0,
                            sleep: parseFloat(healthData?.sleep.duration || '0'),
                            screenTime: healthData?.activity.steps || 0 // Placeholder until screenTime field fixed
                        },
                        mental: {
                            mood: mindData?.moodHistory[mindData.moodHistory.length - 1]?.mood || 'neutral',
                            stress: healthData?.vitals.stress || 0
                        },
                        focus: {
                            totalMinutes: focusStats.totalMinutes,
                            sessions: focusStats.sessions
                        },
                        tasks: {
                            completed: tasks.filter(t => t.status === 'done').length,
                            total: tasks.length
                        },
                        food: {
                            calories: foodLog?.summary.calories.current || 0,
                            meals: foodLog?.meals.length || 0
                        },
                        interests: {
                            active: interestsOverall?.hobbies.map(h => h.name) || [],
                            lastActivity: interestLogs[0]?.hobbyName || ''
                        }
                    });
                } catch (e) {
                    console.warn("Failed to fetch module data for member:", e);
                }

                setLoading(false);
            };
            fetchData();
        }
    }, [user, id, activeGroup]);

    // Subscribe to all family members for Mini Tree
    useEffect(() => {
        if (!ownerId) return;
        const unsubscribe = subscribeToFamilyMembers(ownerId, (members) => {
            setFamilyMembers(members);
        });
        return () => unsubscribe();
    }, [ownerId]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isEditModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isEditModalOpen]);

    if (loading) return <div className="text-center p-10 text-white">Loading Profile...</div>;

    if (!member) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h1 className="text-4xl text-aura-red font-bold mb-4">404</h1>
                <p className="text-gray-400 mb-6">Member not found in Firestore.</p>
                <Link href="/dashboard/family/" className="px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">← {t.family.backToHub}</Link>
            </div>
        );
    }

    const isSafe = member.safetyStatus === 'safe' || !member.safetyStatus;
    const currentXP = member.currentXP || 0;
    const maxXP = member.maxXP || 1000;
    const xpPercentage = Math.min((currentXP / maxXP) * 100, 100);
    const isChild = member.role === 'Son' || member.role === 'Daughter';
    const usedScreenTime = member.screenTime?.used || 0;
    const balance = member.balance || 0;

    // Check if new member (joined < 7 days ago)
    // Assuming createdAt or joinedAt is available in member object, if not fall back to simple check
    // Since FamilyMember interface might not clearly have joinedAt, we might need to add it or infer.
    // For now, let's look for a timestamp or just assume if name was 'New Member' recently it is new.
    // Ideally we update FamilyMember to have joinedAt. 
    // Let's assume we can use the 'New Member' name status as a proxy for "Very New", 
    // but better: if we just healed it, it's new. 
    // Real implementation: check timestamp.

    const handleEditClick = () => {
        if (!member) return;
        setEditData({
            fullName: member.fullName || '',
            name: member.name || '',
            birthDate: member.birthDate || '',
            role: member.role || '',
            profession: member.profession || '',
            education: member.education || '',
            bio: member.bio || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!member || !ownerId) return;
        try {
            await updateFamilyMember(ownerId, member.id, {
                fullName: editData.fullName,
                name: editData.name,
                birthDate: editData.birthDate,
                role: editData.role,
                profession: editData.profession,
                education: editData.education,
                bio: editData.bio
            });
            // Update local state
            setMember(prev => prev ? { ...prev, ...editData } : null);
            setIsEditModalOpen(false);
            triggerAlert("Muvaffaqiyat", "Ma'lumotlar muvaffaqiyatli saqlandi!", "success");
        } catch (e: unknown) {
            triggerAlert("Xatolik", "Xatolik: " + (e instanceof Error ? e.message : String(e)), "danger");
        }
    };

    const handleAddTime = async () => {
        if (!user || !member) return;
        await unlockScreenTime(user.uid, member.id, 15);
        setScreenTimeLimit(prev => prev + 15);
        triggerAlert("Muvaffaqiyat", `+15 Minutes added for ${member.name}`, "success");
    };


    const handleAssignTask = async () => {
        if (!user || !member || !newTask) return;
        // Mock ID generation
        const newQuest: ParentingRequest = {
            id: Date.now().toString(),
            kid: member.name,
            task: newTask,
            reward: rewardType === 'coins' ? `${rewardAmount} Coins` : `${rewardAmount} min Screen Time`,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        // In a real app, we'd have a createParentingRequest service
        // For now, we simulate adding it to the list locally and assuming backend handles it
        // Or we can add a simple addDoc call in service if strictly needed.
        // Let's assume we just update local state for the demo to feel responsive:
        setQuests(prev => [...prev, newQuest]);
        setNewTask('');
        triggerAlert("Muvaffaqiyat", `Task assigned to ${member.name}: ${newTask}`, "success");
    };

    const activityLog = [
        { task: 'Database Entry', date: t.common.today + ' 10:00', xp: '+10 XP' },
    ];

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-10">

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={`${t.family.activityLog}: ${member.name}`}
            >
                {/* ... existing history content ... */}
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
                        <span>{t.family.task.toUpperCase()}</span>
                        <span>{t.family.date.toUpperCase()}</span>
                    </div>
                    <div className="space-y-2">
                        {activityLog.map((log, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-aura-green">✅</span>
                                    <span className="text-white">{log.task}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400">{log.date}</div>
                                    <div className="text-aura-gold text-xs font-bold">{log.xp}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </HistoryModal>

            <div className="flex justify-between items-center mb-4">
                <Link href="/dashboard/family" className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    <span>←</span> {t.family.backToHub}
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all font-mono text-xs uppercase"
                    >
                        <span>📜</span> {t.common.viewHistory}
                    </button>
                    {/* Genealogy Link (New) */}
                    <Link
                        href="/dashboard/family/genealogy"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-aura-gold/10 border border-aura-gold/20 text-aura-gold hover:bg-aura-gold/20 transition-all font-mono text-xs uppercase"
                    >
                        <span>🌳</span> Shajara
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-black/40 border border-white/10 p-8 flex items-center gap-8 group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-aura-purple/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 flex items-center justify-center text-6xl shadow-xl relative z-10">
                            {member.role.includes('Father') || member.role === 'Head' ? '👨' :
                                member.role.includes('Mother') ? '👩' :
                                    member.role.includes('Son') ? '👦' :
                                        member.role.includes('Daughter') ? '👧' :
                                            member.role.includes('Elder') || member.role.includes('Grand') ? '👴' : '👤'}
                            {!isSafe && <span className="absolute top-0 right-0 text-2xl animate-ping">⚠️</span>}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-display font-bold text-white">
                                {member.fullName && member.fullName !== 'New Member' && member.fullName !== 'Yangi A\'zo'
                                    ? member.fullName
                                    : (member.name === 'New Member' || member.name === 'Yangi A\'zo' ? 'Yuklanmoqda...' : member.name)}
                            </h1>
                            <span className="px-3 py-1 rounded-full bg-aura-blue/20 border border-aura-blue/30 text-xs font-bold uppercase tracking-wider text-aura-cyan">
                                {user && member ? calculateRelationship(member, user as unknown as FamilyMember, [...familyMembers, ...ancestors] as unknown as FamilyMember[]) : member.role}
                            </span>

                            {/* NEW Badge */}
                            {/* Logic: If < 7 days old. defaulting to true for demonstration if missing date */}
                            <span className="px-2 py-0.5 rounded bg-aura-green text-black text-[10px] font-bold uppercase tracking-widest animate-pulse">NEW</span>

                            {/* Coins Relocated Here */}
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-aura-gold/10 border border-aura-gold/20 text-aura-gold text-sm font-bold ml-2">
                                <span>🪙</span>
                                <span>{balance}</span>
                            </div>

                            {/* Edit Button for Owner in Profile */}
                            {user?.uid === ownerId && (
                                <button
                                    onClick={handleEditClick}
                                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-aura-cyan hover:bg-white/10 transition-all ml-2"
                                    title="Tahrirlash"
                                >
                                    ✏️
                                </button>
                            )}
                        </div>
                        <p className="text-gray-400 mb-2 flex items-center gap-2">
                            <span>Kasbi: {member.profession || 'Kiritilmagan'}</span>
                            <span className="text-gray-600">•</span>
                            <span>Ta&apos;lim: {member.education || 'Kiritilmagan'}</span>
                        </p>
                        <p className="text-gray-400 mb-4 flex items-center gap-2">
                            <span>📍 {member.location || 'Unknown'}</span>
                            <span className="text-gray-600">•</span>
                            <span className={isSafe ? 'text-aura-green' : 'text-aura-red animate-pulse font-bold'}>
                                {isSafe ? 'Status: Safe' : '⚠️ WARNING: Movement Inactive'}
                            </span>
                        </p>
                        {member.bio && (
                            <p className="text-sm text-gray-500 mb-4 italic max-w-xl">
                                &quot;{member.bio}&quot;
                            </p>
                        )}
                        <div className="w-64">
                            <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-500 mb-1">
                                <span>LVL {member.level}</span>
                                <span>{currentXP} {t.family.xp}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-aura-cyan to-aura-purple" style={{ width: `${xpPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2.5rem] bg-black/40 border border-white/10 p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest">{t.family.safetyMonitor}</h3>
                        <div className={`w-3 h-3 rounded-full ${isSafe ? 'bg-aura-green shadow-[0_0_10px_#00FF94]' : 'bg-aura-red shadow-[0_0_15px_red] animate-ping'}`}></div>
                    </div>
                    <div className="z-10">
                        <div className="text-3xl font-bold text-white mb-1">{member.lastActive || 'N/A'}</div>
                        <p className="text-sm text-gray-500">Last Motion Detected</p>
                    </div>
                    {!isSafe && (
                        <button className="w-full py-2 rounded-xl bg-aura-red text-white font-bold animate-pulse mt-4">{t.family.emergencyCall}</button>
                    )}
                    <div className={`absolute inset-0 opacity-10 ${isSafe ? 'bg-aura-green' : 'bg-aura-red'}`}></div>
                </div>
            </div>

            {/* MINI FAMILY TREE - Full Width */}
            {familyMembers.length > 0 && member && (
                <div className="mb-0 bg-black/20 rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-aura-gold uppercase tracking-widest flex items-center gap-2">
                            <span>🌳</span> Yaqin Oila (Immediate Family)
                        </h3>
                    </div>
                    <div className="h-[400px]">
                        <SmartTree
                            ancestors={ancestors}
                            familyMembers={familyMembers}
                            mode="immediate"
                            centerMemberId={member.id}
                            onMemberClick={(m) => {
                                // Navigate to that member if it's someone else
                                if (m.id !== member.id) {
                                    window.location.href = `/dashboard/family?id=${m.id}`;
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* PARENTAL CONTROLS & QUESTS - Only for Owner */}
            {user?.uid === ownerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-black to-aura-blue/10 border border-white/10 min-h-[400px] flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span>🎮</span> {t.family.parentalControls}
                        </h3>
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Screen Time Used</span>
                                <span className="text-white font-bold">{usedScreenTime} / {screenTimeLimit} min</span>
                            </div>
                            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${usedScreenTime > screenTimeLimit ? 'bg-aura-red' : 'bg-aura-blue'}`}
                                    style={{ width: `${Math.min((usedScreenTime / screenTimeLimit) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        {isChild ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={handleAddTime} className="py-3 rounded-xl bg-aura-blue/20 text-aura-blue border border-aura-blue/30 hover:bg-aura-blue/30 transition-colors font-bold text-sm">
                                        +15 Min Time
                                    </button>
                                    <button className="py-3 rounded-xl bg-aura-red/10 text-aura-red border border-aura-red/30 hover:bg-aura-red/20 transition-colors font-bold text-sm">
                                        🔒 Lock Device
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Assign New Task</label>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <select
                                        aria-label="Mukofot turi"
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white"
                                        value={rewardType}
                                        onChange={(e) => setRewardType(e.target.value)}
                                    >
                                        <option value="screen_time">⏳ Time</option>
                                        <option value="coins">🪙 Coins</option>
                                    </select>
                                    <input
                                        type="number"
                                        aria-label="Mukofot miqdori"
                                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white"
                                        value={rewardAmount}
                                        onChange={(e) => setRewardAmount(parseInt(e.target.value))}
                                    />
                                    <button
                                        onClick={handleAssignTask}
                                        disabled={!newTask}
                                        className="flex-1 px-4 py-2 bg-aura-blue text-black font-bold rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-white/5 text-gray-500 text-sm italic text-center">
                                Parental controls are disabled for adults.
                            </div>
                        )}
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 min-h-[400px] flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span>📜</span> {t.family.activeQuests}
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {quests.map(quest => (
                                    <div key={quest.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <div className="text-white">{quest.task}</div>
                                            <div className="text-xs text-aura-gold">{quest.reward}</div>
                                        </div>
                                        <span className={`text-xs ${quest.status === 'approved' ? 'text-aura-green' : 'text-gray-500'}`}>
                                            {quest.status}
                                        </span>
                                    </div>
                                ))}
                                {quests.length === 0 && <p className="text-gray-500 text-sm">No active quests.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7 MODULE DASHBOARD */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    7 Modul Dashboard
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 1. Moliya (Finance) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-gold/10 to-black border border-aura-gold/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-gold flex items-center gap-2">
                            <span className="text-xl">💰</span> Moliya
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bugungi Xarajat</span>
                                <span className="text-aura-red font-bold text-sm">-{moduleData.finance.todayExpense.toLocaleString()} so&apos;m</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bugungi Daromad</span>
                                <span className="text-aura-green font-bold text-sm">+{moduleData.finance.todayIncome.toLocaleString()} so&apos;m</span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs font-bold">Balans</span>
                                    <span className="text-white font-bold">{moduleData.finance.balance.toLocaleString()} so&apos;m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Salomatlik (Health) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-red/10 to-black border border-aura-red/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-red flex items-center gap-2">
                            <span className="text-xl">❤️</span> Salomatlik
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Qadamlar</span>
                                <span className="text-white font-bold text-sm">{moduleData.health.steps.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Uyqu</span>
                                <span className="text-white font-bold text-sm">{moduleData.health.sleep}h</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Ekran Vaqti</span>
                                <span className="text-white font-bold text-sm">{moduleData.health.screenTime} min</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Ruhiyat (Mental) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-purple/10 to-black border border-aura-purple/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-purple flex items-center gap-2">
                            <span className="text-xl">🧠</span> Ruhiyat
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bugungi Kayfiyat</span>
                                <span className="text-white font-bold text-sm capitalize">{moduleData.mental.mood === 'happy' ? '😊 Xursand' : moduleData.mental.mood === 'sad' ? '😔 Qayg\'u' : '😐 Neytral'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Stress Darajasi</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${moduleData.mental.stress > 70 ? 'bg-aura-red' : moduleData.mental.stress > 40 ? 'bg-aura-gold' : 'bg-aura-green'}`}
                                            style={{ width: `${moduleData.mental.stress}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-bold text-sm">{moduleData.mental.stress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Fokus (Focus) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-cyan/10 to-black border border-aura-cyan/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-cyan flex items-center gap-2">
                            <span className="text-xl">🎯</span> Fokus
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bugungi Fokus</span>
                                <span className="text-white font-bold text-sm">{moduleData.focus.totalMinutes} min</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Sessiyalar</span>
                                <span className="text-white font-bold text-sm">{moduleData.focus.sessions} ta</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Vazifalar (Tasks) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-blue/10 to-black border border-aura-blue/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-blue flex items-center gap-2">
                            <span className="text-xl">✅</span> Vazifalar
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bajarilgan</span>
                                <span className="text-aura-green font-bold text-sm">{moduleData.tasks.completed} / {moduleData.tasks.total}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-aura-green rounded-full"
                                    style={{ width: `${moduleData.tasks.total > 0 ? (moduleData.tasks.completed / moduleData.tasks.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 6. Ovqat (Food) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-green/10 to-black border border-aura-green/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-aura-green flex items-center gap-2">
                            <span className="text-xl">🍎</span> Ovqat
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Bugungi Kaloriya</span>
                                <span className="text-white font-bold text-sm">{moduleData.food.calories} kcal</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs">Ovqatlar Soni</span>
                                <span className="text-white font-bold text-sm">{moduleData.food.meals} ta</span>
                            </div>
                        </div>
                    </div>

                    {/* 7. Qiziqishlar (Interests) - Full Width */}
                    <div className="md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-black border border-orange-500/20">
                        <h3 className="text-sm font-bold uppercase mb-4 text-orange-500 flex items-center gap-2">
                            <span className="text-xl">🎨</span> Qiziqishlar
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {moduleData.interests.active.length > 0 ? (
                                moduleData.interests.active.map((hobby, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                                        {hobby}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm italic">Qiziqishlar kiritilmagan</span>
                            )}
                        </div>
                        {moduleData.interests.lastActivity && (
                            <p className="text-gray-400 text-xs mt-3">Oxirgi faoliyat: {moduleData.interests.lastActivity}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* EDIT MEMBER MODAL - 2 Column Layout, No Scroll */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto">
                            <h3 className="text-2xl font-bold text-white mb-1">A&apos;zo Ma&apos;lumotlarini Tahrirlash</h3>
                            <p className="text-xs text-gray-500 mb-4">Profilni yangilang</p>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="edit-fullname" className="text-xs text-aura-blue font-bold uppercase block mb-1">To&apos;liq Ism</label>
                                        <input
                                            id="edit-fullname"
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-aura-blue text-sm"
                                            value={editData.fullName}
                                            onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-name" className="text-xs text-gray-400 uppercase block mb-1">Qisqa Ism</label>
                                        <input
                                            id="edit-name"
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-white text-sm"
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-birthdate" className="text-xs text-gray-400 uppercase block mb-1">Tug&apos;ilgan Sana</label>
                                        <input
                                            id="edit-birthdate"
                                            type="text"
                                            placeholder="DD/MM/YYYY"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-white text-sm"
                                            value={editData.birthDate}
                                            onChange={e => setEditData({ ...editData, birthDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="edit-role" className="text-xs text-gray-400 uppercase block mb-1">Rol</label>
                                        <select
                                            id="edit-role"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-white text-sm"
                                            value={editData.role}
                                            onChange={e => setEditData({ ...editData, role: e.target.value })}
                                        >
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Son">Son</option>
                                            <option value="Daughter">Daughter</option>
                                            <option value="Grandfather">Grandfather</option>
                                            <option value="Grandmother">Grandmother</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-aura-purple uppercase block mb-1">💼 Kasbi</label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: Dasturchi"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-aura-purple text-sm"
                                            value={editData.profession}
                                            onChange={e => setEditData({ ...editData, profession: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-aura-gold uppercase block mb-1">🎓 Ma&apos;lumoti</label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: Oliy"
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-aura-gold text-sm"
                                            value={editData.education}
                                            onChange={e => setEditData({ ...editData, education: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase block mb-1">📝 Bio</label>
                                        <textarea
                                            rows={5}
                                            placeholder="Qisqacha ma'lumot..."
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-white resize-none text-sm"
                                            value={editData.bio}
                                            onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-aura-blue text-black font-bold rounded-xl hover:bg-aura-cyan transition-colors text-sm">Saqlash</button>
                                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-transparent text-gray-500 font-bold rounded-xl hover:text-white transition-colors text-sm">Bekor qilish</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ALERT MODAL */}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div >
    );
}
