"use client";
import React from 'react';
import { FamilyMember } from '@/services/familyService';
import Link from 'next/link';

interface MiniTreeProps {
    currentMember: FamilyMember;
    allMembers: FamilyMember[];
}

export default function MiniTree({ currentMember, allMembers }: MiniTreeProps) {
    // Find immediate family
    const father = currentMember.fatherId
        ? allMembers.find(m => m.id === currentMember.fatherId)
        : null;
    const mother = currentMember.motherId
        ? allMembers.find(m => m.id === currentMember.motherId)
        : null;
    const spouse = currentMember.spouseId
        ? allMembers.find(m => m.id === currentMember.spouseId)
        : null;
    const children = allMembers.filter(m =>
        m.fatherId === currentMember.id || m.motherId === currentMember.id
    );

    // If no immediate family, don't show mini tree
    if (!father && !mother && !spouse && children.length === 0) {
        return null;
    }

    const MemberCard = ({ member, relation }: { member: FamilyMember, relation: string }) => (
        <Link
            href={`/dashboard/family?id=${member.id}`}
            className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        >
            <div className="text-3xl mb-1">{member.role.includes('Father') || member.role.includes('Grandfather') ? '👨' : member.role.includes('Mother') || member.role.includes('Grandmother') ? '👩' : member.role.includes('Son') || member.role.includes('Brother') ? '👦' : '👧'}</div>
            <div className="text-xs font-bold text-white text-center">{member.fullName || member.name}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide">{relation}</div>
        </Link>
    );

    return (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-bold text-aura-purple uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🌳</span> Yaqin Oila
            </h3>

            <div className="space-y-4">
                {/* Parents Row */}
                {(father || mother) && (
                    <div>
                        <div className="text-[10px] text-gray-600 uppercase mb-2">Ota-Ona</div>
                        <div className="grid grid-cols-2 gap-3">
                            {father && <MemberCard member={father} relation="Ota" />}
                            {mother && <MemberCard member={mother} relation="Ona" />}
                        </div>
                    </div>
                )}

                {/* Current Member (Center) */}
                <div className="flex justify-center">
                    <div className="p-4 rounded-xl bg-aura-cyan/10 border-2 border-aura-cyan flex flex-col items-center min-w-[120px]">
                        <div className="text-4xl mb-1">👤</div>
                        <div className="text-sm font-bold text-aura-cyan text-center">{currentMember.fullName || currentMember.name}</div>
                        <div className="text-[9px] text-aura-cyan/70 uppercase">{currentMember.role}</div>
                    </div>
                </div>

                {/* Spouse */}
                {spouse && (
                    <div>
                        <div className="text-[10px] text-gray-600 uppercase mb-2">Turmush O'rtog'i</div>
                        <div className="flex justify-center">
                            <MemberCard member={spouse} relation="Turmush O'rtog'i" />
                        </div>
                    </div>
                )}

                {/* Children */}
                {children.length > 0 && (
                    <div>
                        <div className="text-[10px] text-gray-600 uppercase mb-2">Farzandlar</div>
                        <div className={`grid ${children.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                            {children.map(child => (
                                <MemberCard key={child.id} member={child} relation={child.role} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
