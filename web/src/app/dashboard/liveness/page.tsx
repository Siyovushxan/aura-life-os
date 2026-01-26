"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function LivenessPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    // State
    const [isActive, setIsActive] = useState(true);
    const [threshold, setThreshold] = useState(24);
    const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
    const [newContact, setNewContact] = useState({ name: '', phone: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [lastCheckIn, setLastCheckIn] = useState<Date>(new Date());

    // Silent Mode State
    const [silentMode, setSilentMode] = useState({ enabled: false, from: '23:00', to: '07:00' });
    const [activityLog, setActivityLog] = useState<{ id: string; type: string; time: string }[]>([
        { id: '1', type: 'Manual Check-in', time: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', type: 'System Boot', time: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]);

    // Fetch user settings
    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            const docRef = doc(db, 'users', user.uid, 'settings', 'liveness');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsActive(data.isActive ?? true);
                setThreshold(data.threshold ?? 24);
                setContacts(data.contacts ?? []);
                setSilentMode(data.silentMode ?? { enabled: false, from: '23:00', to: '07:00' });
                if (data.activityLog) setActivityLog(data.activityLog);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'users', user.uid, 'settings', 'liveness');
            await setDoc(docRef, {
                isActive,
                threshold,
                contacts,
                silentMode,
                activityLog,
                lastUpdate: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const addContact = () => {
        if (newContact.name && newContact.phone) {
            setContacts([...contacts, newContact]);
            setNewContact({ name: '', phone: '' });
            // Log activity
            setActivityLog([{
                id: Date.now().toString(),
                type: `Updated Contacts: +${newContact.name}`,
                time: new Date().toISOString()
            }, ...activityLog]);
        }
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    // Sub-components
    const PulseVisualizer = () => (
        <div className="absolute top-0 right-0 p-12 overflow-hidden pointer-events-none opacity-20">
            <svg width="200" height="60" viewBox="0 0 200 60" className="stroke-aura-cyan fill-none">
                <motion.path
                    d="M0 30 L40 30 L50 10 L60 50 L70 30 L100 30 L110 5 L120 55 L130 30 L170 30 L180 20 L190 40 L200 30"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{
                        pathLength: [0, 1],
                        pathOffset: [1, 0],
                        opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </svg>
        </div>
    );

    return (
        <div className="space-y-8 pb-12 relative overflow-hidden">
            <PulseVisualizer />

            {/* Header section with Premium Aesthetic */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-4">
                        <span className="text-aura-cyan animate-pulse">💓</span>
                        {t.liveness_section.title}
                    </h1>
                    <p className="text-gray-400 font-light max-w-2xl text-lg leading-relaxed">
                        {t.liveness_section.desc}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-10 py-4 bg-aura-purple text-white rounded-2xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-aura-purple/20 disabled:opacity-50"
                >
                    {isSaving ? '...' : t.liveness_section.cta}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* Status & Timing Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">System Status</h3>

                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-aura-green' : 'bg-aura-red'} animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
                                <span className="text-2xl font-bold text-white uppercase italic tracking-tight">
                                    {isActive ? 'Active Mode' : 'Disabled'}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`w-16 h-8 rounded-full transition-all relative ${isActive ? 'bg-aura-green' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Inactivity Threshold</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[24, 48].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setThreshold(h)}
                                        className={`py-4 rounded-2xl font-bold border transition-all ${threshold === h ? 'bg-aura-cyan border-aura-cyan text-black' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}
                                    >
                                        {h} HOURS
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Silent Mode Integration */}
                        <div className="mt-12 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.liveness_section.silent_mode}</h4>
                                    <p className="text-xs text-gray-500">{t.liveness_section.silent_mode_desc}</p>
                                </div>
                                <button
                                    onClick={() => setSilentMode({ ...silentMode, enabled: !silentMode.enabled })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${silentMode.enabled ? 'bg-aura-cyan' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${silentMode.enabled ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            {silentMode.enabled && (
                                <div className="flex items-center gap-4 mt-6">
                                    <input
                                        type="time"
                                        value={silentMode.from}
                                        onChange={(e) => setSilentMode({ ...silentMode, from: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-aura-cyan transition-all"
                                    />
                                    <span className="text-gray-500 text-xs">to</span>
                                    <input
                                        type="time"
                                        value={silentMode.to}
                                        onChange={(e) => setSilentMode({ ...silentMode, to: e.target.value })}
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-aura-cyan transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Trusted Contacts Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl"
                >
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">Trusted Contacts</h3>

                    <div className="space-y-4 mb-8 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {contacts.map((contact, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-aura-cyan/30 transition-all"
                                >
                                    <div>
                                        <p className="text-white font-bold">{contact.name}</p>
                                        <p className="text-xs text-gray-400">{contact.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => removeContact(i)}
                                        className="p-2 text-gray-500 hover:text-aura-red transition-all"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Contact Name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-cyan transition-all outline-none"
                            />
                            <input
                                type="text"
                                placeholder="+998 90 123 45 67"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-aura-cyan transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={addContact}
                            className="w-full py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
                        >
                            + Add Trusted Contact
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Activity History & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl"
                >
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">{t.liveness_section.activity_log}</h3>
                    <div className="space-y-4">
                        {activityLog.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-aura-cyan/50"></div>
                                    <span className="text-sm text-gray-300">{log.type}</span>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono">
                                    {new Date(log.time).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-8 rounded-[2.5rem] bg-gradient-to-br from-aura-cyan/10 to-aura-purple/10 border border-white/10 flex flex-col justify-center text-center space-y-4"
                >
                    <div className="w-12 h-12 mx-auto rounded-full bg-aura-cyan/20 flex items-center justify-center text-aura-cyan">ℹ️</div>
                    <h4 className="text-lg font-bold text-white italic uppercase tracking-tighter">System Intelligence</h4>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                        AURA algorithms monitor your heartbeat across the system. If you become unreachable, we ensure your loved ones are informed instantly.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
