"use client";
import React, { useState } from 'react';
import { analyzeText } from '@/services/groqService';
import { AiInsightSection } from '@/components/dashboard/AiInsightSection';

interface SmartOnboardingProps {
    userName: string;
    isNewUser: boolean;
}

export default function SmartOnboarding({ userName, isNewUser }: SmartOnboardingProps) {
    const [loading, setLoading] = useState(false);
    const [tips, setTips] = useState<string[]>([]);
    const [generated, setGenerated] = useState(false);

    const generatePlan = async () => {
        setLoading(true);
        const prompt = `User ${userName} has just joined Aura Life OS. Their dashboard is empty. 
        Provide 3 short, actionable, and inspiring steps to get started with:
        1. Finance (Budgeting)
        2. Health (Bio-logging)
        3. Deep Work (Focus)
        
        Return ONLY the 3 steps as a numbered list. No intro/outro. Keep it punchy.`;

        const response = await analyzeText(prompt, "Onboarding Specialist");
        // Simple parse assuming standard list format
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        setTips(lines);
        setGenerated(true);
        setLoading(false);
    };

    if (!isNewUser && !generated) return null;

    return (
        <div className="col-span-12">
            <AiInsightSection
                onAnalyze={generatePlan}
                isLoading={loading}
                insight={generated ? { title: "Neural Strategic Plan", emoji: "🧠", text: "Here is your 3-step action plan to get started." } : null}
                title={generated ? "Strategic Plan Ready" : `Welcome to Aura, ${userName}`}
                description="Activate the neural engine to generate your personalized starting strategy."
                buttonText={generated ? "Regenerate Plan" : "Generate AI Life Plan"}
                color="cyan"
            >
                {generated && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        {tips.map((tip, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-aura-cyan/30 transition-all flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-aura-cyan/5 blur-[40px] rounded-full group-hover:bg-aura-cyan/10 transition-colors"></div>
                                <div className="text-5xl opacity-10 font-black mb-4 text-aura-cyan translate-x-[-10px]">0{i + 1}</div>
                                <p className="text-white font-medium leading-relaxed relative z-10">{tip.replace(/^\d+\.\s*/, '')}</p>
                            </div>
                        ))}
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button onClick={() => setGenerated(false)} className="text-xs text-gray-500 hover:text-white underline decoration-white/20 underline-offset-4">
                                Dismiss Plan
                            </button>
                        </div>
                    </div>
                )}
            </AiInsightSection>
        </div>
    );
}
