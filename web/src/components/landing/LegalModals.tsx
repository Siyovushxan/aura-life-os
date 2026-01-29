"use client";
import React from 'react';
import Modal from '../Modal';

interface LegalModalsProps {
    type: 'privacy' | 'terms' | 'cookies' | null;
    onClose: () => void;
    translations: any;
}

export default function LegalModals({ type, onClose, translations }: LegalModalsProps) {
    if (!type) return null;

    const lt = translations.footer.legal;

    const renderContent = () => {
        let title = "";
        let content = "";

        switch (type) {
            case 'privacy':
                title = lt.privacy_title;
                content = lt.privacy_content;
                break;
            case 'terms':
                title = lt.terms_title;
                content = lt.terms_content;
                break;
            case 'cookies':
                title = lt.cookies_title;
                content = lt.cookies_content;
                break;
        }

        return (
            <div className="py-8 max-w-2xl mx-auto space-y-8 text-center">
                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">{title}</h2>
                <div className="w-20 h-1 bg-aura-cyan mx-auto rounded-full"></div>
                <p className="text-gray-300 text-lg font-light leading-relaxed italic">{content}</p>
            </div>
        );
    };

    return (
        <Modal isOpen={!!type} onClose={onClose} title="" className="max-w-2xl">
            {renderContent()}
        </Modal>
    );
}
