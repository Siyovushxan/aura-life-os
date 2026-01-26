"use client";
import React from 'react';
import { Ancestor, FamilyMember } from '@/services/familyService';

interface SmartTreeProps {
    ancestors: Ancestor[];
    familyMembers: FamilyMember[];
    onMemberClick?: (member: any) => void;
    mode?: 'full' | 'immediate';
    centerMemberId?: string;
}

const MemberCard = ({ person, onClick, isSingle }: { person: any, onClick: any, isSingle?: boolean }) => {
    const role = (person.role || "A'zo").toLowerCase();
    const isDeceased = person.status === 'Deceased';

    return (
        <div
            onClick={() => onClick(person)}
            className={`w-40 p-3 rounded-2xl bg-black/60 border border-white/10 hover:border-aura-gold transition-all cursor-pointer group relative flex flex-col items-center text-center shadow-xl ${isSingle ? 'scale-95 opacity-90 hover:scale-100 hover:opacity-100' : ''}`}
        >
            <div className={`w-14 h-14 rounded-full bg-white/5 mb-2 overflow-hidden border-2 transition-colors ${isDeceased ? 'border-gray-600 grayscale' : 'border-white/5 group-hover:border-aura-gold'}`}>
                {person.photo ? (
                    <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-zinc-800 to-black`}>
                        {role.includes('mother') || role.includes('buvi') ? '👵' :
                            role.includes('father') || role.includes('bobo') ? '👴' :
                                role.includes('son') ? '👦' :
                                    role.includes('daughter') ? '👧' : '👤'}
                    </div>
                )}
            </div>
            <h3 className="text-xs font-bold text-white leading-tight mb-0.5 transition-colors group-hover:text-aura-cyan line-clamp-1">{person.name}</h3>
            <p className="text-[9px] text-aura-gold mb-1 font-bold tracking-wider uppercase opacity-80">
                {person.role || "A'zo"}
            </p>

            <div className="text-[8px] text-gray-500 font-mono mt-1">
                {person.birth ? new Date(person.birth).getFullYear() : (person.birthDate ? new Date(person.birthDate).getFullYear() : '????')}
                {person.death ? ` - ${new Date(person.death).getFullYear()}` : ''}
            </div>

            {!isSingle && !isDeceased && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-aura-gold animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.5)]"></div>}
        </div>
    );
};

export default function SmartTree({ ancestors, familyMembers, onMemberClick, mode = 'full', centerMemberId }: SmartTreeProps) {

    const getGeneration = (birthDate?: string) => {
        if (!birthDate) return 0;
        const year = new Date(birthDate).getFullYear();
        if (year >= 2000) return 0;
        if (year >= 1975) return 1;
        if (year >= 1950) return 2;
        return 3;
    };

    let displayMembers = [...ancestors, ...familyMembers as any];

    if (mode === 'immediate' && centerMemberId) {
        const center = displayMembers.find(m => m.id === centerMemberId);
        if (center) {
            displayMembers = displayMembers.filter(m =>
                m.id === centerMemberId ||
                m.id === center.fatherId ||
                m.id === center.motherId ||
                m.fatherId === centerMemberId ||
                m.motherId === centerMemberId ||
                m.spouseId === centerMemberId ||
                center.spouseId === m.id
            );
        }
    }

    const gens = mode === 'immediate' ? [3, 2, 1, 0, -1] : [3, 2, 1, 0]; // Support children gen if immediate

    // Adjust generation for children in immediate mode
    const processedMembers = displayMembers.map(m => {
        let g = getGeneration(m.birth || m.birthDate);
        if (mode === 'immediate' && centerMemberId) {
            const center = displayMembers.find(x => x.id === centerMemberId);
            if (center && (m.fatherId === centerMemberId || m.motherId === centerMemberId)) {
                g = -1; // Children generation
            }
        }
        return { ...m, displayGen: g };
    });

    return (
        <div className="relative w-full h-full flex flex-col items-center p-8 overflow-x-auto custom-scrollbar">
            {gens.map((gen) => {
                const genMembers = processedMembers.filter(m => m.displayGen === gen);
                if (genMembers.length === 0) return null;

                const couples: { m1: any, m2: any }[] = [];
                const singles: any[] = [];
                const processedIds = new Set<string>();

                genMembers.forEach(m => {
                    if (processedIds.has(m.id)) return;
                    if (m.spouseId) {
                        const spouse = genMembers.find(s => s.id === m.spouseId);
                        if (spouse) {
                            couples.push({ m1: m, m2: spouse });
                            processedIds.add(m.id);
                            processedIds.add(spouse.id);
                            return;
                        }
                    }
                    singles.push(m);
                    processedIds.add(m.id);
                });

                return (
                    <div key={gen} className="mb-16 w-full flex flex-col items-center">
                        <div className="mb-6 flex items-center gap-4 w-full opacity-40">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-aura-gold/50 px-3 py-0.5 rounded-full border border-white/5 bg-white/5">
                                {gen === 3 ? 'Katta Bobolar' : gen === 2 ? 'Bobo-Buvilar' : gen === 1 ? 'Ota-onalar' : gen === 0 ? 'Asosiy Avlod' : 'Farzandlar'}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                        </div>

                        <div className="flex justify-center flex-wrap gap-10">
                            {couples.map((pair, idx) => (
                                <div key={`pair-${idx}`} className="flex flex-col items-center relative">
                                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                                        <MemberCard person={pair.m1} onClick={onMemberClick} />
                                        <div className="w-6 h-px bg-aura-gold/30 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]">❤️</div>
                                        </div>
                                        <MemberCard person={pair.m2} onClick={onMemberClick} />
                                    </div>
                                    <div className="absolute -bottom-10 left-1/2 w-px h-10 bg-gradient-to-b from-aura-gold/30 to-transparent"></div>
                                </div>
                            ))}

                            {singles.map((m, idx) => (
                                <div key={`single-${idx}`} className="relative flex flex-col items-center">
                                    <MemberCard person={m} onClick={onMemberClick} isSingle={true} />
                                    {gen !== (mode === 'immediate' ? -1 : 0) && (
                                        <div className="absolute -bottom-10 left-1/2 w-px h-10 bg-white/10"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            <div className="mt-8 flex gap-6 opacity-30">
                <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-tighter text-gray-400 font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-aura-cyan"></div> Tirik
                </div>
                <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-tighter text-gray-400 font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div> O'tganlar
                </div>
            </div>
        </div>
    );
}
