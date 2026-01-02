'use client';

import { useState } from 'react';

import ParentGuard from '@/components/guards/ParentGuard';
import BottomNav from '@/components/layoutMobile/BottomNav';
import MobileDrawer from '@/components/layoutMobile/Drawer';
import Sidebar from '@/components/layoutMobile/Sidebar';
import MobileTopbar from '@/components/layoutMobile/Topbar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ParentGuard>
      <div className="min-h-screen bg-slate-50 flex">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64">
          <Sidebar />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col">

          {/* Mobile Topbar */}
          <div className="md:hidden">
            <MobileTopbar onMenu={() => setDrawerOpen(true)} />
          </div>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
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
