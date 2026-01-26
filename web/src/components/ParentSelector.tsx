"use client";
import React from 'react';
import { FamilyMember } from '@/services/familyService';

interface ParentSelectorProps {
    label: string;
    members: FamilyMember[];
    selectedId?: string;
    onChange: (memberId: string) => void;
    gender?: 'male' | 'female';
    placeholder?: string;
}

export default function ParentSelector({
    label,
    members,
    selectedId,
    onChange,
    gender,
    placeholder = "Tanlang..."
}: ParentSelectorProps) {
    // Filter members by gender if specified
    const filteredMembers = gender
        ? members.filter(m => {
            const maleRoles = ['Father', 'Son', 'Grandfather', 'Brother', 'Uncle'];
            const femaleRoles = ['Mother', 'Daughter', 'Grandmother', 'Sister', 'Aunt'];

            if (gender === 'male') {
                return maleRoles.some(role => m.role.includes(role));
            } else {
                return femaleRoles.some(role => m.role.includes(role));
            }
        })
        : members;

    return (
        <div>
            <label className="text-xs text-aura-cyan font-bold uppercase block mb-1">
                {label}
            </label>
            <select
                value={selectedId || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-2.5 outline-none focus:border-aura-cyan text-sm"
            >
                <option value="">{placeholder}</option>
                {filteredMembers.map(member => (
                    <option key={member.id} value={member.id}>
                        {member.fullName || member.name} ({member.role})
                    </option>
                ))}
            </select>
            {filteredMembers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                    {gender === 'male' ? 'Erkak a\'zolar yo\'q' : gender === 'female' ? 'Ayol a\'zolar yo\'q' : 'A\'zolar yo\'q'}
                </p>
            )}
        </div>
    );
}
