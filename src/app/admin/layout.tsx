'use client';

import { useState } from 'react';

import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import AuthGuard from '@/components/guards/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Read user from sessionStorage (already validated by AuthGuard)
  const user =
    typeof window !== 'undefined'
      ? JSON.parse(sessionStorage.getItem('user') || 'null')
      : null;

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} />

        <div className="flex flex-col flex-1">
          <Topbar
            user={user}
            collapsed={collapsed}
            onToggle={() => setCollapsed(v => !v)}
          />

          <main className="flex-1 p-6">{children}</main>

          <footer className="text-center text-sm text-gray-500 py-4 border-t bg-white">
            © {new Date().getFullYear()} Health Center System
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}
