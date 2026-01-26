"use client";
import React, { useState } from 'react';
import { settingsData } from '@/data/settingsMock';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';
import HistoryModal from '@/components/HistoryModal';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, createUserProfile } from '@/services/userService';
import { useEffect } from 'react';






export default function SettingsDashboard() {
    const { language, setLanguage, t } = useLanguage();
    const { user } = useAuth();
    const [toggles, setToggles] = useState({
        dailyBriefing: true,
        focusAlerts: true,
        familyUpdates: false
    });
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Load profile from Firestore
    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(p => {
                if (p) {
                    setProfile(p);
                    if (p.language && p.language !== language) {
                        setLanguage(p.language);
                    }
                    if (p.settings?.notifications) {
                        setToggles(p.settings.notifications);
                    }
                } else {
                    // Create defaults if not exists
                    createUserProfile(user.uid, { email: user.email!, language });
                }
            });
        }
    }, [user]);

    // Save language change
    const changeLanguage = (code: 'en' | 'uz' | 'ru') => {
        setLanguage(code);
        if (user) {
            updateUserProfile(user.uid, { language: code });
        }
    };

    const handleToggle = (key: keyof typeof toggles) => {
        const newToggles = { ...toggles, [key]: !toggles[key] };
        setToggles(newToggles);
        if (user) {
            updateUserProfile(user.uid, {
                settings: { notifications: newToggles }
            });
        }
    };

    const showMessage = (msg: string) => {
        setAlertMessage(msg);
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const LangCard = ({ code, label, flag }: { code: 'en' | 'uz' | 'ru', label: string, flag: string }) => (
        <button
            onClick={() => changeLanguage(code)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all w-full text-left
        ${language === code
                    ? 'bg-aura-cyan/10 border-aura-cyan text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }
      `}
        >
            <span className="text-2xl">{flag}</span>
            <span className="font-bold">{label}</span>
            {language === code && <span className="ml-auto text-aura-cyan">✓</span>}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10 relative">

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={t.settings.securityLog}
            >
                <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between p-2 border-b border-white/10">
                        <span className="text-gray-400">{t.settings.logType}</span>
                        <span className="text-gray-400">{t.settings.logDevice}</span>
                        <span className="text-gray-400">{t.settings.logTime}</span>
                    </div>
                    {[
                        { type: t.settings.logLogin, device: t.settings.logWebDashboard, time: t.common.today + ' ' + new Date().getHours() + ':' + new Date().getMinutes() },
                    ].map((log, i) => (
                        <div key={i} className="flex justify-between p-2 hover:bg-white/5 rounded">
                            <span className="text-aura-cyan">{log.type}</span>
                            <span className="text-white">{log.device}</span>
                            <span className="text-gray-500">{log.time}</span>
                        </div>
                    ))}
                </div>
            </HistoryModal>

            {/* ALERT TOAST */}
            {alertMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-aura-green text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_#00FF94] z-50 animate-bounce">
                    {alertMessage}
                </div>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">{t.settings.title}</h1>
                    <p className="text-xs text-gray-500 font-mono mb-2">{t.settings.currentLocale} {language.toUpperCase()}</p>
                </div>
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                    title={t.settings.securityLog}
                >
                    🛡️
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN */}
                <div className="space-y-8">

                    {/* Profile Card */}
                    <div className="p-8 rounded-[3rem] bg-gradient-to-br from-white/5 to-black border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-aura-gold to-yellow-600 text-black font-bold text-xs uppercase tracking-widest shadow-lg shadow-aura-gold/20">
                                {profile?.plan || t.settings.freePlan}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-aura-purple to-aura-cyan">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black relative flex items-center justify-center text-4xl font-bold text-gray-500">
                                    {user?.photoURL ? (
                                        <Image src={user.photoURL} alt="Avatar" width={96} height={96} />
                                    ) : (
                                        <span>{user?.email?.[0].toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{user?.displayName || user?.email?.split('@')[0] || t.common.user || 'User'}</h2>
                                <p className="text-gray-500">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 text-sm text-gray-400 border-t border-white/10 pt-6">
                            <span>{t.settings.profile} {profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : t.settings.justNow}</span>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">{t.settings.lang}</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <LangCard code="uz" label="O'zbekcha" flag="🇺🇿" />
                            <LangCard code="ru" label="Русский" flag="🇷🇺" />
                            <LangCard code="en" label="English" flag="🇺🇸" />
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* Notifications */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">{t.settings.notifs}</h3>
                        <div className="space-y-6">

                            {/* Toggle Item */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{t.settings.dailyBrief}</p>
                                    <p className="text-xs text-gray-500">{t.settings.dailyBriefDesc}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('dailyBriefing')}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors ${toggles.dailyBriefing ? 'bg-aura-green' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${toggles.dailyBriefing ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{t.settings.focusAlerts}</p>
                                    <p className="text-xs text-gray-500">{t.settings.focusAlertsDesc}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('focusAlerts')}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors ${toggles.focusAlerts ? 'bg-aura-green' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${toggles.focusAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{t.settings.familyUpdates}</p>
                                    <p className="text-xs text-gray-500">{t.settings.familyUpdatesDesc}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('familyUpdates')}
                                    className={`w-14 h-8 rounded-full p-1 transition-colors ${toggles.familyUpdates ? 'bg-aura-green' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${toggles.familyUpdates ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Data & System */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">{t.settings.system}</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => showMessage(t.settings.exportSuccess)}
                                className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>📤</span> {t.settings.export}
                            </button>
                            <button
                                onClick={() => showMessage(t.settings.resetScheduled)}
                                className="w-full py-3 rounded-xl border border-aura-red/30 text-aura-red hover:bg-aura-red/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <span>🗑️</span> {t.settings.reset}
                            </button>
                        </div>
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-600">AURA v1.0.0 (Build 2026)</p>
                            <p className="text-[10px] text-gray-700 mt-1">Powered by Antigravity AI</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
