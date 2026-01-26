"use client";
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FamilyMember, Ancestor } from '@/services/familyService';

export interface MemberNodeData {
    member: FamilyMember | Ancestor;
    isCenter?: boolean;
    onEdit?: (id: string) => void;
    onAddRelative?: (id: string) => void;
}

const MemberNode = ({ data, selected }: NodeProps<MemberNodeData>) => {
    const { member, isCenter, onEdit, onAddRelative } = data;
    const role = (member.role || "A'zo").toLowerCase();
    const isDeceased = (member as any).status === 'Deceased';

    const handleStyle = { background: '#555', width: 8, height: 8, borderRadius: '50%' };

    return (
        <div className={`relative w-48 transition-all duration-300 ${selected ? 'scale-105 z-50' : ''}`}>
            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} id="top" style={{ ...handleStyle, top: -4 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -4 }} />
            <Handle type="source" position={Position.Left} id="left" style={{ ...handleStyle, left: -4, background: '#D4AF37' }} />
            <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -4, background: '#D4AF37' }} />

            <div className={`
                flex flex-col items-center p-3 rounded-2xl border backdrop-blur-md shadow-2xl
                ${isCenter ? 'bg-aura-cyan/10 border-aura-cyan/50' : 'bg-black/60 border-white/10'}
                ${selected ? 'border-aura-gold ring-2 ring-aura-gold/20' : 'hover:border-white/30'}
                transition-all cursor-pointer
            `}>

                {/* Avatar */}
                <div className={`relative w-16 h-16 rounded-full border-2 mb-2 overflow-hidden bg-white/5
                    ${isDeceased ? 'border-gray-600 grayscale' : isCenter ? 'border-aura-cyan' : 'border-white/20'}
                `}>
                    {(member as any).photo ? (
                        <img src={(member as any).photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                            {role.includes('mother') || role.includes('buvi') || role.includes('ayol') || role.includes('amma') || role.includes('xola') ? '👵' :
                                role.includes('father') || role.includes('bobo') || role.includes('erkak') || role.includes('tog\'a') || role.includes('amaki') ? '👴' :
                                    role.includes('son') || role.includes('o\'g\'il') ? '👦' :
                                        role.includes('daughter') || role.includes('qiz') ? '👧' : '👤'}
                        </div>
                    )}

                    {/* Status Indicator */}
                    {!isDeceased && (
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black
                            ${(member as any).mood === 'happy' ? 'bg-aura-green' :
                                (member as any).mood === 'stressed' ? 'bg-aura-red' : 'bg-aura-blue'}
                         `} title={(member as any).mood}></div>
                    )}
                </div>

                {/* Info */}
                <div className="text-center w-full">
                    <h3 className="text-sm font-bold text-white truncate px-2">{member.name}</h3>
                    <p className="text-[10px] text-aura-gold/80 uppercase tracking-wider font-bold truncate">
                        {member.role || "A'zo"}
                    </p>

                    <div className="text-[9px] text-gray-500 font-mono mt-1">
                        {(member as any).birth ? new Date((member as any).birth).getFullYear() : ((member as any).birthDate ? new Date((member as any).birthDate).getFullYear() : '????')}
                        {(member as any).death ? ` - ${new Date((member as any).death).getFullYear()}` : ''}
                    </div>
                </div>

                {/* Actions (visible when selected or clustered) */}
                {selected && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 p-1.5 rounded-lg border border-white/10 shadow-xl backdrop-blur-xl z-50">
                        <button onClick={() => onAddRelative?.(member.id)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-xs text-white" title="Add Relative">
                            ➕
                        </button>
                        <button onClick={() => onEdit?.(member.id)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-xs text-white" title="Edit">
                            ✏️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(MemberNode);
