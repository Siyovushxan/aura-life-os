import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // For customized widths or styles
}

export default function Modal({ isOpen, onClose, title, children, className = "max-w-2xl" }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Scroll Locking Hook Logic
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';

            // Aggressive locking for dashboard container
            const dashboardMain = document.getElementById('dashboard-main') || document.querySelector('main');
            if (dashboardMain) {
                dashboardMain.style.setProperty('overflow', 'hidden', 'important');
            }

            window.addEventListener('keydown', handleEsc);
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';

            const dashboardMain = document.getElementById('dashboard-main') || document.querySelector('main');
            if (dashboardMain) {
                dashboardMain.style.removeProperty('overflow');
                // Fallback reset just in case
                dashboardMain.style.overflow = '';
            }

            window.removeEventListener('keydown', handleEsc);
        }
        return () => {
            // Safe cleanup
            if (typeof document !== 'undefined') {
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                const dashboardMain = document.getElementById('dashboard-main') || document.querySelector('main');
                if (dashboardMain) {
                    dashboardMain.style.removeProperty('overflow');
                    dashboardMain.style.overflow = '';
                }
            }

            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', handleEsc);
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
                onClick={onClose}
            ></div>

            {/* Content - Viewport Centered with Internal Scroll */}
            <div
                className={`relative w-full ${className} bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl animate-scale-up z-10 flex flex-col max-h-[85vh] pointer-events-auto m-auto`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {title && (
                    <h2 className="text-2xl font-bold text-white mb-6 px-8 pt-8 flex-shrink-0">{title}</h2>
                )}

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 pt-12">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
