"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { upsertAncestor, Ancestor, subscribeToFamilyMembers, FamilyMember, subscribeToUserFamilies, subscribeToAncestors, FamilyGroup } from '@/services/familyService';
import SmartTree from '@/components/SmartTree';

export default function GenealogyPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [ancestors, setAncestors] = useState<Ancestor[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [activeGroup, setActiveGroup] = useState<FamilyGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingAncestor, setEditingAncestor] = useState<Partial<Ancestor>>({});

    useEffect(() => {
        if (!user) return;

        // 1. Subscribe to User Families to find the active group
        const unsubGroups = subscribeToUserFamilies(user.uid, (groups) => {
            const active = groups[0] || null; // For now, the first group is active
            setActiveGroup(active);
        });

        return () => unsubGroups();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const targetId = activeGroup ? activeGroup.ownerId : user.uid; // Members are stored under owner's subcollection

        // 2. Subscribe to Family Members
        const unsubMembers = subscribeToFamilyMembers(targetId, (members) => {
            setFamilyMembers(members);
        });

        // 3. Subscribe to Ancestors (Group-based or Personal)
        const unsubAncestors = subscribeToAncestors(
            activeGroup ? activeGroup.id : user.uid,
            !!activeGroup,
            (data) => {
                const sorted = data.sort((a, b) => new Date(a.birth).getFullYear() - new Date(b.birth).getFullYear());
                setAncestors(sorted);
                setLoading(false);
            }
        );

        return () => {
            unsubMembers();
            unsubAncestors();
        };
    }, [user, activeGroup]);

    const handleSave = async () => {
        if (!user || !editingAncestor.name || !editingAncestor.birth) return;

        const targetId = activeGroup ? activeGroup.id : user.uid;
        await upsertAncestor(targetId, editingAncestor as Ancestor, !!activeGroup);
        setIsModalOpen(false);
        setEditingAncestor({});
    };

    const openEdit = (ancestor: Ancestor) => {
        setEditingAncestor(ancestor);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingAncestor({
            name: '',
            role: 'Grandfather',
            status: 'Deceased',
            birth: '1950-01-01',
            healthIssues: []
        });
        setIsModalOpen(true);
    };


    if (loading) return <div className="p-10 text-white">Loading Tree...</div>;

    return (
        <div className="animate-fade-in pb-20">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/dashboard/family" className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mb-2">
                        <span>←</span> {t.family.backToHub}
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-2">
                        <span>🌳</span> {activeGroup ? `${activeGroup.name} Shajarasi` : 'Shajara (Genealogy)'}
                    </h1>
                </div>
                <button
                    onClick={openNew}
                    className="px-6 py-2 rounded-xl bg-aura-gold text-black font-bold hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,215,0,0.2)]"
                >
                    + Add Ancestor
                </button>
            </div>

            {/* TREE CONTAINER */}
            {/* Desktop: Horizontal (Row), Mobile: Vertical (Col) - wait, Tree usually Vertical (Top-Down) is standard. 
                PRD says: Mobile (Vertical) vs Web (Horizontal).
                Let's interpret: 
                Mobile: Cards stacked vertically.
                Web: Generation rows stacked vertically, but cards within generation horizontally. 
                OR Web: Left to Right tree. 
                Standard Family Tree is Top (Oldest) -> Down (Youngest).
                Let's stick to Standard Vertical Tree for now, but optimize layout.
            */}

            <div className="relative min-h-[700px] rounded-[3.5rem] bg-black/40 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-2xl">
                <SmartTree
                    ancestors={ancestors}
                    familyMembers={familyMembers}
                    onMemberClick={openEdit}
                />
            </div>

            {/* EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">{editingAncestor.id ? 'Edit Ancestor' : 'Add New Ancestor'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="gen-name" className="block text-xs uppercase text-gray-500 mb-1">Name</label>
                                <input
                                    id="gen-name"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                    value={editingAncestor.name || ''}
                                    onChange={e => setEditingAncestor({ ...editingAncestor, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="gen-role" className="block text-xs uppercase text-gray-500 mb-1">Role</label>
                                    <input
                                        id="gen-role"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                        placeholder="e.g. Grandfather"
                                        value={editingAncestor.role || ''}
                                        onChange={e => setEditingAncestor({ ...editingAncestor, role: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gen-status" className="block text-xs uppercase text-gray-500 mb-1">Status</label>
                                    <select
                                        id="gen-status"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                        value={editingAncestor.status || 'Deceased'}
                                        onChange={e => setEditingAncestor({ ...editingAncestor, status: e.target.value })}
                                    >
                                        <option value="Living">Living</option>
                                        <option value="Deceased">Deceased</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="gen-edu" className="block text-xs uppercase text-gray-500 mb-1">Ma&apos;lumoti (Education)</label>
                                <input
                                    id="gen-edu"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                    // @ts-expect-error - Ancestor type might be missing education
                                    value={editingAncestor.education || ''}
                                    // @ts-expect-error - Ancestor type missing education
                                    onChange={e => setEditingAncestor({ ...editingAncestor, education: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="gen-birth" className="block text-xs uppercase text-gray-500 mb-1">Birth Date</label>
                                    <input
                                        id="gen-birth"
                                        type="date"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                        value={editingAncestor.birth || ''}
                                        onChange={e => setEditingAncestor({ ...editingAncestor, birth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gen-death" className="block text-xs uppercase text-gray-500 mb-1">Death Date (Optional)</label>
                                    <input
                                        id="gen-death"
                                        type="date"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                        value={editingAncestor.death || ''}
                                        onChange={e => setEditingAncestor({ ...editingAncestor, death: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="gen-job" className="block text-xs uppercase text-gray-500 mb-1">Kasbi (Profession)</label>
                                <input
                                    id="gen-job"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                    value={editingAncestor.profession || ''}
                                    onChange={e => setEditingAncestor({ ...editingAncestor, profession: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="gen-bio" className="block text-xs uppercase text-gray-500 mb-1">Hayoti / Bio</label>
                                <textarea
                                    id="gen-bio"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none h-20 resize-none"
                                    value={(editingAncestor as Ancestor).bio || ''}
                                    onChange={e => setEditingAncestor(prev => ({ ...prev, bio: e.target.value } as Partial<Ancestor>))}
                                />
                            </div>

                            <div>
                                <label htmlFor="gen-health" className="block text-xs uppercase text-gray-500 mb-1">Health Issues (comma separated)</label>
                                <input
                                    id="gen-health"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-aura-gold outline-none"
                                    placeholder="e.g. Diabetes, Heart Disease"
                                    value={editingAncestor.healthIssues?.join(', ') || ''}
                                    onChange={e => setEditingAncestor({ ...editingAncestor, healthIssues: e.target.value.split(',').map(s => s.trim()) })}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">AI uses this for genetic risk analysis.</p>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white">Cancel</button>
                                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-aura-gold text-black font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
