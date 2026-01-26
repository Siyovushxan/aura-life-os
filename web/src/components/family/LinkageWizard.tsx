"use client";
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { FamilyMember, Ancestor, linkFamilyMembers, RelationshipPayload } from '@/services/familyService';
import { useAuth } from '@/context/AuthContext';

interface LinkageWizardProps {
    isOpen: boolean;
    onClose: () => void;
    baseMemberId: string; // The person we are adding a relative TO
    familyMembers: FamilyMember[];
    ancestors: Ancestor[];
    onSuccess: () => void;
}

export default function LinkageWizard({ isOpen, onClose, baseMemberId, familyMembers, ancestors, onSuccess }: LinkageWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2>(1);
    const [relationType, setRelationType] = useState<RelationshipPayload['type']>('father');
    const [targetMemberId, setTargetMemberId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setRelationType('father');
            setTargetMemberId('');
        }
    }, [isOpen]);

    const baseMember = [...familyMembers, ...ancestors].find(m => m.id === baseMemberId);

    // Filter potential targets (can't be self)
    const availableTargets = [...familyMembers, ...ancestors].filter(m => m.id !== baseMemberId);

    const handleSubmit = async () => {
        if (!user || !targetMemberId) return;
        setLoading(true);
        try {
            // "Adding a Father to Base Member" means:
            // Source (Father) = TargetMemberId
            // Target (Child) = BaseMemberId
            // Type = 'father'

            // Wait, my service logic was: linkFamilyMembers(ownerId, payload)
            // Payload sourceId/targetId/type
            // If I selected "Add Father", I am saying TargetMember is the FATHER of BaseMember.
            // Service handles: if type='father', set fatherId on target.
            // So if type='father', source=FATHER, target=CHILD.

            let payload: RelationshipPayload = {
                sourceId: '',
                targetId: '',
                type: 'father' // dummy
            };

            if (relationType === 'father') {
                payload = { sourceId: targetMemberId, targetId: baseMemberId, type: 'father' };
            } else if (relationType === 'mother') {
                payload = { sourceId: targetMemberId, targetId: baseMemberId, type: 'mother' };
            } else if (relationType === 'spouse') {
                payload = { sourceId: baseMemberId, targetId: targetMemberId, type: 'spouse' }; // order mostly symmetrical
            } else if (relationType === 'son' || relationType === 'daughter') {
                // I am adding a child. Base is Parent. Target is Child.
                // Service doesn't have 'son'/'daughter' logic fully mapped yet to set fatherId/motherId automatic unless we check gender.
                // Let's rely on explicit 'father'/'mother' logic for now?
                // No, easier: If I say "Add Child", I want to set fatherId/motherId on the CHILD.
                // I need to know MY gender (BaseMember) to know if I am father or mother.

                // Fallback: Just support Parent/Spouse linking for now for simplicity, OR
                // assume BaseMember is Father if gender not known?
                // Let's stick to adding PARENTS and SPOUSES for v1 to avoid gender ambiguity logic for now.
                // OR allow selecting "I am his Father" vs "I am his Mother".

                // Simpler UI: "Select Relationship" -> "[Target] is [Base]'s..."
                // Options: Father, Mother, Spouse, Child.

                if (relationType === 'son' || relationType === 'daughter') {
                    // Target is child of Base
                    // We need to set fatherId or motherId on Target.
                    // Let's assume Base is Father for now (default) or check role.
                    const role = (baseMember?.role || '').toLowerCase();
                    const isMother = role.includes('mother') || role.includes('ayol') || role.includes('qiz') || role.includes('sister');

                    payload = {
                        sourceId: baseMemberId,
                        targetId: targetMemberId,
                        type: isMother ? 'mother' : 'father'
                    };
                }
            }

            await linkFamilyMembers(user.uid, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    if (!baseMember) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Qarindoshlik bog'lash">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-gray-400 text-sm">Tanlangan shaxs:</p>
                    <h3 className="text-xl font-bold text-white">{baseMember.name}</h3>
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { setRelationType('father'); setStep(2); }}
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aura-cyan transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">👴</span>
                            <span className="text-sm font-bold text-white">Otasi</span>
                            <span className="text-[10px] text-gray-500">Mavjud shaxsni otasi deb belgilash</span>
                        </button>
                        <button
                            onClick={() => { setRelationType('mother'); setStep(2); }}
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aura-cyan transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">👵</span>
                            <span className="text-sm font-bold text-white">Onasi</span>
                            <span className="text-[10px] text-gray-500">Mavjud shaxsni onasi deb belgilash</span>
                        </button>
                        <button
                            onClick={() => { setRelationType('spouse'); setStep(2); }}
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aura-cyan transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">❤️</span>
                            <span className="text-sm font-bold text-white">Turmush o&apos;rtog&apos;i</span>
                            <span className="text-[10px] text-gray-500">Er yoki xotini</span>
                        </button>
                        <button
                            onClick={() => { setRelationType('son'); setStep(2); }} // Treating son/daughter generic as child
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aura-cyan transition-all flex flex-col items-center gap-2 group"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">👶</span>
                            <span className="text-sm font-bold text-white">Farzandi</span>
                            <span className="text-[10px] text-gray-500">Mavjud shaxsni farzand deb belgilash</span>
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-white font-bold">
                                {relationType === 'father' ? 'Otasi kim?' :
                                    relationType === 'mother' ? 'Onasi kim?' :
                                        relationType === 'spouse' ? 'Jufti kim?' : 'Farzandi kim?'}
                            </h4>
                            <button onClick={() => setStep(1)} className="text-xs text-aura-cyan hover:underline">Orqaga</button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {availableTargets.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">Boshqa a'zolar topilmadi.</p>
                            ) : availableTargets.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setTargetMemberId(m.id)}
                                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer border transition-all
                                        ${targetMemberId === m.id
                                            ? 'bg-aura-cyan/20 border-aura-cyan'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'}
                                    `}
                                >
                                    {(m.avatar || (m as Ancestor).photo) ? (
                                        <img src={m.avatar || (m as Ancestor).photo} className="w-8 h-8 rounded-full bg-gray-700 object-cover" alt={m.name} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">👤</div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-white">{m.name}</p>
                                        <p className="text-[10px] text-gray-400">{m.role}</p>
                                    </div>
                                    {targetMemberId === m.id && <span className="ml-auto text-aura-cyan">✅</span>}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!targetMemberId || loading}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2
                                ${!targetMemberId ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-aura-cyan text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]'}
                            `}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Bog'lash</span>
                                    <span>🔗</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
