"use client";
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import FamilyTree from '@/components/family/FamilyTree';
import LinkageWizard from '@/components/family/LinkageWizard';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/context/AuthContext';
import {
    getParentingRequests,
    getAncestors,
    removeFakeFamilyData,
    getFamilyGroups,
    createFamilyGroup,
    deleteFamilyGroup,
    restoreFamilyGroup,
    requestJoinFamily,
    approveJoinRequest,
    ensureOwnerProfile,
    subscribeToFamilyGroup,
    subscribeToUserFamilies,
    subscribeToFamilyMembers,
    updateFamilyMember,
    subscribeToDeletedFamilies,
    subscribeToAncestors,
    FamilyGroup,
    FamilyMember,
    ParentingRequest,
    Ancestor,
    FAMILY_ROLES
} from '@/services/familyService';
import { getFamilyInsight } from '@/services/groqService';
import { getFinanceOverview } from '@/services/financeService';
import { getHealthData } from '@/services/healthService';
import { getMindData } from '@/services/mindService';

import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import { calculateRelationship } from '@/lib/familyUtils';
import { getLocalTodayStr } from '@/lib/dateUtils';
import { useSearchParams } from 'next/navigation';
import ClientProfile from './ClientProfile';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';

export default function FamilyDashboard() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('family');
        if (user) {
            removeFakeFamilyData(user.uid).catch(console.error);
        }
    }, [user]);
    const searchParams = useSearchParams();
    const memberId = searchParams.get('id');

    // View States: 'dashboard' (default) | 'genealogy'
    const [viewMode, setViewMode] = useState<'dashboard' | 'genealogy'>('dashboard');

    // Data States
    const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<FamilyGroup | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [requests, setRequests] = useState<ParentingRequest[]>([]);
    const [ancestors, setAncestors] = useState<Ancestor[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
    const [archivedGroups, setArchivedGroups] = useState<FamilyGroup[]>([]);
    const [isArchived, setIsArchived] = useState(false);

    // Linkage Wizard State
    const [isLinkageWizardOpen, setIsLinkageWizardOpen] = useState(false);
    const [linkageBaseMemberId, setLinkageBaseMemberId] = useState<string>('');

    const handleAddRelative = (memberId: string) => {
        setLinkageBaseMemberId(memberId);
        setIsLinkageWizardOpen(true);
    };

    const handleVoiceCommand = async (command: any) => {
        if (!user || isArchived) return;
        const { action, data: cmdData } = command;

        if (action === 'add') {
            const name = cmdData?.name || cmdData?.fullName;
            if (name) {
                // Add member logic placeholder or actual service call
                // For now, let's just trigger the link wizard or a quick add
                triggerAlert("AI Oila", `${name} ismli a'zoni qo'shish uchun ma'lumotlar tayyorlanmoqda...`, "info");
            }
        }
    };

    useEffect(() => {
        const todayStr = getLocalTodayStr();
        setIsArchived(selectedDate !== todayStr);
    }, [selectedDate]);

    useEffect(() => {
        if (isRequestsModalOpen) {
            clearNotification('family');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRequestsModalOpen]);

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

    // --- HIERARCHY LOGIC FOR TASK ASSIGNMENT ---
    const getGenerationLevel = (role: string) => {
        const r = (role || "").toLowerCase();
        // Grandparents = 1
        if (r.includes('grand') || r.includes('bobo') || r.includes('buvi')) return 1;
        // Parents = 2
        if (r.includes('father') || r.includes('mother') || r.includes('ota') || r.includes('ona')) return 2;
        // Children = 3
        if (r.includes('son') || r.includes('daughter') || r.includes('child') || r.includes('farzand') || r.includes('o\'g\'il') || r.includes('qiz')) return 3;
        // Default to Parent if unknown (safe middle ground?) or Child? Let's assume Parent (2) to be safe against upward assignment.
        return 2;
    };

    const canAssignTask = (sourceMember: FamilyMember, targetMember: FamilyMember) => {
        if (!sourceMember || !targetMember) return false;

        // Cannot assign to self in this flow (optional, user didn't specify but it makes sense)
        // Actually user said "Children... mutually", so maybe Siblings?
        if (sourceMember.id === targetMember.id) return false;

        const sourceGen = getGenerationLevel(sourceMember.role);
        const targetGen = getGenerationLevel(targetMember.role);

        // Rule: Source Gen must be <= Target Gen (Higher or Equal can assign to Lower or Equal)
        // 1 (GP) < 2 (Parent) -> OK
        // 2 (Parent) < 3 (Child) -> OK
        // 2 (Parent) > 1 (GP) -> Fail (Correct)
        // 3 (Child) == 3 (Sibling) -> OK (Correct)
        // 2 (Spouse) == 2 (Spouse) -> OK (Correct)

        return sourceGen <= targetGen;
    };

    // Form States
    const [joinGroupId, setJoinGroupId] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedRole, setSelectedRole] = useState(FAMILY_ROLES[3]);
    const [reqFatherId, setReqFatherId] = useState('');
    const [reqMotherId, setReqMotherId] = useState('');

    // Creator Profile State
    const [ownerName, setOwnerName] = useState('');
    const [ownerBirth, setOwnerBirth] = useState('');
    const [ownerRole, setOwnerRole] = useState('Father');

    // Requester Profile State
    const [reqName, setReqName] = useState('');
    const [reqBirth, setReqBirth] = useState('');

    // Global Task Assignment State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [globalTask, setGlobalTask] = useState('');
    const [globalRewardType, setGlobalRewardType] = useState('screen_time');
    const [globalRewardAmount, setGlobalRewardAmount] = useState(15);

    const [selectedAncestor, setSelectedAncestor] = useState<any>(null);

    // AI Insight State
    const [aiInsight, setAiInsight] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const handleGenerateAI = async () => {
        if (!activeGroup || aiLoading) return;
        setAiLoading(true);
        try {
            // Fetch Cross-Module Context
            const todayStr = getLocalTodayStr();
            const [finance, health, mind] = await Promise.all([
                getFinanceOverview(user?.uid || ''),
                getHealthData(user?.uid || '', todayStr),
                getMindData(user?.uid || '')
            ]);

            const insight = await getFamilyInsight('uz', {
                memberCount: familyMembers.length,
                members: familyMembers.map(m => ({ name: m.name, role: m.role })),
                requests: requests.length,
                pendingApprovals: familyMembers.filter(m => m.status === 'Needs Approval').length,
                finance: finance ? { balance: finance.totalBalance, expense: finance.monthlySpent } : null,
                health: health ? { steps: health.activity.steps, sleep: health.sleep.duration } : null,
                mind: mind ? { recentMood: mind.moodHistory.slice(-1)[0]?.mood } : null
            });
            setAiInsight(insight);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    // Edit Member State
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null); // Added for the full member object
    const [editData, setEditData] = useState<{
        fullName: string;
        name: string;
        birthDate: string;
        role: string;
        fatherId: string;
        motherId: string;
        spouseId: string;
        profession: string;
        education: string;
        bio: string;
    }>({
        fullName: '',
        name: '',
        birthDate: '',
        role: 'Son',
        fatherId: '',
        motherId: '',
        spouseId: '',
        profession: '',
        education: '',
        bio: ''
    });

    useEffect(() => {
        if (!user) return;

        // Fetch fullName from Firestore user profile
        const fetchUserProfile = async () => {
            try {
                const { getUserProfile } = await import('@/services/userService');
                const profile = await getUserProfile(user.uid);
                if (profile) {
                    // @ts-ignore - fullName might not be in UserProfile interface yet
                    const name = profile.fullName || profile.displayName || user.displayName || '';
                    setOwnerName(name);
                    setReqName(name);
                }
            } catch (e) {
                console.warn('Could not fetch user profile', e);
                // Fallback to displayName from auth
                if (user.displayName) {
                    setOwnerName(user.displayName);
                    setReqName(user.displayName);
                }
            }
        };
        fetchUserProfile();

        setLoading(true);

        // Listen to ALL families I am a member of
        const unsubscribe = subscribeToUserFamilies(user.uid, async (groups) => {
            setFamilyGroups(groups);

            if (groups.length > 0) {
                // AUTO ENTER: If no active group, or if we were waiting, enter the first one immediately
                if (!activeGroup) {
                    await enterGroup(groups[0]);
                } else {
                    // Check if active group data updated
                    const currentGroup = groups.find(g => g.id === activeGroup.id);
                    if (currentGroup) {
                        // Optional sync
                    }
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // REAL-TIME LISTENER FOR ACTIVE GROUP
    useEffect(() => {
        if (!activeGroup?.id) return;
        const unsubscribe = subscribeToFamilyGroup(activeGroup.id, (updatedGroup) => {
            setActiveGroup(current => ({ ...current, ...updatedGroup }));
        });
        return () => unsubscribe();
    }, [activeGroup?.id]);

    // REAL-TIME LISTENER FOR DELETED GROUPS
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToDeletedFamilies(user.uid, (groups: FamilyGroup[]) => {
            setArchivedGroups(groups);
        });
        return () => unsubscribe();
    }, [user]);

    // REAL-TIME LISTENER FOR MEMBERS (CRITICAL FOR VISIBILITY)
    useEffect(() => {
        if (!activeGroup?.ownerId) return;

        const unsubscribe = subscribeToFamilyMembers(activeGroup.ownerId, (members) => {
            setFamilyMembers(members);
        });
        return () => unsubscribe();
    }, [activeGroup?.ownerId]);

    // REAL-TIME LISTENER FOR ANCESTORS (SHARED Tree)
    useEffect(() => {
        if (!activeGroup?.id) return;
        const unsubscribe = subscribeToAncestors(activeGroup.id, true, (data) => {
            setAncestors(data);
        });
        return () => unsubscribe();
    }, [activeGroup?.id]);

    // AUTO-HEAL: Automatically fix "New Member" names using root profile data
    useEffect(() => {
        if (activeGroup?.ownerId === user?.uid && familyMembers.length > 0) {
            const placeholders = familyMembers.filter(m =>
                m.name === 'New Member' ||
                m.fullName === 'New Member' ||
                !m.fullName ||
                m.name === 'Yangi A\'zo'
            );

            if (placeholders.length > 0) {
                const heal = async () => {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/firebaseConfig');
                    const { updateFamilyMember } = await import('@/services/familyService');

                    for (const m of placeholders) {
                        try {
                            const rootSnap = await getDoc(doc(db, "users", m.id));
                            if (rootSnap.exists()) {
                                const userData = rootSnap.data();
                                const realFullName = userData.fullName || userData.displayName;
                                if (realFullName && realFullName !== 'New Member' && realFullName !== 'Yangi A\'zo') {
                                    if (!activeGroup?.ownerId) continue;
                                    console.log("Auto-healing member name:", m.id, "->", realFullName);
                                    await updateFamilyMember(activeGroup.ownerId, m.id, {
                                        fullName: realFullName,
                                        name: realFullName.split(' ')[0]
                                    });
                                }
                            }
                        } catch (e) {
                            console.warn("Failed to heal member:", m.id, e);
                        }
                    }
                };
                heal();
            }
        }
    }, [familyMembers, activeGroup?.ownerId, user?.uid]);


    const enterGroup = async (group: FamilyGroup) => {
        setActiveGroup(group);
        setLoading(true);
        // Load data specific to this group context
        // We fetch data from the OWNER'S subcollections so everyone sees the same family tree
        try {
            const targetUserId = group.ownerId;

            // Ensure Owner Exists (Self-correction)
            if (group.ownerId === user?.uid) {
                await ensureOwnerProfile(user.uid);
            }

            const [reqs, ancs] = await Promise.all([
                getParentingRequests(targetUserId),
                getAncestors(group.id, true)
            ]);

            setRequests(reqs);
            setAncestors(ancs);
            // Members handled by real-time listener above
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || isArchived) return;
        if (!ownerName.trim() || !ownerBirth.trim()) {
            triggerAlert("Diqqat", "Iltimos, o'zingiz haqingizdagi ma'lumotlarni to'liq kiriting (Ism va Tug'ilgan yil).", "warning");
            return;
        }

        try {
            const newId = await createFamilyGroup(user!.uid, newGroupName, {
                fullName: ownerName,
                birthDate: ownerBirth,
                role: ownerRole
            });
            setNewGroupName('');
            setOwnerBirth('');
            setIsCreateModalOpen(false);
            setIsSwitcherOpen(false);

            // Reload and switch to new group
            const groups = await getFamilyGroups(user!.uid);
            setFamilyGroups(groups);
            const newGroup = groups.find(g => g.id === newId);
            if (newGroup) enterGroup(newGroup);

        } catch (e: any) {
            triggerAlert("Xatolik", e.message, "danger");
        }
    };

    const handleJoinGroup = async () => {
        if (!joinGroupId.trim() || isArchived) {
            if (!isArchived) triggerAlert("Diqqat", "Iltimos, ID kiriting", "warning");
            return;
        }

        if (!user) return;

        try {
            // Send Request directly
            await requestJoinFamily(user.uid, joinGroupId);
            triggerAlert("Muvaffaqiyat", "So'rov yuborildi! Oila boshlig'i tasdiqlashi kerak.", "success");
            setIsJoinModalOpen(false);
            setJoinGroupId('');
            setIsSwitcherOpen(false);
        } catch (e: any) {
            triggerAlert("Xatolik", e.message, "danger");
        }
    };

    const handleApproveRequest = async (requestingUserId: string) => {
        if (!activeGroup || isArchived) return;
        try {
            await approveJoinRequest(user!.uid, activeGroup.id, requestingUserId, selectedRole, {
                fatherId: reqFatherId,
                motherId: reqMotherId
            });
            triggerAlert("Muvaffaqiyat", "A'zo muvaffaqiyatli qo'shildi!", "success");
            setReqFatherId('');
            setReqMotherId('');
            setIsRequestsModalOpen(false);
        } catch (e: any) {
            triggerAlert("Xatolik", e.message, "danger");
        }
    };

    const handleRestoreGroup = async (groupId: string) => {
        if (isArchived) return;
        try {
            await restoreFamilyGroup(groupId);
            triggerAlert("Muvaffaqiyat", "Oila qayta tiklandi!", "success");
        } catch (e: any) {
            triggerAlert("Xatolik", e.message, "danger");
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (isArchived) return;
        if (confirm("Bu oilani o'chirishni xohlaysizmi? (Istagan paytda arxivdan tiklash mumkin)")) {
            await deleteFamilyGroup(groupId, user!.uid);
            if (activeGroup?.id === groupId) {
                setActiveGroup(null);
            }
        }
    };

    const handleGlobalAssign = async () => {
        if (!selectedChildId || !globalTask || isArchived) return;
        const rewardString = globalRewardType === 'coins' ? `${globalRewardAmount} Coins` : `${globalRewardAmount} min Screen Time`;
        triggerAlert("Muvaffaqiyat", `Vazifa "${globalTask}" (${rewardString}) ${familyMembers.find(m => m.id === selectedChildId)?.name} ga yuklandi!`, "success");
        setAssignModalOpen(false);
    };

    const handleEditMember = (member: FamilyMember) => {
        setEditingMemberId(member.id);
        setEditingMember(member);
        setEditData({
            fullName: member.fullName || '',
            name: member.name || '',
            birthDate: member.birthDate || '',
            role: member.role || '',
            fatherId: member.fatherId || '',
            motherId: member.motherId || '',
            spouseId: member.spouseId || '',
            profession: member.profession || '',
            education: member.education || '',
            bio: member.bio || ''
        });
    };

    const handleSaveMemberEdit = async () => {
        if (!editingMemberId || !activeGroup || isArchived) return;

        try {
            await updateFamilyMember(activeGroup.ownerId, editingMemberId, {
                fullName: editData.fullName,
                name: editData.name,
                birthDate: editData.birthDate,
                role: editData.role,
                fatherId: editData.fatherId,
                motherId: editData.motherId,
                spouseId: editData.spouseId,
                profession: editData.profession,
                education: editData.education,
                bio: editData.bio
            });
            triggerAlert("Muvaffaqiyat", "Ma'lumotlar saqlandi!", "success");
            setEditingMemberId(null);
            // Real-time listener will refresh the list and tree automatically
        } catch (e: any) {
            triggerAlert("Xatolik", "Xatolik: " + e.message, "danger");
        }
    };

    // Re-used helpers
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'home': return '🏠';
            case 'work': return '💼';
            case 'school': return '🏫';
            case 'gym': return '🏋️';
            case 'legacy': return '👴';
            default: return '📍';
        }
    };

    const getMoodColor = (mood: string) => {
        switch (mood) {
            case 'happy': return 'text-aura-green';
            case 'focused': return 'text-aura-blue';
            case 'tired': return 'text-aura-orange';
            case 'stressed': return 'text-aura-red';
            default: return 'text-white';
        }
    };
    function renderJoinModal() {
        return (
            <Modal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                title="Oilaga Qo'shilish"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-6">Faqat Oila ID raqamini kiriting. Tasdiqlangandan so&apos;ng profilingizni to&apos;ldirasiz.</p>
                    <div>
                        <label htmlFor="join-group-id" className="text-xs text-gray-400 uppercase">Oila ID raqami</label>
                        <input
                            id="join-group-id"
                            type="text"
                            placeholder="ID kiritish"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                            value={joinGroupId}
                            onChange={e => setJoinGroupId(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={handleJoinGroup} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">So&apos;rov Yuborish</button>
                    <button onClick={() => setIsJoinModalOpen(false)} className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:text-white transition-colors">Bekor qilish</button>
                </div>
            </Modal>
        );
    }

    function renderEditMemberModal() {
        return (
            <Modal
                isOpen={!!editingMemberId}
                onClose={() => setEditingMemberId(null)}
                title="A'zo Ma'lumotlarini Tahrirlash"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-6">Shajara to&apos;g&apos;ri shakllanishi uchun ota va onani belgilang.</p>

                    {/* Parent Suggestions */}
                    {(editData.role.includes('Son') || editData.role.includes('Daughter')) && (!editData.fatherId || !editData.motherId) && (
                        <div className="p-3 rounded-xl bg-aura-blue/5 border border-aura-blue/20 mb-4 animate-pulse">
                            <p className="text-[10px] text-aura-blue font-bold uppercase mb-2">Tavsiya etilgan ota-ona:</p>
                            <div className="flex flex-wrap gap-2">
                                {familyMembers.filter(m => m.id !== editingMemberId && (m.role.includes('Father') || m.role.includes('Mother'))).map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            if (m.role.includes('Father')) setEditData({ ...editData, fatherId: m.id });
                                            else setEditData({ ...editData, motherId: m.id });
                                        }}
                                        className="text-[10px] px-2 py-1 bg-aura-blue/20 text-aura-blue rounded-lg hover:bg-aura-blue hover:text-black transition-all"
                                    >
                                        + {m.name} ({m.role})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-aura-blue font-bold uppercase block mb-1">To&apos;liq Ism (Passport bo&apos;yicha)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-aura-blue placeholder-gray-600"
                                placeholder="Masalan: Abdullayev Anvar"
                                value={editData.fullName || ''}
                                onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Bu ism ro&apos;yxatda to&apos;liq ko&apos;rinadi.</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase block mb-1">Qisqa Ism (Ekranda ko&apos;rsatish)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                placeholder="Anvar"
                                value={editData.name || ''}
                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase">Tug'ilgan Sana (Kun/Oy/Yil)</label>
                            <input
                                type="text"
                                placeholder="DD/MM/YYYY"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                value={editData.birthDate}
                                onChange={e => setEditData({ ...editData, birthDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-role" className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Roli</label>
                        <select
                            id="edit-role"
                            aria-label="Rolni tanlash"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                            value={editData.role}
                            onChange={e => setEditData({ ...editData, role: e.target.value })}
                        >
                            {FAMILY_ROLES.map(role => (
                                <option key={role} value={role} className="bg-gray-900">{role}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                        <p className="text-sm text-aura-gold mb-3 font-bold">Ota-Ona va Jufti (Shajara)</p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="edit-father" className="text-xs text-gray-400 uppercase">Otasi (Erkaklar)</label>
                                <select
                                    id="edit-father"
                                    aria-label="Otasini tanlash"
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                    value={editData.fatherId}
                                    onChange={e => setEditData({ ...editData, fatherId: e.target.value })}
                                >
                                    <option value="" className="bg-gray-900">Tanlanmagan</option>
                                    {familyMembers.filter(m => m.id !== editingMemberId && !m.role.includes('Mother') && !m.role.includes('Daughter') && !m.role.includes('Sister') && !m.role.includes('Aunt')).map(m => (
                                        <option key={m.id} value={m.id} className="bg-gray-900">{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit-mother" className="text-xs text-gray-400 uppercase">Onasi (Ayollar)</label>
                                <select
                                    id="edit-mother"
                                    aria-label="Onasini tanlash"
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                    value={editData.motherId}
                                    onChange={e => setEditData({ ...editData, motherId: e.target.value })}
                                >
                                    <option value="" className="bg-gray-900">Tanlanmagan</option>
                                    {familyMembers.filter(m => m.id !== editingMemberId && !m.role.includes('Father') && !m.role.includes('Son') && !m.role.includes('Brother') && !m.role.includes('Uncle')).map(m => (
                                        <option key={m.id} value={m.id} className="bg-gray-900">{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="edit-spouse" className="text-xs text-gray-400 uppercase">Turmush O&apos;rtog&apos;i (Spouse)</label>
                            <select
                                id="edit-spouse"
                                aria-label="Turmush o'rtog'ini tanlash"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                value={editData.spouseId}
                                onChange={e => setEditData({ ...editData, spouseId: e.target.value })}
                            >
                                <option value="" className="bg-gray-900">Tanlanmagan</option>
                                {familyMembers.filter(m => m.id !== editingMemberId).map(m => (
                                    <option key={m.id} value={m.id} className="bg-gray-900">{m.name} ({m.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* LIFE BEACON STRATEGIC SETTINGS */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-aura-cyan font-bold flex items-center gap-2">
                                🏮 {t.liveness_section.title}
                            </p>
                            <div className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${((editingMember?.role || "").toLowerCase().includes('grand') || (editingMember?.role || "").toLowerCase().includes('elder')) ? 'bg-aura-cyan/20 text-aura-cyan' : 'bg-gray-800 text-gray-500'}`}>
                                {((editingMember?.role || "").toLowerCase().includes('grand') || (editingMember?.role || "").toLowerCase().includes('elder')) ? 'STRATEGIC PRIORITY' : 'OPTIONAL'}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs text-white font-bold">Passive Monitoring</p>
                                    <p className="text-[10px] text-gray-500">Alert family if no activity detected</p>
                                </div>
                                <div className="w-10 h-6 rounded-full bg-aura-cyan/20 border border-aura-cyan/30 flex items-center px-1 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full bg-aura-cyan"></div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Alert Window</label>
                                <div className="flex gap-2">
                                    {['12h', '24h', '48h'].map(time => (
                                        <button key={time} className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${time === '24h' ? 'bg-aura-cyan/10 border-aura-cyan text-aura-cyan' : 'bg-black/20 border-white/10 text-gray-500'}`}>
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] text-gray-500 italic leading-relaxed">
                                    * {t.liveness_section.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={handleSaveMemberEdit} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">Saqlash</button>
                    <button onClick={() => setEditingMemberId(null)} className="flex-1 py-3 bg-white/5 text-gray-500 font-bold rounded-xl hover:text-white transition-colors">Bekor qilish</button>
                </div>
            </Modal>
        );
    }

    function renderArchivedModal() {
        return (
            <Modal
                isOpen={isArchivedModalOpen}
                onClose={() => setIsArchivedModalOpen(false)}
                title="Arxivlangan Oilalar"
            >
                <div className="space-y-4">
                    {archivedGroups.map(group => (
                        <div key={group.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group">
                            <div>
                                <h4 className="text-white font-bold">{group.name}</h4>
                                <p className="text-[10px] text-gray-500">O&apos;chirilgan sana: {group.deletedAt ? new Date(group.deletedAt).toLocaleDateString() : 'Noma\'lum'}</p>
                            </div>
                            <button
                                onClick={() => handleRestoreGroup(group.id)}
                                className="bg-aura-green/20 text-aura-green px-4 py-2 rounded-lg text-xs font-bold hover:bg-aura-green hover:text-black transition-all"
                            >
                                Tiklash 🔄
                            </button>
                        </div>
                    ))}
                    {archivedGroups.length === 0 && (
                        <p className="text-gray-500 text-center py-8 italic">Arxiv bo&apos;sh</p>
                    )}
                </div>

                <div className="mt-8">
                    <button onClick={() => setIsArchivedModalOpen(false)} className="w-full py-3 bg-white/5 text-gray-400 rounded-xl hover:text-white transition-colors">Yopish</button>
                </div>
            </Modal>
        );
    }

    // --- RENDER HELPERS ---
    function renderCreateModal() {
        return (
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Yangi Oila Yaratish"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 mb-6">Yangi oilaviy muhit yarating va yaqinlaringizni qo&apos;shing</p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase">Oila Nomi</label>
                            <input
                                type="text"
                                placeholder="Masalan: Ahmedovlar Oilasi"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-sm text-aura-purple mb-2 font-bold">Sizning Profilingiz (Oila Boshlig&apos;i)</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase">To&apos;liq Ism (F.I.SH)</label>
                                    <input
                                        type="text"
                                        value={ownerName}
                                        disabled
                                        aria-label="To'liq Ism"
                                        className="w-full bg-black/60 border border-white/5 text-gray-400 rounded-xl p-3 mt-1 outline-none cursor-not-allowed"
                                    />
                                    <p className="text-[9px] text-gray-600 mt-1">✓ Ro&apos;yxatdan o&apos;tish paytidagi ismingiz avtomatik kiritildi</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase">Tug&apos;ilgan Sana (Kun/Oy/Yil)</label>
                                    <input type="text" placeholder="DD/MM/YYYY" value={ownerBirth} onChange={e => setOwnerBirth(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase">Rolingiz</label>
                                    <select aria-label="Rolni tanlash" value={ownerRole} onChange={e => setOwnerRole(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-white">
                                        {FAMILY_ROLES.map(role => <option key={role} value={role} className="bg-gray-900">{role}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={handleCreateGroup} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">Yaratish</button>
                    <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:text-white transition-colors">Bekor qilish</button>
                </div>
            </Modal>
        );
    }

    if (loading && !activeGroup && familyGroups.length > 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-aura-cyan border-t-transparent animate-spin"></div>
                    <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading Family...</span>
                </div>
            </div>
        );
    }

    if (memberId) {
        return <ClientProfile id={memberId} />;
    }

    // --- NO GROUPS STATE ---
    if (familyGroups.length === 0 && !loading) {
        return (
            <div className="space-y-8 animate-fade-in relative min-h-screen p-4 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-display font-bold text-white mb-2">Xush kelibsiz!</h1>
                <p className="text-gray-400 mb-8">Boshlash uchun Oila yarating yoki mavjud oilaga qo&apos;shiling.</p>
                <div className="flex gap-6">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="p-8 rounded-3xl bg-aura-blue/5 border border-dashed border-aura-blue/30 flex flex-col items-center justify-center gap-4 hover:bg-aura-blue/10 transition-colors"
                    >
                        <span className="text-3xl">+</span>
                        <span className="font-bold text-aura-blue">Oila Yaratish</span>
                    </button>
                    <button
                        onClick={() => setIsJoinModalOpen(true)}
                        className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors"
                    >
                        <span className="text-3xl">🔍</span>
                        <span className="font-bold text-gray-300">Oilaga Qo&apos;shilish</span>
                    </button>
                </div>

                {/* Create Modal */}
                {isCreateModalOpen && renderCreateModal()}

                {/* Join Modal */}
                {isJoinModalOpen && renderJoinModal()}
            </div>
        )
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="space-y-4 animate-fade-in relative min-h-screen">
            {/* Header with Switcher */}
            <div className="flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-40 p-4 -mx-4 rounded-b-2xl border-b border-white/10 shadow-lg">
                <div className="flex flex-col">
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors"
                            >
                                <h1 className="text-3xl font-display font-bold text-white">{activeGroup?.name}</h1>
                                <span className="text-gray-400 text-xs">▼</span>
                            </button>

                            {/* View Toggles & Member Count */}
                            <div className="flex items-center gap-4">
                                {/* View Toggles */}
                                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 h-8 items-center">
                                    <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'dashboard' ? 'bg-aura-cyan text-black' : 'text-gray-400 hover:text-white'}`}>{t.family.liveHub}</button>
                                    <button onClick={() => setViewMode('genealogy')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'genealogy' ? 'bg-aura-purple text-white' : 'text-gray-400 hover:text-white'}`}>{t.family.genealogy}</button>
                                </div>

                                {/* Member Count Pill */}
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-aura-gold/10 border border-aura-gold/20 text-aura-gold font-bold text-xs h-8">
                                    <span>🪙</span>
                                    <span>{activeGroup?.members?.length || 0} A&apos;zo</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-aura-green px-2 flex items-center gap-2 mt-1 opacity-50">
                            <span className="w-2 h-2 rounded-full bg-aura-green"></span>
                            ID: {activeGroup?.id}
                        </div>
                        {/* Family Switcher Dropdown */}
                        {isSwitcherOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                <div className="p-2">
                                    <p className="text-xs text-gray-500 uppercase px-3 py-2">Mening Oilalarim</p>
                                    {familyGroups.map(group => (
                                        <div key={group.id} className="group relative">
                                            <button
                                                onClick={() => {
                                                    enterGroup(group);
                                                    setIsSwitcherOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-3 rounded-xl flex items-center justify-between ${activeGroup?.id === group.id ? 'bg-aura-blue/20 text-aura-blue' : 'text-gray-300 hover:bg-white/5'}`}
                                            >
                                                <span>{group.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {activeGroup?.id === group.id && <span>✓</span>}
                                                    {group.ownerId === user?.uid && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-aura-red transition-all"
                                                            title="O'chirish"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 p-2 bg-black/20">
                                    <button onClick={() => setIsCreateModalOpen(true)} className="w-full text-left px-3 py-2 text-sm text-aura-green hover:bg-white/5 rounded-lg flex items-center gap-2">
                                        <span>+</span> Yangi Oila Yaratish
                                    </button>
                                    <button onClick={() => setIsJoinModalOpen(true)} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg flex items-center gap-2">
                                        <span>🔍</span> Oilaga Qo&apos;shilish
                                    </button>
                                    {archivedGroups.length > 0 && (
                                        <button onClick={() => setIsArchivedModalOpen(true)} className="w-full text-left px-3 py-2 text-sm text-aura-gold hover:bg-white/5 rounded-lg flex items-center gap-2">
                                            <span>📁</span> Arxivlangan Oilalar ({archivedGroups.length})
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    <VoiceInput
                        module="family"
                        onCommand={handleVoiceCommand}
                        color="purple"
                        className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                    />
                    <button
                        onClick={() => setIsArchivedModalOpen(true)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                        title="Arxiv"
                    >
                        📦
                    </button>
                    {activeGroup?.ownerId === user?.uid && (
                        <button
                            onClick={() => setIsRequestsModalOpen(true)}
                            className="relative p-3 rounded-xl bg-aura-purple/10 border border-aura-purple/20 text-aura-purple hover:bg-aura-purple/20 transition-all"
                            title="So&apos;rovlar"
                        >
                            👥
                            {requests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-aura-red text-white text-[10px] flex items-center justify-center rounded-full animate-bounce">{requests.length}</span>}
                        </button>
                    )}
                </div>
            </div>

            {
                isArchived && (
                    <ReadOnlyBanner
                        title={t.family?.readOnly || "Archive Mode"}
                        description={t.family?.readOnlyDesc || "Historical data is read-only."}
                    />
                )
            }



            {/* Join Requests Notification */}
            {activeGroup?.ownerId === user?.uid && (activeGroup?.joinRequests?.length || 0) > 0 && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsRequestsModalOpen(true)}
                        className="relative p-2 rounded-xl bg-aura-red/10 border border-aura-red/30 text-aura-red hover:bg-aura-red/20 transition-colors"
                    >
                        <span>🔔 So&apos;rovlar</span>
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                            {activeGroup?.joinRequests?.length}
                        </span>
                    </button>
                </div>
            )}

            {/* FLOATING ACTION BUTTON */}
            {
                viewMode === 'dashboard' && (
                    <div className="fixed bottom-6 right-6 z-40">
                        <button
                            onClick={() => setAssignModalOpen(true)}
                            className="w-16 h-16 rounded-full bg-aura-blue text-black text-3xl flex items-center justify-center shadow-[0_0_20px_rgba(0,120,255,0.3)] hover:scale-110 transition-transform"
                            title="Vazifa Berish"
                        >
                            📝
                        </button>
                    </div>
                )
            }

            {/* CONTENT MODE: DASHBOARD */}
            {
                viewMode === 'dashboard' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* HEADER */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-display font-bold text-white mb-2">{t.family.title}</h1>
                                <p className="text-gray-400">{t.family.subtitle}</p>
                            </div>


                        </div>


                        {/* AI INSIGHT SECTION */}
                        <AiInsightSection
                            onAnalyze={handleGenerateAI}
                            isLoading={aiLoading}
                            insight={aiInsight}
                            title="AI Maslahat"
                            description="Oilaviy ma'lumotlarga asoslangan sun'iy intellekt tahlili va tavsiyalari."
                            buttonText="Tahlilni Boshlash"
                            color="purple"
                        >
                        </AiInsightSection>

                        <div className="space-y-8">
                            {/* PULSE STATS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div><p className="text-gray-400 text-xs uppercase mb-1">UMUMIY KAYFIYAT</p><p className="text-2xl font-bold text-white">Yaxshi</p></div>
                                    <div className="text-4xl">😊</div>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div><p className="text-gray-400 text-xs uppercase mb-1">FAOL KVESTLAR</p><p className="text-2xl font-bold text-aura-gold">Barchasi Joyida</p></div>
                                    <div className="text-4xl">📜</div>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div><p className="text-gray-400 text-xs uppercase mb-1">OILA DARAJASI</p><p className="text-2xl font-bold text-aura-purple">42-Daraja</p></div>
                                    <div className="text-4xl">⭐</div>
                                </div>
                            </div>

                            {/* MEMBERS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {familyMembers.map((member) => (
                                    <div key={member.id} className="group relative">
                                        {/* Navigation Link (Background) */}
                                        <Link
                                            href={`?id=${member.id}`}
                                            prefetch={false}
                                            className="absolute inset-0 z-10 rounded-[2.5rem]"
                                            aria-label={`View ${member.fullName || (member.name === 'New Member' || member.name === 'Yangi A\'zo' ? 'Ism kiritilmagan' : member.name)} profile`}
                                        />

                                        <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-aura-cyan/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity z-0`}></div>
                                        {(member.battery < 10 || member.safetyStatus === 'danger') && (
                                            <div className="absolute inset-0 bg-aura-red/10 animate-pulse rounded-[2.5rem] border-2 border-aura-red/50 z-20 pointer-events-none"></div>
                                        )}

                                        <div className="h-full p-6 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/10 group-hover:border-aura-cyan/30 transition-all flex flex-col justify-between relative overflow-hidden pointer-events-none">
                                            <div className="flex items-start justify-between mb-4 pointer-events-auto">
                                                <div className="relative group/avatar">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 flex items-center justify-center text-4xl border border-white/10 group-hover/avatar:border-aura-cyan transition-colors z-20">
                                                        {(member.role || "").toLowerCase().includes('father') || member.role === 'Head' ? '👨' :
                                                            (member.role || "").toLowerCase().includes('mother') ? '👩' :
                                                                (member.role || "").toLowerCase().includes('spouse') ? '❤️' :
                                                                    (member.role || "").toLowerCase().includes('son') ? '👦' :
                                                                        (member.role || "").toLowerCase().includes('kelin') || (member.role || "").toLowerCase().includes('daughter-in-law') ? '👩' :
                                                                            (member.role || "").toLowerCase().includes('daughter') ? '👧' :
                                                                                (member.role || "").toLowerCase().includes('elder') || (member.role || "").toLowerCase().includes('grand') ? '👴' : '👤'}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black flex items-center justify-center text-xs border border-white/20 z-30">{getStatusIcon(member.status)}</div>

                                                    {/* LIFE BEACON PULSE (For Seniors) */}
                                                    {((member.role || "").toLowerCase().includes('grand') || (member.role || "").toLowerCase().includes('elder')) && (
                                                        <div className="absolute -top-2 -left-2 flex items-center justify-center z-40">
                                                            <div className="w-4 h-4 rounded-full bg-aura-cyan animate-ping opacity-75"></div>
                                                            <div className="absolute w-2 h-2 rounded-full bg-aura-cyan"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="text-[10px] font-bold px-3 py-1 rounded-full border border-white/5 bg-white/5 uppercase opacity-70">Lvl {member.level}</div>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <h3 className="text-xl font-bold text-white group-hover:text-aura-cyan transition-colors line-clamp-1">
                                                    {member.fullName || (member.name === 'New Member' || member.name === 'Yangi A\'zo' ? 'Ism kiritilmagan' : member.name)}
                                                </h3>
                                                <p className="text-xs text-aura-cyan font-bold tracking-widest uppercase">
                                                    {user ? calculateRelationship(member, user as unknown as FamilyMember, familyMembers) : member.role}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 w-[var(--value)]"
                                                        style={{
                                                            '--value': `${member.battery}%`,
                                                            backgroundColor: member.battery > 50 ? '#00FF94' : member.battery > 20 ? '#FFD600' : '#FF2E2E'
                                                        } as React.CSSProperties}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                                                    <span className="text-gray-500">Current Mood</span>
                                                    <span className={`font-bold capitalize ${getMoodColor(member.mood)}`}>{member.mood}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CONTENT MODE: GENEALOGY */}
            {
                viewMode === 'genealogy' && (
                    <div className="min-h-[70vh] w-full bg-black/40 backdrop-blur-xl rounded-[3rem] border border-white/10 relative overflow-hidden animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <FamilyTree
                            ancestors={ancestors}
                            familyMembers={familyMembers}
                            onNodeClick={(id) => {
                                // Optional: Select node or show details
                            }}
                            onAddRelative={handleAddRelative}
                            onEdit={(id) => setEditingMemberId(id)}
                            centerMemberId={user?.uid}
                        />
                    </div>
                )
            }

            {/* SHARED MODALS */}

            {/* Create Group Modal (Also accessible from Switcher) */}
            {/* Create Group Modal (Also accessible from Switcher) */}
            {isCreateModalOpen && familyGroups.length > 0 && renderCreateModal()}

            {/* Join Group Modal (Also accessible from Switcher) */}
            {isJoinModalOpen && familyGroups.length > 0 && renderJoinModal()}

            {/* MEMBER EDIT MODAL */}
            {editingMemberId && renderEditMemberModal()}

            {/* LINKAGE WIZARD */}
            <LinkageWizard
                isOpen={isLinkageWizardOpen}
                onClose={() => setIsLinkageWizardOpen(false)}
                baseMemberId={linkageBaseMemberId}
                familyMembers={familyMembers}
                ancestors={ancestors}
                onSuccess={() => {
                    // Subscription will auto-update
                }}
            />

            {/* REQUESTS MANAGEMENT MODAL */}
            {isArchivedModalOpen && renderArchivedModal()}

            {/* REQUESTS MANAGEMENT MODAL */}
            <Modal
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
                title="Kelib tushgan so&apos;rovlar"
            >
                <div className="space-y-4">
                    {activeGroup?.joinRequests?.length === 0 && (
                        <p className="text-gray-500 italic">Hozircha so&apos;rovlar yo&apos;q.</p>
                    )}

                    {activeGroup?.joinRequests?.map(reqUserId => (
                        <div key={reqUserId} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-aura-blue/20 flex items-center justify-center text-xl">👤</div>
                                    <span className="text-white font-bold">{reqUserId.substring(0, 12)}...</span>
                                </div>
                                <div className="text-[10px] text-aura-gold font-bold uppercase tracking-wider bg-aura-gold/10 px-2 py-1 rounded">Kutmoqda</div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor={`role-select-${reqUserId}`} className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Roli</label>
                                    <select
                                        id={`role-select-${reqUserId}`}
                                        aria-label="Rolni tanlash"
                                        className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl p-3 outline-none focus:border-aura-blue"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        {FAMILY_ROLES.map(role => (
                                            <option key={role} value={role} className="bg-gray-900">{role}</option>
                                        ))}
                                    </select>
                                </div>

                                {(selectedRole.includes('Son') || selectedRole.includes('Daughter') || selectedRole.includes('Nephew')) && (
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                        <div>
                                            <label htmlFor={`father-select-${reqUserId}`} className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Otasi</label>
                                            <select
                                                id={`father-select-${reqUserId}`}
                                                aria-label="Otasini tanlash"
                                                className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl p-2 outline-none"
                                                value={reqFatherId}
                                                onChange={(e) => setReqFatherId(e.target.value)}
                                            >
                                                <option value="">Tanlanmagan</option>
                                                {familyMembers.filter(m => !m.role.includes('Mother') && !m.role.includes('Daughter')).map(m => (
                                                    <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`mother-select-${reqUserId}`} className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Onasi</label>
                                            <select
                                                id={`mother-select-${reqUserId}`}
                                                aria-label="Onasini tanlash"
                                                className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl p-2 outline-none"
                                                value={reqMotherId}
                                                onChange={(e) => setReqMotherId(e.target.value)}
                                            >
                                                <option value="">Tanlanmagan</option>
                                                {familyMembers.filter(m => !m.role.includes('Father') && !m.role.includes('Son')).map(m => (
                                                    <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => handleApproveRequest(reqUserId)}
                                    className="flex-1 bg-aura-green text-black py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform"
                                >
                                    Tasdiqlash
                                </button>
                                <button className="px-4 py-3 bg-white/5 text-aura-red rounded-xl hover:bg-aura-red/10 transition-colors">
                                    Rad etish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* GLOBAL ASSIGN TASK MODAL */}
            <Modal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                title="Vazifa Berish"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="assign-target" className="text-xs text-gray-500 uppercase">Kimga</label>
                        <select
                            id="assign-target"
                            aria-label="Vazifa egasini tanlash"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none"
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                        >
                            <option value="">Tanlang...</option>
                            {familyMembers
                                .filter(m => {
                                    // Find current user's member profile
                                    const currentUserMember = familyMembers.find(fm => fm.id === user?.uid);
                                    if (!currentUserMember) return false; // Should not happen if user is in family
                                    return canAssignTask(currentUserMember, m) && m.id !== user?.uid; // Exclude self if desired, or keep logic simple
                                })
                                .map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                ))
                            }
                        </select>
                    </div>
                    <div>
                        <label htmlFor="assign-task" className="text-xs text-gray-500 uppercase">Vazifa</label>
                        <input
                            id="assign-task"
                            type="text"
                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-aura-blue"
                            placeholder="Masalan: Xonani yig'ishtirish"
                            value={globalTask}
                            onChange={(e) => setGlobalTask(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="assign-reward-type" className="text-xs text-gray-500 uppercase">Mukofot Turi</label>
                            <select
                                id="assign-reward-type"
                                aria-label="Mukofot turini tanlash"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none"
                                value={globalRewardType}
                                onChange={(e) => setGlobalRewardType(e.target.value)}
                            >
                                <option value="screen_time">⏳ Screen Time</option>
                                <option value="coins">🪙 Coins</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assign-reward-amount" className="text-xs text-gray-500 uppercase">Miqdor</label>
                            <input
                                id="assign-reward-amount"
                                type="number"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3 mt-1 outline-none focus:border-aura-blue"
                                value={globalRewardAmount}
                                onChange={(e) => setGlobalRewardAmount(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={handleGlobalAssign}
                        className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Vazifani Yuklash
                    </button>
                    <button
                        onClick={() => setAssignModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:text-white transition-colors"
                    >
                        Bekor qilish
                    </button>
                </div>
            </Modal>
        </div >
    );
}
