"use client";
import React, { useState, useEffect } from 'react';
import HistoryModal from '@/components/HistoryModal';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import VoiceInput from '@/components/VoiceInput';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { getFoodLog, seedFoodData, removeMeal, addMeal, FoodDayLog, Meal } from '@/services/foodService';
import { analyzeImage, getFoodLogInsight } from '@/services/groqService';
import { getHealthData } from '@/services/healthService';
import { getInterestsData } from '@/services/interestsService';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import AlertModal from '@/components/AlertModal';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';
import { getLocalTodayStr } from '@/lib/dateUtils';

export default function FoodDashboard() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { clearNotification } = useNotifications();

    useEffect(() => {
        clearNotification('food');
        // Debug: Check Backend Health (Optional)
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
            fetch('http://127.0.0.1:5001/aura-f1d36/us-central1/healthCheck')
                .then(res => res.json())
                .then(data => {
                    console.log("Backend Health:", data);
                    if (data.keys && (!data.keys.IMAGE && !data.keys.FOOD && !data.keys.MAIN)) {
                        triggerAlert("DIQQAT: API Kalitlar Yo'q", "Backend tizimida Groq API kalitlari topilmadi. Iltimos .env faylni tekshiring.", "danger");
                    }
                })
                .catch(err => console.error("Health Check Failed:", err));
        }
    }, []);

    const [log, setLog] = useState<FoodDayLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    // Removed showAdvice automated state
    const [aiAdvice, setAiAdvice] = useState<any>(null); // Changed to any to support object structure
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getLocalTodayStr());
    const [isArchived, setIsArchived] = useState(false);

    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const triggerAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        const todayStr = getLocalTodayStr();
        setIsArchived(selectedDate !== todayStr);
    }, [selectedDate]);

    const [aiLoading, setAiLoading] = useState(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleVoiceCommand = async (command: any) => {
        if (!user || !log || isArchived) return;
        const today = getLocalTodayStr();
        const { action, data: cmdData } = command;

        if (action === 'log') {
            const calories = cmdData?.calories;
            const items = cmdData?.items || [];
            const mealName = items.join(', ') || cmdData?.meal || t.food.mealQuick;

            if (calories) {
                const newMeal: Meal = {
                    id: Date.now().toString(),
                    name: mealName,
                    calories: Number(calories),
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: cmdData?.meal || t.food.mealSnack
                };

                await addMeal(user.uid, today, newMeal);
                const updatedLog = await getFoodLog(user.uid, today);
                if (updatedLog) setLog(updatedLog);
            }
        }
    };

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getFoodLog(user.uid, selectedDate).then(data => {
            if (data) {
                setLog(data);
                setLoading(false);
            } else {
                seedFoodData(user.uid, selectedDate).then(newData => {
                    setLog(newData);
                    setLoading(false);
                });
            }
        });
    }, [user?.uid, selectedDate]);

    const handleDeleteMeal = async (meal: Meal) => {
        if (!user || !log || isArchived) return;
        const newSummary = { ...log.summary };
        newSummary.calories.current -= meal.calories;
        newSummary.protein.current -= meal.protein;
        newSummary.carbs.current -= meal.carbs;
        newSummary.fat.current -= meal.fat;

        const newMeals = log.meals.filter(m => m.id !== meal.id);
        setLog({ ...log, summary: newSummary, meals: newMeals });
        await removeMeal(user.uid, selectedDate, meal);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || isArchived) return;

        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setPreviewImage(base64);
            setIsScanning(true);
            setScanResult(null);
            setShowConfirm(false);

            const [health, interests] = await Promise.all([
                getHealthData(user.uid, selectedDate),
                getInterestsData(user.uid)
            ]);

            try {
                const result = await analyzeImage(base64, language, {
                    biometrics: health?.biometrics,
                    interests: interests?.hobbies.map(h => h.name)
                });

                if (result && result.name) {
                    setScanResult(result);
                    setShowConfirm(true);

                    // Client-side advice "healing" if AI returns too short strings like "Go"
                    let finalAdvice = result.advice || "";
                    if (finalAdvice.length < 10) {
                        const goalText = (result.calories < 500) ? "ideal kognitiv va jismoniy energiya muvozanatini saqlashga yordam beradi." : "metabolik yukni oshirishi mumkin, biroq energiya zaxirasi uchun xizmat qiladi.";
                        finalAdvice = `AURA Tahlili: Ushbu taomni iste'mol qilish ${result.name} tarkibidagi elementlar orqali ${goalText}`;
                    }

                    if (result.advice) {
                        setAiAdvice({
                            ...result,
                            title: result.name || "Taom Tahlili",
                            insight: finalAdvice,
                            optimization: finalAdvice,
                            vitalityScore: result.vitalityScore || 85, // Fallback if AI somehow misses it
                            status: 'success'
                        });
                    }
                } else {
                    console.error("Food Analysis Failed: Invalid result", result);
                    triggerAlert("Aniqlashda Xatolik", "Taomni aniqlab bo'lmadi. Iltimos, rasm tiniqroq ekanligiga ishonch hosil qiling va qayta urinib ko'ring.", "warning");
                }
            } catch (error) {
                console.error("Food Analysis System Error:", error);
                triggerAlert("Tizim Xatoligi", "Server bilan bog'lanishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.", "danger");
            }
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmMeal = async (shouldAdd: boolean) => {
        if (!user || !scanResult || isArchived) return;
        if (shouldAdd) {
            const newMeal: Meal = {
                id: Date.now().toString(),
                name: scanResult.name,
                calories: scanResult.calories || 0,
                protein: scanResult.protein || 0,
                carbs: scanResult.carbs || 0,
                fat: scanResult.fat || 0,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'Snack',
                image: previewImage || undefined
            };
            await addMeal(user.uid, selectedDate, newMeal);
            const updatedLog = await getFoodLog(user.uid, selectedDate);
            if (updatedLog) setLog(updatedLog);
        }
        setShowConfirm(false);
        setPreviewImage(null);
        setScanResult(null);
    };

    const getMealTypeLabel = (type: string) => {
        switch (type) {
            case 'Breakfast': return t.food.mealBreakfast;
            case 'Lunch': return t.food.mealLunch;
            case 'Snack': return t.food.mealSnack;
            case 'Dinner': return t.food.mealDinner;
            default: return type;
        }
    };

    if (loading || !log) return <div className="text-white p-10">{t.food.loading}</div>;

    const caloriePercentage = Math.min((log.summary.calories.current / log.summary.calories.goal) * 100, 100);

    const MacroBar = ({ label, current, goal, color }: { label: string, current: number, goal: number, color: string }) => {
        const percentage = Math.min((current / goal) * 100, 100);
        return (
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{label}</span>
                    <span>{current} / {goal}g</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 w-[var(--width)]" style={{ '--width': `${percentage}%`, backgroundColor: color } as React.CSSProperties}></div>
                </div>
            </div>
        );
    };



    const handleGenerateAdvice = async () => {
        if (!log || aiLoading) return;
        setAiLoading(true);
        try {
            const insight = await getFoodLogInsight(language, {
                calories: log.summary.calories.current,
                protein: log.summary.protein.current,
                carbs: log.summary.carbs.current,
                fat: log.summary.fat.current,
                goalCalories: log.summary.calories.goal
            });
            if (insight) {
                setAiAdvice(insight); // Store the full object
                if (insight.emoji) triggerAlert(insight.title, insight.recommendation || insight.insight, "info");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-8 animate-fade-in relative pb-10">
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .scan-line {
                    height: 2px;
                    background: #00ff94;
                    box-shadow: 0 0 15px #00ff94;
                    position: absolute;
                    width: 100%;
                    animation: scan 2s linear infinite;
                    z-index: 10;
                }
            `}</style>

            {/* ...HistoryModal... */}
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={t.food.historyModalTitle}>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div key={day} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-gray-300">Jan {12 - day}</span>
                            <div className="flex gap-4 text-sm">
                                <span className="text-white font-bold">{Math.floor(1800 + Math.random() * 500)} {t.food.calories}</span>
                                <span className="text-aura-green">{Math.floor(100 + Math.random() * 50)}g {t.food.protein}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </HistoryModal>

            {/* HEADER */}
            <div className="flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-40 p-4 -mx-4 rounded-b-2xl border-b border-white/10 shadow-lg">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-1">Ovqatlanish</h1>
                    <p className="text-gray-400 text-xs">{t.food.subtitle}</p>
                </div>

                <div className="flex items-center gap-4">
                    <DateNavigator
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                    />
                    <VoiceInput
                        module="food"
                        onCommand={handleVoiceCommand}
                        color="purple"
                        className={isArchived ? 'opacity-30 pointer-events-none' : ''}
                    />
                </div>
            </div>

            {/* AI INSIGHT SECTION */}
            <AiInsightSection
                onAnalyze={handleGenerateAdvice}
                isLoading={aiLoading}
                insight={aiAdvice}
                title={t.food.instantAdviceTitle || "AI Tahlil"}
                description={t.food.targetAdvice || "Kunlik ovqatlanish ratsioningizni tahlil qiling."}
                buttonText="Tahlilni Boshlash"
                color="cyan"
            />


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: CALORIE & MACROS */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-aura-cyan/20 to-transparent opacity-20 pointer-events-none"></div>

                        <h3 className="text-xl font-bold text-white absolute top-8 left-8">{t.food.calories}</h3>
                        <div className="relative w-64 h-64 mt-8 flex items-center justify-center group cursor-default">
                            {/* Animated Rings */}
                            <div className="absolute inset-0 border-[20px] border-white/5 rounded-full"></div>
                            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                <circle cx="50%" cy="50%" r="80" fill="none" stroke="#222" strokeWidth="20" strokeLinecap="round" />
                                <circle
                                    cx="50%" cy="50%" r="80"
                                    fill="none"
                                    stroke="#00F0FF"
                                    strokeWidth="20"
                                    strokeDasharray={2 * Math.PI * 80}
                                    strokeDashoffset={(2 * Math.PI * 80) - ((2 * Math.PI * 80) * caloriePercentage) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-display font-bold text-white tracking-tighter">{log.summary.calories.current}</span>
                                <span className="text-xs font-bold text-aura-cyan uppercase tracking-widest mt-1">{t.food.kcal} / {log.summary.calories.goal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-6">{t.food.macros}</h3>
                        <MacroBar label={t.food.protein} current={log.summary.protein.current} goal={log.summary.protein.goal} color="#FFD600" />
                        <MacroBar label={t.food.carbs} current={log.summary.carbs.current} goal={log.summary.carbs.goal} color="#00FF94" />
                        <MacroBar label={t.food.fats} current={log.summary.fat.current} goal={log.summary.fat.goal} color="#FF2E2E" />
                    </div>
                </div>

                {/* RIGHT: MEAL LOG & SCANNER */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="w-full min-h-[300px] rounded-[2rem] bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                        {!previewImage && !isScanning ? (
                            <div
                                onClick={() => !isArchived && document.getElementById('meal-upload')?.click()}
                                className={`flex flex-col items-center justify-center gap-6 cursor-pointer text-gray-400 hover:text-white transition-all transform hover:scale-105 ${isArchived ? 'opacity-30 cursor-not-allowed' : ''} w-full h-full min-h-[300px]`}
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-aura-cyan/20 to-aura-purple/20 border border-white/10 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(0,240,255,0.1)] group-hover:shadow-[0_0_50px_rgba(0,240,255,0.3)] transition-shadow">📷</div>
                                <div className="text-center space-y-2">
                                    <span className="text-2xl font-bold tracking-wide block">{t.food.scanMeal}</span>
                                    <p className="text-sm opacity-60 max-w-xs mx-auto leading-relaxed">{t.food.cameraPrompt}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-8 w-full h-full animate-fade-in">
                                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-aura-cyan/30 flex-shrink-0 shadow-[0_0_20px_rgba(0,255,148,0.2)]">
                                    {previewImage && <img src={previewImage} alt="Food" className="w-full h-full object-cover" width={192} height={192} />}
                                    {isScanning && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="scan-line"></div>
                                            <span className="text-[10px] text-white font-bold animate-pulse tracking-widest">{t.food.analyzing}</span>
                                        </div>
                                    )}
                                </div>

                                {showConfirm && scanResult && (
                                    <div className="flex-1 space-y-6 animate-slide-up">
                                        <div>
                                            <p className="text-xs text-aura-cyan uppercase tracking-widest mb-1">{t.food.aiDetected}</p>
                                            <h3 className="text-3xl font-bold text-white">{scanResult.name}</h3>
                                            <div className="flex gap-4 mt-2 text-aura-green font-bold">
                                                <span>{scanResult.calories} {t.food.kcal}</span>
                                                <span className="opacity-30">|</span>
                                                <span>{scanResult.protein}{t.food.unitG} P</span>
                                                <span className="opacity-30">|</span>
                                                <span>{scanResult.carbs}{t.food.unitG} C</span>
                                                <span className="opacity-30">|</span>
                                                <span>{scanResult.fat}{t.food.unitG} F</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-white font-medium">
                                                {scanResult.name === "Aniqlanmagan Taom"
                                                    ? (scanResult.advice || "Taomni aniqlab bo'lmadi. Qo'lda kiritasizmi?")
                                                    : t.food.eatQuestion}
                                            </p>
                                            <div className="flex gap-4">
                                                {scanResult.name === "Aniqlanmagan Taom" ? (
                                                    <button
                                                        onClick={() => {
                                                            setShowConfirm(false);
                                                            setPreviewImage(null);
                                                            // Trigger manual entry logic here if/when available, or just reset
                                                            triggerAlert("Qo'lda Kiritish", "Iltimos, taom nomini va kaloriyasini pastdagi tugma orqali (ovozli yoki yozma) kiriting.", "info");
                                                        }}
                                                        className="flex-1 py-3 rounded-xl bg-aura-cyan text-black font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all transform active:scale-95"
                                                    >
                                                        Qo'lda Kiritish
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleConfirmMeal(true)} className="flex-1 py-3 rounded-xl bg-aura-green text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,148,0.4)] transition-all transform active:scale-95">{t.food.yes}</button>
                                                )}
                                                <button onClick={() => handleConfirmMeal(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all">{t.food.no}</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isScanning && (
                                    <div className="flex-1 h-full flex items-center justify-center">
                                        <div className="space-y-4 text-center">
                                            <div className="inline-block w-8 h-8 border-4 border-aura-cyan border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-aura-cyan font-display tracking-widest animate-pulse">{t.food.analyzing}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <input aria-label={t.food.scanMeal} type="file" id="meal-upload" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </div>

                    <h3 className="text-xl font-bold text-white mt-8">{t.food.dailyLog}</h3>
                    <div className="space-y-4">
                        {log.meals.map((meal) => (
                            <div key={meal.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-aura-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                                    {meal.image ? (
                                        <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>
                                            {meal.type === 'Breakfast' ? '☕' :
                                                meal.type === 'Lunch' ? '🍲' :
                                                    meal.type === 'Dinner' ? '🌙' : '🍎'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-aura-gold uppercase tracking-wider mb-1">{getMealTypeLabel(meal.type)}</p>
                                            <h4 className="font-bold text-white">{meal.name}</h4>
                                        </div>
                                        <span className="text-gray-500 text-xs">{meal.time}</span>
                                    </div>
                                    <div className="mt-1 flex gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1 font-bold text-aura-cyan">{meal.calories} {t.food.kcal}</span>
                                        <span>P: {meal.protein}{t.food.unitG}</span>
                                        <span>C: {meal.carbs}{t.food.unitG}</span>
                                        <span>F: {meal.fat}{t.food.unitG}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteMeal(meal)}
                                    disabled={isArchived}
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white disabled:invisible"
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <AlertModal
                    isOpen={alertModal.isOpen}
                    onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                    title={alertModal.title}
                    message={alertModal.message}
                    type={alertModal.type}
                />
            </div>
        </div>
    );
}
