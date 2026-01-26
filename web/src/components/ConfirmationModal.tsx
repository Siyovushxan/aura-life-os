"use client";
import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Ha, tasdiqlayman",
    cancelText = "Bekor qilish",
    type = 'info'
}: ConfirmationModalProps) {
    const getAccentColor = () => {
        switch (type) {
            case 'danger': return 'bg-aura-red shadow-aura-red/20 text-white';
            case 'warning': return 'bg-aura-gold shadow-aura-gold/20 text-black';
            default: return 'bg-aura-cyan shadow-aura-cyan/20 text-black';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return '⚠️';
            case 'warning': return '🔔';
            default: return 'ℹ️';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            className="max-w-md"
        >
            <div className="text-center space-y-6 pt-4">
                <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner ${getAccentColor().replace('bg-', 'bg-opacity-20 ')} border border-white/5`}>
                    {getIcon()}
                </div>

                <div>
                    <h3 className="text-2xl font-display font-black text-white tracking-tight mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed px-4">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${getAccentColor()}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
