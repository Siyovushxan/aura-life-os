"use client";
import React from 'react';
import Modal from './Modal';
import { useLanguage } from '@/context/LanguageContext';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    const { t } = useLanguage();

    const getTypeStyles = () => {
        switch (type) {
            case 'success': return 'text-aura-green border-aura-green/20 bg-aura-green/5';
            case 'warning': return 'text-aura-gold border-aura-gold/20 bg-aura-gold/5';
            case 'danger': return 'text-aura-red border-aura-red/20 bg-aura-red/5';
            default: return 'text-aura-cyan border-aura-cyan/20 bg-aura-cyan/5';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'danger': return '🚫';
            default: return 'ℹ️';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className={`p-6 rounded-2xl border ${getTypeStyles()} flex items-start gap-4`}>
                    <span className="text-2xl mt-1">{getIcon()}</span>
                    <p className="text-gray-200 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-95 bg-white/10 hover:bg-white/20 text-white border border-white/10`}
                    >
                        {t.common.done || 'Yopish'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AlertModal;
