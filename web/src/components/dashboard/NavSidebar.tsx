"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';



import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export default function NavSidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const { notifications } = useNotifications();

    const navItems = [
        { name: t.sidebar.dashboard, href: '/dashboard/', icon: '⚡' },
        { name: t.sidebar.family, href: '/dashboard/family/', icon: '👨‍👩‍👧‍👦', key: 'family', hasAi: true },
        { name: t.sidebar.finance, href: '/dashboard/finance/', icon: '💸', key: 'finance', hasAi: true },
        { name: t.sidebar.tasks, href: '/dashboard/tasks/', icon: '✅', key: 'tasks', hasAi: true },
        { name: t.sidebar.health, href: '/dashboard/health/', icon: '❤️', key: 'health', hasAi: true },
        { name: t.sidebar.food, href: '/dashboard/food/', icon: '🥗', key: 'food', hasAi: true },
        { name: t.sidebar.mind, href: '/dashboard/mind/', icon: '🧠', key: 'mind', hasAi: true },
        { name: t.sidebar.interests, href: '/dashboard/interests/', icon: '🎨', key: 'interests', hasAi: true },
        { name: t.sidebar.settings, href: '/dashboard/settings/', icon: '⚙️' },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 pointer-events-none z-50 flex flex-col p-4">
            {/* Glass Container */}
            <div className="w-full h-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl pointer-events-auto flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">

                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <Image src="/logo_v3.png" alt="AURA" width={40} height={40} className="rounded-full shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
                    <span className="font-display font-bold text-xl tracking-wider text-white">AURA</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        // Handle trailing slashes explicitly since we re-enabled trailingSlash: true
                        const currentPath = pathname.endsWith('/') ? pathname : pathname + '/';
                        const itemHref = item.href.endsWith('/') ? item.href : item.href + '/';

                        const isActive = currentPath === itemHref || currentPath.startsWith(itemHref);

                        // UI FORCE CLEAR: If active, show 0 immediately
                        const count = isActive ? 0 : (item.key ? (notifications as any)[item.key] : 0);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={false} // Prevent 404 errors on static export
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-aura-purple text-white shadow-lg shadow-aura-purple/20 scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span className="font-medium text-sm tracking-wide flex-1">{item.name}</span>

                                {(count > 0 || item.hasAi) && (
                                    <div className="relative flex items-center justify-center">

                                        <span className="absolute w-4 h-4 bg-aura-cyan/40 rounded-full animate-ping"></span>
                                        <span className="relative z-10 bg-aura-cyan text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.6)] border border-white/20">
                                            AI
                                        </span>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile / Bottom */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div onClick={logout} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group" title="Click to Logout">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-aura-purple to-aura-cyan p-[2px]">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center text-xs font-bold">
                                {user?.email ? user.email[0].toUpperCase() : 'U'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.displayName || (user?.email?.split('@')[0]) || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate group-hover:text-aura-red transition-colors">Log Out</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
