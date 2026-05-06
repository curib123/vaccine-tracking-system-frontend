'use client';

import { useState } from 'react';

import ParentGuard from '@/components/guards/ParentGuard';
import BottomNav from '@/components/layoutMobile/BottomNav';
import MobileDrawer from '@/components/layoutMobile/Drawer';
import Sidebar from '@/components/layoutMobile/Sidebar';
import MobileTopbar from '@/components/layoutMobile/Topbar';
import ParentPwaInstallPrompt from '@/components/pwa/ParentPwaInstallPrompt';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ParentGuard>
      <div className="flex min-h-[100dvh] bg-slate-50">

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 md:sticky md:top-0 md:flex md:h-screen md:self-start">
          <Sidebar />
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Mobile Topbar */}
          <div className="md:hidden">
            <MobileTopbar onMenu={() => setDrawerOpen(true)} />
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
            <ParentPwaInstallPrompt />
            {children}
          </main>

          {/* Mobile Bottom Nav */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </ParentGuard>
  );
}
