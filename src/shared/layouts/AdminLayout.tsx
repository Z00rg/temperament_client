import { ReactNode } from 'react';
import { UiHeader } from '@/shared/ui/ui-header';
import { AdminNavigation } from '@/shared/ui/AdminNavigation';

interface AdminLayoutProps {
    children: ReactNode;
    activeTab?: 'statements' | 'bank';
    user?: {
        fio: string;
        role?: string;
    };
}

export default function AdminLayout({ children, activeTab, user }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <UiHeader isAdmin={true} user={user} />

            {/* Admin Navigation Tabs */}
            <AdminNavigation activeTab={activeTab} />

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">{children}</main>
        </div>
    );
}