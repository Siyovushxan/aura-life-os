"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { translations, Language } from "./i18n/translations";
import { useAuth } from "@/context/AuthContext";
import ProductModals from "@/components/landing/ProductModals";

// Living Background Blobs
const LivingBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-black">
    <motion.div
      animate={{
        x: [0, 100, -100, 0],
        y: [0, -150, 100, 0],
        scale: [1, 1.2, 0.8, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-aura-cyan/10 blur-[180px] rounded-full"
    />
    <motion.div
      animate={{
        x: [0, -120, 80, 0],
        y: [0, 180, -120, 0],
        scale: [1, 0.9, 1.1, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-aura-purple/10 blur-[200px] rounded-full"
    />
    <div className="absolute inset-0 backdrop-blur-[150px] opacity-60"></div>
  </div>
);

// Nav Arrow Component
const NavArrow = ({ targetId }: { targetId: string }) => (
  <motion.div
    animate={{ y: [0, 10, 0] }}
    transition={{ repeat: Infinity, duration: 2 }}
    className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer p-6 opacity-30 hover:opacity-100 transition-all z-20 group"
    onClick={() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }}
  >
    <div className="relative">
      <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
      <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </motion.div>
);

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Language>('uz');
  const [sleepHours, setSleepHours] = useState(7);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<'features' | 'pricing' | 'enterprise' | 'download' | 'about' | 'missions' | 'careers' | 'contact' | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  // Scroll Progress for Scrollytelling
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef
  });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate stress and expense based on sleep
  const stressLevel = Math.max(0, Math.min(100, (10 - sleepHours) * 15));
  const expenseLevel = Math.max(0, Math.min(100, stressLevel * 1.2));

  // Determine butterfly effect color state
  const getButterflyState = () => {
    if (sleepHours < 5) return { color: "text-aura-red", border: "border-aura-red", glow: "shadow-aura-red/50", bg: "bg-aura-red/10" };
    if (sleepHours < 7) return { color: "text-aura-gold", border: "border-aura-gold", glow: "shadow-aura-gold/50", bg: "bg-aura-gold/10" };
    return { color: "text-aura-green", border: "border-aura-green", glow: "shadow-aura-green/50", bg: "bg-aura-green/10" };
  };
  const butterflyState = getButterflyState();

  // Handle scroll for navbar styling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 20);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Parallax Transforms ---
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    container: scrollContainerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(heroScroll, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.8]);

  // Handle section navigation with mobile menu close
  const navigateToSection = (id: string) => {
    scrollToSection(id);
    setMobileMenuOpen(false);
  };


  return (
    <div className="relative w-full h-screen font-sans selection:bg-aura-cyan selection:text-black">
      <LivingBackground />
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-aura-cyan origin-left z-[9999]"
        style={{ scaleX }}
      />

      <aside className="fixed top-0 left-0 bottom-0 w-64 z-[100] hidden lg:flex flex-col bg-black/40 backdrop-blur-3xl border-r border-white/[0.05] p-8 overflow-y-auto">
        <Link href="/" className="flex items-center gap-3 group mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-aura-cyan blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Image src="/logo_v3.png" alt="AURA logo" width={32} height={32} className="w-8 h-8 rounded-full relative z-10 border border-white/10" />
          </div>
          <span className="text-xl font-display font-bold tracking-widest group-hover:tracking-[0.2em] transition-all duration-500 uppercase text-white">AURA</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="flex flex-col gap-8 flex-1">
          {[
            { id: 'hero', label: t.nav.hero },
            { id: 'problem', label: t.nav.problem },
            { id: 'solution', label: t.nav.solution },
            { id: 'butterfly', label: t.nav.butterfly },
            { id: 'platforms', label: t.nav.platforms },
            { id: 'family', label: t.nav.family },
            { id: 'liveness', label: t.nav.liveness },
            { id: 'author', label: t.nav.author },
            { id: 'cta', label: t.nav.cta },
            { id: 'info', label: t.nav.info }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-left text-gray-200 hover:text-white transition-all text-[0.6rem] font-bold uppercase tracking-[0.3em] hover:translate-x-2"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8 space-y-6">
          {/* Language Switcher */}
          <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
            <button onClick={() => setLang('uz')} className={`flex-1 py-1.5 text-[0.6rem] rounded-full transition-all ${lang === 'uz' ? 'bg-aura-cyan text-black font-bold' : 'text-gray-200 hover:text-white'}`}>UZ</button>
            <button onClick={() => setLang('ru')} className={`flex-1 py-1.5 text-[0.6rem] rounded-full transition-all ${lang === 'ru' ? 'bg-aura-cyan text-black font-bold' : 'text-gray-200 hover:text-white'}`}>RU</button>
            <button onClick={() => setLang('en')} className={`flex-1 py-1.5 text-[0.6rem] rounded-full transition-all ${lang === 'en' ? 'bg-aura-cyan text-black font-bold' : 'text-gray-200 hover:text-white'}`}>EN</button>
          </div>

          <Link href={user ? "/dashboard" : "/login"} prefetch={false} className="block w-full text-center py-3 bg-white text-black rounded-full font-bold text-[0.6rem] uppercase tracking-widest hover:bg-aura-cyan transition-all hover:scale-105">
            {t.nav.cta}
          </Link>
        </div>
      </aside>

      {/* Mobile Nav Top Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] lg:hidden transition-all duration-700 ${isScrolled ? 'bg-black/60 backdrop-blur-3xl border-b border-white/[0.05]' : 'bg-transparent'} py-4`}>
        <div className="px-6 flex justify-between items-center text-white">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_v3.png" alt="AURA logo" width={24} height={24} className="w-6 h-6 rounded-full border border-white/10" />
            <span className="text-lg font-display font-bold uppercase">AURA</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/5 rounded-lg border border-white/5"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#050505] z-[9997] lg:hidden flex flex-col p-8 pt-28 overflow-y-auto"
          >
            <div className="grid grid-cols-1 gap-4 px-4">
              {[
                { id: 'hero', label: t.nav.hero, icon: '🏠' },
                { id: 'problem', label: t.nav.problem, icon: '⚠️' },
                { id: 'solution', label: t.nav.solution, icon: '💡' },
                { id: 'butterfly', label: t.nav.butterfly, icon: '🦋' },
                { id: 'platforms', label: t.nav.platforms, icon: '📱' },
                { id: 'family', label: t.nav.family, icon: '👨‍👩‍👧‍👦' },
                { id: 'liveness', label: t.nav.liveness, icon: '💓' },
                { id: 'author', label: t.nav.author, icon: '👤' },
                { id: 'cta', label: t.nav.cta, icon: '🚀' },
                { id: 'info', label: t.nav.info, icon: 'ℹ️' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateToSection(item.id)}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-xl font-medium text-white hover:bg-white/10 active:scale-95 transition-all text-left"
                >
                  <span className="text-2xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="h-px bg-white/10 my-6 mx-4" />

            <div className="px-4">
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-4 bg-gradient-to-r from-aura-cyan to-aura-purple text-white rounded-2xl font-bold text-xl shadow-lg">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-4 bg-gradient-to-r from-aura-cyan to-aura-purple text-white rounded-2xl font-bold text-xl shadow-lg">
                  {t.nav.cta}
                </Link>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setLang('uz')} className={`px-4 py-2 rounded-full border transition-all ${lang === 'uz' ? 'bg-aura-cyan border-aura-cyan text-black font-bold' : 'border-white/10 text-gray-200'}`}>UZ</button>
              <button onClick={() => setLang('ru')} className={`px-4 py-2 rounded-full border transition-all ${lang === 'ru' ? 'bg-aura-cyan border-aura-cyan text-black font-bold' : 'border-white/10 text-gray-200'}`}>RU</button>
              <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-full border transition-all ${lang === 'en' ? 'bg-aura-cyan border-aura-cyan text-black font-bold' : 'border-white/10 text-gray-200'}`}>EN</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scroll-container lg:pl-64" ref={scrollContainerRef}>

        <main className="bg-background text-foreground overflow-x-hidden">

          {/* BLOK 1: HERO - Premium Redesign */}
          <section id="hero" ref={heroRef} className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden bg-transparent px-6">

            <motion.div
              style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
              className="z-10 flex flex-col items-center max-w-7xl text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="mb-10 p-px rounded-full bg-gradient-to-r from-white/5 via-white/20 to-white/5"
              >
                <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-3xl text-[0.65rem] font-bold uppercase tracking-[0.4em] text-aura-cyan">
                  The Ultimate Life OS
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-8 tracking-tight"
              >
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/80">
                  {t.hero.title}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-lg md:text-2xl text-gray-200 max-w-4xl mb-16 leading-relaxed font-light mx-auto"
              >
                {t.hero.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <Link
                  href="/dashboard"
                  className="group relative px-14 py-6 bg-white text-black rounded-full font-bold text-[0.7rem] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_30px_60px_rgba(255,255,255,0.1)] overflow-hidden"
                >
                  <span className="relative z-10">{t.hero.cta_main}</span>
                  <div className="absolute inset-0 bg-aura-cyan scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
                </Link>

                <button
                  className="px-14 py-6 bg-white/[0.02] border border-white/10 text-white rounded-full font-bold text-[0.7rem] uppercase tracking-[0.2em] hover:bg-white/[0.05] transition-all backdrop-blur-3xl"
                >
                  {t.hero.cta_secondary}
                </button>
              </motion.div>
            </motion.div>

            {/* Center Background Brand Logo - Perfect Circle & Screen Centered */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.45, scale: 1.05, y: [0, -40, 0] }}
              transition={{
                opacity: { duration: 2 },
                scale: { duration: 1.5 },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0"
            >
              <div className="relative w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] rounded-full overflow-hidden flex items-center justify-center">
                {/* Layered Cyber Glow */}
                <div className="absolute inset-0 bg-aura-cyan blur-[200px] opacity-30 rounded-full"></div>
                <div className="absolute inset-0 bg-aura-purple blur-[150px] opacity-20 translate-x-10 rounded-full"></div>

                <Image
                  src="/logo_v3.png"
                  alt="AURA Background Logo"
                  width={1200}
                  height={1200}
                  className="w-full h-full opacity-55 brightness-110 drop-shadow-[0_0_150px_rgba(0,243,255,0.4)] rounded-full object-cover mix-blend-screen"
                />
              </div>

              {/* Decorative Label - Positioned below without pushing the logo up */}
              <div className="absolute top-[105%] left-1/2 -translate-x-1/2 text-[0.7rem] font-bold uppercase tracking-[2.5em] text-aura-cyan/20 animate-pulse whitespace-nowrap">
                Aura System v3.0
              </div>
            </motion.div>

            <NavArrow targetId="problem" />
          </section>

          <section
            id="problem"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center text-center relative overflow-hidden px-6 py-12"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDExKSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10" />

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="relative z-10 w-full max-w-7xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-6 tracking-tighter uppercase italic text-white drop-shadow-sm leading-[0.9]">
                {t.problem.title}
              </h2>
              <p className="mb-12 text-gray-200 text-lg md:text-2xl font-light max-w-3xl mx-auto leading-relaxed opacity-80">
                {t.problem.subtitle}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
                {/* Chaos / Crisis Visual */}
                <div className="relative h-[500px] flex items-center justify-center overflow-hidden rounded-[4rem] bg-red-500/[0.02] border border-red-500/10">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent"></div>
                  <h3 className="absolute top-10 left-10 text-red-500 font-bold text-xs tracking-[0.4em] uppercase">{t.problem.comparison.old_way.title}</h3>

                  <div className="relative w-full h-full p-12">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 h-full items-center">
                      {["📅", "💰", "🍎", "🏠", "📈", "⚙️"].map((icon, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -20, 0],
                            rotate: [0, i % 2 === 0 ? 10 : -10, 0],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-4xl flex items-center justify-center grayscale"
                        >
                          {icon}
                        </motion.div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-red-500/20 text-9xl font-black italic select-none">CHAOS</div>
                    </div>
                  </div>

                  <div className="absolute bottom-10 left-10 right-10 text-left space-y-4">
                    {t.problem.comparison.old_way.list.map((item, i) => (
                      <div key={i} className="text-gray-400 text-sm font-light flex items-center gap-3">
                        <span className="text-red-500/40">✕</span> {item.split(' ').slice(1).join(' ')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order / AURA Visual */}
                <div className="relative h-[500px] flex items-center justify-center overflow-hidden rounded-[4rem] bg-aura-cyan/[0.02] border border-aura-cyan/20 group">
                  <div className="absolute inset-0 bg-gradient-to-b from-aura-cyan/10 to-transparent"></div>
                  <h3 className="absolute top-10 left-10 text-aura-cyan font-bold text-xs tracking-[0.4em] uppercase">{t.problem.comparison.aura_way.title}</h3>

                  <div className="relative z-10 p-12 w-full flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center justify-center relative"
                    >
                      <Image src="/logo_v3.png" alt="AURA" width={240} height={240} className="w-60 h-60 rounded-full" />
                    </motion.div>
                  </div>

                  <div className="absolute bottom-10 left-10 right-10 text-left space-y-4">
                    {t.problem.comparison.aura_way.list.map((item, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        key={i}
                        className="text-white text-sm font-bold flex items-center gap-3"
                      >
                        <span className="text-aura-green">✓</span> {item.split(' ').slice(1).join(' ')}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* BLOK 3: SOLUTION - Premium Reveal */}
          <section
            id="solution"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-32 relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="max-w-7xl mx-auto w-full flex flex-col items-center py-12"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 uppercase italic">
                {t.solution.title}
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl text-center font-light leading-relaxed">
                {t.solution.subtitle}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
                {[
                  { card: t.solution.cards.secure, color: "text-aura-cyan", glow: "shadow-aura-cyan/10", icon: "🔒" },
                  { card: t.solution.cards.smart, color: "text-aura-purple", glow: "shadow-aura-purple/10", icon: "🧠" },
                  { card: t.solution.cards.ai, color: "text-aura-green", glow: "shadow-aura-green/10", icon: "⚡" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2, duration: 1 }}
                    whileHover={{ y: -20, scale: 1.02 }}
                    className={`group p-12 md:p-16 rounded-[4rem] bg-white/[0.01] backdrop-blur-[120px] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-700 relative overflow-hidden flex flex-col items-center text-center`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className={`text-7xl md:text-8xl mb-12 drop-shadow-2xl group-hover:scale-110 transition-transform duration-700`}>{item.icon}</div>
                    <h3 className={`text-2xl md:text-4xl font-bold mb-8 ${item.color} uppercase tracking-widest font-display`}>{item.card.title}</h3>
                    <p className="text-gray-200 text-lg md:text-xl leading-relaxed font-light">{item.card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <section
            id="butterfly"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-32 relative"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-7xl mx-auto w-full flex flex-col items-center mb-10"
            >
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-8 tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-gray-700 via-white to-gray-700 text-center leading-[0.9]">
                {t.butterfly.title}
              </h2>
              <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl text-center">
                Bitta qaror butun tizimga qanday ta&apos;sir qilishini ko&apos;ring.
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className={`w-full max-w-7xl backdrop-blur-[120px] border border-white/[0.05] rounded-[4rem] p-8 md:p-16 shadow-2xl transition-all duration-1000 ${butterflyState.bg}/[0.02] ${butterflyState.glow}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Control Panel */}
                <div className="lg:col-span-5 space-y-12 bg-white/[0.02] p-10 rounded-[3rem] border border-white/5">
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-display font-medium text-white">{t.butterfly.question}</h3>
                    <span className={`text-5xl font-bold ${butterflyState.color}`}>{sleepHours}<span className="text-xs uppercase ml-2 opacity-50">{t.butterfly.hours}</span></span>
                  </div>

                  <input
                    aria-label="Sleep Hours"
                    type="range"
                    min="3"
                    max="10"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="slider w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none active:scale-[0.98] transition-transform"
                  />

                  <div className="space-y-10">
                    {[
                      { label: "Ruhiyat (Mind)", value: stressLevel, color: stressLevel > 60 ? 'bg-red-500' : 'bg-aura-cyan', icon: "🧠" },
                      { label: "Moliya (Finance)", value: expenseLevel, color: expenseLevel > 60 ? 'bg-orange-500' : 'bg-aura-green', icon: "💰" },
                      { label: "Energiya (Physical)", value: 100 - stressLevel, color: stressLevel > 60 ? 'bg-red-900/40' : 'bg-aura-purple', icon: "⚡" }
                    ].map((m, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between text-[0.65rem] font-bold uppercase tracking-[0.3em] text-gray-400">
                          <span className="flex items-center gap-2"><span>{m.icon}</span> {m.label}</span>
                          <span>{Math.round(m.value)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div animate={{ width: `${m.value}%` }} className={`h-full ${m.color} transition-all duration-700`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Matrix */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {[
                    { module: "Salomatlik", status: sleepHours < 7 ? "Kritik" : "Optimal", desc: "Tiklanish jarayoni buzilgan.", color: "text-red-500" },
                    { module: "Diqqat", status: stressLevel > 50 ? "Past" : "Yuqori", desc: "Analitik qobiliyat pasaymoqda.", color: "text-orange-500" },
                    { module: "Ijtimoiy", status: "Barqaror", desc: "Hissiy muvozanat saqlanmoqda.", color: "text-aura-cyan" },
                    { module: "Kelajak", status: "Bashorat", desc: "Kutilmagan xarajatlar xavfi +12%.", color: "text-aura-purple" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.05] transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[0.6rem] uppercase tracking-widest text-gray-500 font-bold">{item.module}</span>
                        <span className={`text-[0.6rem] font-bold uppercase px-3 py-1 rounded-full bg-white/5 ${item.color}`}>{item.status}</span>
                      </div>
                      <p className="text-gray-300 text-sm font-light leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                  <div className="md:col-span-2 bg-black/40 border border-white/10 p-10 rounded-[3rem] mt-4">
                    <p className="text-gray-200 text-lg font-light leading-relaxed italic text-center">
                      &quot;{t.butterfly.result}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* BLOK 5: PLATFORMS - High-End Layout */}
          <section
            id="platforms"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-12 relative"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-16 tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10"
            >
              {t.platforms.title}
            </motion.h2>

            <div className="flex flex-col lg:flex-row gap-10 w-full max-w-7xl">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, y: -10 }}
                className="flex-1 p-16 rounded-[4rem] bg-white/[0.01] backdrop-blur-[120px] border border-white/[0.05] flex flex-col items-center text-center transition-all duration-700 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-aura-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 font-display italic tracking-tight">{t.platforms.mobile.title}</h3>
                <p className="text-gray-200 mb-12 text-xl font-light leading-relaxed max-w-sm">{t.platforms.mobile.desc}</p>
                <div className="flex gap-6 mt-auto">
                  <div className="px-8 py-3 rounded-full border border-white/10 text-[0.65rem] font-bold uppercase tracking-widest text-gray-300">iOS</div>
                  <div className="px-8 py-3 rounded-full border border-white/10 text-[0.65rem] font-bold uppercase tracking-widest text-gray-300">Android</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, y: -10 }}
                className="flex-1 p-16 rounded-[4rem] bg-white/[0.01] backdrop-blur-[120px] border border-white/[0.05] flex flex-col items-center text-center transition-all duration-700 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-aura-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 font-display italic tracking-tight">{t.platforms.web.title}</h3>
                <p className="text-gray-200 mb-12 text-xl font-light leading-relaxed max-w-sm">{t.platforms.web.desc}</p>
                <div className="px-8 py-3 rounded-full bg-white text-black text-[0.65rem] font-bold uppercase tracking-widest mt-auto">Open Web App</div>
              </motion.div>
            </div>
          </section>

          <section
            id="family"
            className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-center px-4 py-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-aura-purple/5 blur-[200px] rounded-full"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-12 z-10"
            >
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-8 tracking-tighter uppercase italic leading-[0.9]">
                {t.family.title}
              </h2>
              <p className="text-gray-400 text-lg md:text-xl font-light">Tirik meros va aqlli tarbiya platformasi.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto z-10">
              {[
                { icon: "👨‍👩‍👧‍👦", title: t.family.cards.parenting.title, desc: t.family.cards.parenting.desc, color: "text-orange-400", bg: "hover:bg-orange-500/5" },
                { icon: "🌳", title: t.family.cards.legacy.title, desc: t.family.cards.legacy.desc, color: "text-aura-cyan", bg: "hover:bg-aura-cyan/5" },
                { icon: "👵", title: t.family.cards.elder.title, desc: t.family.cards.elder.desc, color: "text-aura-green", bg: "hover:bg-aura-green/5" }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`group p-12 md:p-14 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] transition-all duration-700 flex flex-col items-center text-center shadow-xl ${card.bg}`}
                >
                  <div className="text-6xl md:text-7xl mb-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">{card.icon}</div>
                  <h4 className={`text-xl md:text-2xl font-bold ${card.color} mb-6 uppercase tracking-widest font-display italic leading-tight`}>{card.title}</h4>
                  <p className="text-gray-400 text-base md:text-lg leading-relaxed font-light">{card.desc}</p>

                  <div className="mt-10 w-full h-[1px] bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                  <button className="mt-8 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors">Batafsil</button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* BLOK 6.2: LIVENESS CHECK - Premium Safety Reveal */}
          <section
            id="liveness"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-aura-cyan opacity-[0.02] blur-[150px] -translate-y-1/2"></div>

            <div className="max-w-5xl mx-auto text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mb-12 inline-flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full bg-aura-cyan/10 border border-aura-cyan/20 flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                  <span className="text-4xl">💓</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                  {t.liveness_section.title}
                </h2>
                <p className="text-aura-cyan font-bold tracking-[0.4em] uppercase text-xs mb-10">{t.liveness_section.subtitle}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-12 md:p-16 rounded-[4rem] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-32 h-32 text-aura-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed mb-12">
                  {t.liveness_section.desc}
                </p>

                <button className="px-12 py-5 bg-white text-black rounded-full font-bold text-[0.7rem] uppercase tracking-widest hover:bg-aura-cyan transition-all hover:scale-105 shadow-2xl">
                  {t.liveness_section.cta}
                </button>
              </motion.div>
            </div>
          </section>

          {/* BLOK 6.5: AUTHOR - Premium Reveal */}
          <section
            id="author"
            className="w-full min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
          >
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
              {/* Author Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative group"
              >
                <div className="absolute -inset-10 bg-gradient-to-tr from-aura-cyan/20 to-aura-purple/20 opacity-30 blur-[100px] group-hover:opacity-50 transition-opacity duration-1000 rounded-[5rem]"></div>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[4rem] border border-white/[0.05] shadow-2xl">
                  <Image
                    src="/ArslanXan.jpg"
                    alt="ArslanXan - AURA Architect"
                    width={1000}
                    height={1250}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-1000 grayscale hover:grayscale-0"
                  />
                  <div className="absolute bottom-10 left-10 right-10 bg-black/40 backdrop-blur-[100px] border border-white/[0.05] p-10 rounded-[3rem]">
                    <h3 className="text-3xl font-display font-bold text-white mb-2">{t.author.name}</h3>
                    <p className="text-aura-cyan font-bold text-xs tracking-[0.4em] uppercase">{t.author.role}</p>
                  </div>
                </div>
              </motion.div>

              {/* Bio & Partners */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex flex-col"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-8 text-white italic tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 lg:text-left text-center">
                  {t.author.title}
                </h2>
                <div className="space-y-10 text-gray-200 text-lg md:text-xl leading-relaxed mb-20 font-light lg:text-left text-center">
                  <p>{t.author.bio}</p>
                </div>

                <div className="border-t border-white/[0.05] pt-16">
                  <h4 className="text-gray-200 font-bold text-xs mb-10 tracking-[0.4em] uppercase">
                    {t.author.partners_title}
                  </h4>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: "GROQ AI", color: "hover:text-white" },
                      { name: "Firebase", color: "hover:text-orange-400" },
                      { name: "Google Antigravity", color: "hover:text-aura-cyan" }
                    ].map((p, i) => (
                      <div
                        key={i}
                        className={`p-6 rounded-3xl bg-white/[0.01] border border-white/[0.05] flex items-center justify-center font-bold text-[0.65rem] tracking-[0.2em] uppercase text-gray-300 transition-all duration-500 ${p.color} hover:bg-white/[0.02] hover:border-white/[0.1] h-full whitespace-nowrap`}
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* BLOK 7: FOOTER - Premium Redesign */}
          <section
            id="cta"
            className="w-full min-h-screen bg-transparent flex flex-col justify-center border-t border-white/[0.05] px-6 relative overflow-hidden py-32"
          >
            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col h-full justify-center">

              {/* Main CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-10 tracking-tight italic uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 leading-tight font-black">
                  {t.footer.cta_title}
                </h2>
                <p className="text-lg md:text-xl text-gray-200 mb-12 font-light">{t.footer.cta_subtitle}</p>
                <Link href="/login" className="inline-block px-14 py-5 bg-white text-black text-[0.7rem] font-bold rounded-full uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:bg-aura-cyan">
                  {t.footer.cta_btn}
                </Link>
              </motion.div>
            </div>
          </section>

          {/* BLOK 8: FOOTER INFO - New Section */}
          <section
            id="info"
            className="w-full min-h-screen bg-transparent flex flex-col justify-center border-t border-white/[0.05] px-6 relative overflow-hidden py-32"
          >
            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col h-full justify-center">
              {/* Footer Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-20">

                {/* Brand Column */}
                <div className="md:col-span-4">
                  <div className="flex items-center gap-4 mb-10">
                    <Image src="/logo_v3.png" alt="AURA logo" width={40} height={40} className="w-10 h-10 rounded-full border border-white/10" />
                    <span className="text-3xl font-display font-bold text-white uppercase tracking-[0.2em]">AURA</span>
                  </div>
                  <p className="text-gray-300 mb-12 max-w-sm text-lg font-light leading-relaxed">
                    {t.footer.description}
                  </p>
                  <div className="flex gap-6">
                    {["𝕏", "In", "Ig"].map((icon) => (
                      <div key={icon} className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer hover:border-white/20">{icon}</div>
                    ))}
                  </div>
                </div>

                {/* Links Columns */}
                <div className="md:col-span-2">
                  <h4 className="font-bold text-white mb-10 text-[0.65rem] uppercase tracking-[0.4em] text-gray-200">{t.footer.links.product}</h4>
                  <ul className="space-y-6 text-gray-600 font-medium text-sm">
                    {[
                      { label: t.footer.links.features, type: 'features' as const },
                      { label: t.footer.links.pricing, type: 'pricing' as const },
                      { label: t.footer.links.enterprise, type: 'enterprise' as const },
                      { label: t.footer.links.download, type: 'download' as const }
                    ].map(link => (
                      <li key={link.label} className="group/link">
                        <button
                          onClick={() => {
                            if ('type' in link) setActiveProductModal(link.type);
                          }}
                          className="hover:text-white transition-all text-left relative"
                        >
                          <span className="relative z-10">{link.label}</span>
                          <div className="absolute -inset-x-4 -inset-y-1 bg-aura-cyan/0 group-hover/link:bg-aura-cyan/10 blur-md rounded-lg transition-all"></div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-bold text-white mb-10 text-[0.65rem] uppercase tracking-[0.4em] text-gray-200">{t.footer.links.company}</h4>
                  <ul className="space-y-6 text-gray-600 font-medium text-sm">
                    {[
                      { label: t.footer.links.about, type: 'about' as const },
                      { label: t.footer.links.missions, type: 'missions' as const },
                      { label: t.footer.links.careers, type: 'careers' as const },
                      { label: t.footer.links.contact, type: 'contact' as const }
                    ].map(link => (
                      <li key={link.label} className="group/link">
                        <button
                          onClick={() => {
                            if ('type' in link) setActiveProductModal(link.type);
                          }}
                          className="hover:text-white transition-all text-left relative"
                        >
                          <span className="relative z-10">{link.label}</span>
                          <div className="absolute -inset-x-4 -inset-y-1 bg-white/0 group-hover/link:bg-white/5 blur-md rounded-lg transition-all"></div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Newsletter Column */}
                <div className="md:col-span-4 bg-white/[0.01] p-10 rounded-[3rem] border border-white/[0.05] backdrop-blur-3xl">
                  <h4 className="text-white font-bold text-lg mb-4">{t.footer.newsletter_title}</h4>
                  <p className="text-gray-300 text-sm mb-10 font-light">{t.footer.newsletter_desc}</p>
                  <div className="flex flex-col gap-4">
                    <input type="email" placeholder={t.footer.newsletter_placeholder} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-6 py-5 text-white w-full focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-700 text-sm" />
                    <button className="bg-white text-black font-bold px-8 py-5 rounded-2xl hover:bg-aura-cyan transition-all uppercase text-[0.65rem] tracking-widest">{t.footer.newsletter_btn}</button>
                  </div>
                </div>
              </div>

              <div className="mt-32 pt-16 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center text-[0.65rem] uppercase tracking-[0.2em] text-gray-600">
                <p>{t.footer.copyright}</p>
                <div className="flex gap-10 mt-8 md:mt-0">
                  <a href="#" className="hover:text-white transition-colors">{t.footer.links.privacy}</a>
                  <a href="#" className="hover:text-white transition-colors">{t.footer.links.terms}</a>
                  <a href="#" className="hover:text-white transition-colors">{t.footer.links.cookies}</a>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

      <ProductModals
        type={activeProductModal}
        onClose={() => setActiveProductModal(null)}
        translations={t}
      />
    </div >
  );
}
