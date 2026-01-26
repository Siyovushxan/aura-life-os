"use client";
import React from 'react';
import Modal from './Modal';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function HistoryModal({ isOpen, onClose, title, children }: HistoryModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-2xl max-h-[85vh] p-0" // Override generic padding/width if needed
        >
            {/* We can reuse the header style if we want, or rely on Modal's title. 
                 The generic Modal has a title prop but this one had a specific header style.
                 If we pass 'title' to Modal, it renders a simple <h2>.
                 The original had a nicer header. Let's keep the content custom but use Modal for wrapping.
             */}

            {/* If we pass title to Modal it renders it inside the padding. 
                 Since the original had a full-width header with border, we might want to pass 'title=""' to Modal
                 and render our own header inside children?
                 
                 Actually, the generic Modal has padding `p-8`. 
                 HistoryModal has `p-0` on container and specific padding on header/body.
                 
                 Let's adjust.
              */}
            {/* Resetting content to match structure */}
            <div className="flex flex-col h-full">
                {/* Header (re-implemented here because we want custom styling inside the modal content area) */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 -mx-8 -mt-8 mb-6 rounded-t-3xl">
                    <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                        <span>📜</span> {title}
                    </h2>
                    {/* Close button is already provided by Modal, but positioned absolute top-right. 
                         We can hide the Modal's close button or just use it. 
                         The standard Modal close button is fine.
                      */}
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </Modal>
    );
}
