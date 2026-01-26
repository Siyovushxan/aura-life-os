"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FamilyInviteProps {
    familyId?: string;
    onClose: () => void;
}

export default function FamilyInvite({ familyId, onClose }: FamilyInviteProps) {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    // Generate invite link (simplified - in production use Firebase Dynamic Links)
    const inviteCode = user ? btoa(`${user.uid}_${Date.now()}`).slice(0, 12) : 'DEMO123';
    const inviteLink = `https://aura-life-os.web.app/join?code=${inviteCode}`;

    // Simple QR code using Google Charts API (no dependency)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-black border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">👨‍👩‍👧‍👦 Oilaga Taklif</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Ushbu QR kodni yoki havolani oila a'zolaringizga yuboring.
                    </p>

                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                        <img
                            src={qrUrl}
                            alt="QR Code"
                            className="w-48 h-48"
                        />
                    </div>

                    {/* Invite Code */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 uppercase mb-1">Taklif Kodi</p>
                        <p className="text-2xl font-mono font-bold text-aura-cyan tracking-wider">{inviteCode}</p>
                    </div>

                    {/* Copy Link Button */}
                    <button
                        onClick={handleCopy}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${copied
                            ? 'bg-aura-green text-black'
                            : 'bg-aura-cyan text-black hover:scale-105'
                            }`}
                    >
                        {copied ? '✓ Nusxalandi!' : '📋 Havolani Nusxalash'}
                    </button>

                    {/* Info */}
                    <p className="text-xs text-gray-500 mt-4">
                        Havola 7 kun davomida amal qiladi.
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
