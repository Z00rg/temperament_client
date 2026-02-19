'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminTab = 'statements' | 'bank';

interface AdminNavigationProps {
    activeTab?: AdminTab;
}

export function AdminNavigation({ activeTab }: AdminNavigationProps) {
    const pathname = usePathname();

    // Автоопределение активного таба по URL если не передан явно
    const getCurrentTab = (): AdminTab => {
        if (activeTab) return activeTab;

        if (pathname?.includes('/admin/statements')) return 'statements';
        if (pathname?.includes('/admin/bank')) return 'bank';

        return 'statements';
    };

    const currentTab = getCurrentTab();

    const tabs = [
        { id: 'statements' as AdminTab, label: 'Ведомости', href: '/admin/statements' },
        { id: 'bank' as AdminTab, label: 'Банк заданий', href: '/admin/bank' },
    ];

    return (
        <nav className="bg-white border-b border-slate-200">
            <div className="container mx-auto px-6">
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`px-6 py-3 font-medium transition-all border-b-2 ${
                                currentTab === tab.id
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-slate-600 border-transparent hover:text-blue-600 hover:border-blue-300'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}