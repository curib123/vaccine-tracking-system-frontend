'use client';

import { useState } from 'react';

import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import useSessionGuard from '@/hooks/useSessionGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const { user, loading } = useSessionGuard({
    mode: 'protected',
    redirectTo: '/admin/dashboard',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-green-50">
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
  );
}
