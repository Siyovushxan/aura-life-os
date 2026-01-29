"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="absolute top-8 right-8 z-30 flex gap-2">
            {[
                { code: 'en', label: 'EN' },
                { code: 'uz', label: 'UZ' },
                { code: 'ru', label: 'RU' }
            ].map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as any)}
                    className={`
                        px-3 py-1 rounded-full text-[10px] font-bold tracking-widest transition-all
                        ${language === lang.code
                            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                            : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                        }
                    `}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};
