"use client";
import React from 'react';
import Modal from '../Modal';

interface ProductModalsProps {
    type: 'features' | 'pricing' | 'enterprise' | 'download' | 'about' | 'missions' | 'careers' | 'contact' | null;
    onClose: () => void;
    translations: any;
}

export default function ProductModals({ type, onClose, translations }: ProductModalsProps) {
    if (!type) return null;

    const pt = translations.product_details;
    const ct = translations.company_details;

    const renderContent = () => {
        switch (type) {
            case 'features':
                return (
                    <div className="space-y-6 py-4">
                        <div className="text-center max-w-xl mx-auto">
                            <h2 className="text-3xl font-display font-black text-white mb-2 tracking-tighter uppercase italic">{pt.features.title}</h2>
                            <p className="text-gray-400 text-sm font-light leading-relaxed">{pt.features.subtitle}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {pt.features.modules.map((module: any, i: number) => (
                                <div key={i} className="group p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-500">
                                    <span className="text-aura-cyan font-black text-[9px] uppercase tracking-[0.3em] mb-2 block">Module {i + 1}</span>
                                    <h4 className="text-lg font-display font-bold text-white mb-2 uppercase italic tracking-tight leading-tight">{module.name}</h4>
                                    <p className="text-gray-400 text-[11px] font-light leading-snug">{module.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'pricing':
                return (
                    <div className="space-y-12 py-8">
                        <div className="text-center max-w-xl mx-auto">
                            <h2 className="text-4xl font-display font-black text-white mb-4 tracking-tighter uppercase italic">{pt.pricing.title}</h2>
                            <p className="text-gray-400 font-light leading-relaxed">{pt.pricing.subtitle}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pt.pricing.plans.map((plan: any, i: number) => (
                                <div key={i} className={`p-8 rounded-[2.5rem] flex flex-col h-full transition-all duration-500 border ${plan.name === 'Expert' ? 'bg-white/[0.03] border-aura-cyan/30 shadow-[0_0_50px_rgba(0,255,255,0.05)] scale-105 z-10' : 'bg-white/[0.01] border-white/5'}`}>
                                    <div className="mb-8">
                                        <h4 className={`text-xs font-black uppercase tracking-[0.4em] mb-4 ${plan.name === 'Expert' ? 'text-aura-cyan' : 'text-gray-500'}`}>{plan.name}</h4>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-display font-black text-white">${plan.price}</span>
                                            <span className="text-gray-500 text-xs font-light tracking-widest uppercase">/ {plan.period}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-4 mb-10 flex-1">
                                        {plan.features.map((feat: string, fi: number) => (
                                            <li key={fi} className="flex items-center gap-3 text-sm text-gray-300 font-light">
                                                <svg className={`w-4 h-4 flex-shrink-0 ${plan.name === 'Expert' ? 'text-aura-cyan' : 'text-aura-cyan/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${plan.name === 'Expert' ? 'bg-aura-cyan text-black shadow-lg shadow-aura-cyan/20 hover:scale-105 active:scale-95' : 'bg-white/5 text-white hover:bg-white/10'}`}>Get Started</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'enterprise':
                return (
                    <div className="space-y-12 py-8 max-w-2xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-4xl font-display font-black text-white mb-4 tracking-tighter uppercase italic">{pt.enterprise.title}</h2>
                            <p className="text-gray-400 font-light leading-relaxed">{pt.enterprise.subtitle}</p>
                        </div>
                        <div className="space-y-4">
                            {pt.enterprise.features.map((feat: any, i: number) => (
                                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-6 items-center">
                                    <div className="w-12 h-12 rounded-xl bg-aura-cyan/10 flex items-center justify-center text-aura-cyan text-xl">★</div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">{feat.name}</h4>
                                        <p className="text-gray-400 text-sm font-light">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'download':
                return (
                    <div className="space-y-12 py-8 max-w-2xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-4xl font-display font-black text-white mb-4 tracking-tighter uppercase italic">{pt.download.title}</h2>
                            <p className="text-gray-400 font-light leading-relaxed">{pt.download.subtitle}</p>
                        </div>
                        <div className="bg-aura-cyan/5 border border-aura-cyan/20 p-8 rounded-[2rem] space-y-6">
                            <h4 className="text-aura-cyan font-black uppercase tracking-widest text-xs">{pt.download.pwa.title}</h4>
                            <div className="space-y-4">
                                {pt.download.pwa.steps.map((step: string, i: number) => (
                                    <div key={i} className="flex gap-4 items-start text-gray-300 text-sm font-light">
                                        <span className="w-6 h-6 rounded-full bg-aura-cyan text-black flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
                                        <p>{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {pt.download.stores.map((store: any, i: number) => (
                                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center group cursor-not-allowed">
                                    <span className="text-white font-bold block mb-1">{store.name}</span>
                                    <span className="text-gray-600 text-[10px] uppercase font-black tracking-widest">{store.available}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'about':
                return (
                    <div className="py-8 max-w-2xl mx-auto space-y-8 text-center">
                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">{ct.about.title}</h2>
                        <div className="w-20 h-1 bg-aura-cyan mx-auto rounded-full"></div>
                        <p className="text-gray-300 text-lg font-light leading-relaxed italic">{ct.about.text}</p>
                    </div>
                );

            case 'missions':
                return (
                    <div className="py-8 max-w-2xl mx-auto space-y-12">
                        <div className="text-center">
                            <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">{ct.missions.title}</h2>
                        </div>
                        <div className="space-y-6">
                            {ct.missions.list.map((m: string, i: number) => (
                                <div key={i} className="flex gap-6 items-center p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-aura-cyan/30 transition-all">
                                    <span className="text-4xl font-display font-black text-aura-cyan/20">0{i + 1}</span>
                                    <p className="text-white text-lg font-light">{m}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'careers':
                return (
                    <div className="py-8 max-w-2xl mx-auto space-y-8 text-center">
                        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">{ct.careers.title}</h2>
                        <p className="text-aura-cyan font-black uppercase tracking-[0.3em] text-xs">{ct.careers.subtitle}</p>
                        <p className="text-gray-400 font-light leading-relaxed">{ct.careers.text}</p>
                        <button className="px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-aura-cyan transition-all transform hover:scale-105">
                            {ct.careers.cta}
                        </button>
                    </div>
                );

            case 'contact':
                return (
                    <div className="py-8 max-w-2xl mx-auto space-y-12 text-center">
                        <div>
                            <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-4">{ct.contact.title}</h2>
                            <p className="text-gray-400 font-light italic">{ct.contact.subtitle}</p>
                        </div>
                        <a href={`mailto:${ct.contact.email}`} className="text-2xl md:text-4xl font-display font-bold text-white hover:text-aura-cyan transition-all tracking-tighter underline underline-offset-8 decoration-aura-cyan/30">
                            {ct.contact.email}
                        </a>
                        <div className="space-y-4">
                            <div className="text-aura-cyan font-black text-[10px] uppercase tracking-[0.4em] mb-2">{ct.contact.handle ? `@${ct.contact.handle}` : ''}</div>
                            <div className="flex gap-6 justify-center">
                                {ct.contact.socials.map((s: string, i: number) => (
                                    <span key={i} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white cursor-pointer transition-all">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    const modalSize = (type === 'features' || type === 'pricing') ? 'max-w-5xl' : 'max-w-2xl';

    return (
        <Modal isOpen={!!type} onClose={onClose} title="" className={modalSize}>
            {renderContent()}
        </Modal>
    );
}
