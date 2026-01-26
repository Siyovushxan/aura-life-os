"use client";
import React, { useState, useRef } from 'react';
import { transcribeAudio, parseCommand } from '@/services/groqService';

interface VoiceInputProps {
    module: 'finance' | 'health' | 'mental' | 'mind' | 'focus' | 'tasks' | 'food' | 'interests' | 'family';
    onCommand: (data: any) => void;
    onTranscript?: (text: string) => void;
    className?: string;
    color?: 'purple' | 'cyan' | 'green' | 'gold' | 'red' | 'blue';
}

export default function VoiceInput({ module, onCommand, onTranscript, className = '', color = 'purple' }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ... rest of state stays same ...
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'confirm_redirect';
        message: string;
        redirectModule?: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Color mappings for reliable Tailwind generation
    const colorStyles = {
        purple: {
            glow: 'bg-aura-purple',
            inner: 'bg-aura-purple/20 border-aura-purple/30 text-aura-purple hover:bg-aura-purple hover:border-aura-purple hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        },
        cyan: {
            glow: 'bg-aura-cyan',
            inner: 'bg-aura-cyan/20 border-aura-cyan/30 text-aura-cyan hover:bg-aura-cyan hover:border-aura-cyan hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]',
        },
        green: {
            glow: 'bg-aura-green',
            inner: 'bg-aura-green/20 border-aura-green/30 text-aura-green hover:bg-aura-green hover:border-aura-green hover:shadow-[0_0_20px_rgba(0,255,148,0.4)]',
        },
        gold: {
            glow: 'bg-aura-gold',
            inner: 'bg-aura-gold/20 border-aura-gold/30 text-aura-gold hover:bg-aura-gold hover:border-aura-gold hover:shadow-[0_0_20px_rgba(255,214,0,0.4)]',
        },
        red: {
            glow: 'bg-aura-red',
            inner: 'bg-aura-red/20 border-aura-red/30 text-aura-red hover:bg-aura-red hover:border-aura-red hover:shadow-[0_0_20px_rgba(255,46,46,0.4)]',
        },
        blue: {
            glow: 'bg-aura-blue',
            inner: 'bg-aura-blue/20 border-aura-blue/30 text-aura-blue hover:bg-aura-blue hover:border-aura-blue hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        }
    };

    const currentStyle = colorStyles[color] || colorStyles.purple;

    const startRecording = async () => {
        // ... same implementation ...
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                setIsProcessing(true);

                try {
                    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    // @ts-ignore
                    const langCode = window.localStorage.getItem('language') === 'ru' ? 'ru' : window.localStorage.getItem('language') === 'uz' ? 'uz' : 'en';
                    const text = await transcribeAudio(audioBlob, langCode, module);

                    const textValue = text || "";
                    if (onTranscript) onTranscript(textValue);

                    if (textValue.startsWith("ERROR:") || textValue === "Audio system offline." || !textValue) {
                        const errorMsg = textValue.startsWith("ERROR:") ? textValue.replace("ERROR: ", "") : (textValue === "Audio system offline." ? "Ovoz tizimi oflayn." : "Ovoz tushunarsiz.");
                        setModalState({ isOpen: true, type: 'error', message: errorMsg });
                        setIsProcessing(false);
                        return;
                    }

                    const command = await parseCommand(text, module);
                    console.log('AI Logic:', command);

                    if (command.module === 'error' || command.module === 'unknown') {
                        setModalState({ isOpen: true, type: 'error', message: command.confirmation_message || "Tushunarsiz buyruq." });
                    }
                    else if (command.action === 'wrong_module') {
                        setModalState({
                            isOpen: true,
                            type: 'confirm_redirect',
                            message: command.confirmation_message,
                            redirectModule: command.suggested_module
                        });
                    }
                    else if (command.action === 'clarify') {
                        setModalState({ isOpen: true, type: 'error', message: command.confirmation_message || "Ma'lumotlar yetarli emas." });
                    }
                    else {
                        onCommand(command);
                        setModalState({ isOpen: true, type: 'success', message: command.confirmation_message || "Bajarildi!" });
                    }

                } catch (error) {
                    setModalState({ isOpen: true, type: 'error', message: "Tizim xatoligi." });
                    console.error('Voice processing error:', error);
                } finally {
                    setIsProcessing(false);
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (error) {
            setModalState({ isOpen: true, type: 'error', message: "Mikrofonga ruxsat yo'q!" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const closeModal = () => setModalState({ ...modalState, isOpen: false });

    return (
        <>
            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isProcessing}
                className={`relative group flex items-center justify-center transition-all duration-300 w-12 h-12 ${className} ${isRecording ? 'scale-110' : 'hover:scale-110 active:scale-95'} disabled:opacity-50`}
            >
                {/* Glow Effect */}
                <div className={`absolute inset-[-4px] rounded-[1.5rem] blur-xl transition-all duration-500 opacity-0 group-hover:opacity-40 ${isRecording ? `bg-aura-red opacity-60 animate-pulse` : `${currentStyle.glow}`}`}></div>

                {/* Button Body - Premium Squircle */}
                <div className={`relative z-10 w-full h-full rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-2xl overflow-hidden ${isRecording
                    ? 'bg-aura-red border-aura-red text-white shadow-[0_0_30px_rgba(255,46,46,0.4)]'
                    : `${currentStyle.inner} hover:text-black`}`}>

                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <div className="relative">
                            {/* Listening Wave Animation */}
                            {isRecording && (
                                <div className="absolute inset-0 -m-4 flex items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 bg-white/20 rounded-full animate-ping opacity-20"></div>
                                </div>
                            )}
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-20">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                        </div>
                    )}

                    {/* Glossy Overlay */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 pointer-events-none"></div>
                </div>
            </button>

            {/* FEEDBACK MODAL */}
            {modalState.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl ${modalState.type === 'success' ? 'bg-aura-green/20 text-aura-green' :
                                modalState.type === 'error' ? 'bg-aura-red/20 text-aura-red' :
                                    'bg-aura-gold/20 text-aura-gold'
                                }`}>
                                {modalState.type === 'success' ? '✓' : modalState.type === 'error' ? '✕' : '⚠️'}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {modalState.type === 'success' ? 'Muvaffaqiyatli' :
                                    modalState.type === 'error' ? 'Xatolik' : 'Diqqat'}
                            </h3>

                            <p className="text-gray-300 mb-6">{modalState.message}</p>

                            <div className="flex gap-3 w-full">
                                {modalState.type === 'confirm_redirect' ? (
                                    <>
                                        <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                            Bekor qilish
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/dashboard/${modalState.redirectModule}`}
                                            className="flex-1 py-3 rounded-xl bg-aura-cyan text-black font-bold hover:bg-aura-cyan/90 transition-colors"
                                        >
                                            O'tish
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={closeModal}
                                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                    >
                                        Yopish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
