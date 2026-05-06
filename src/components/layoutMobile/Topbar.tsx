'use client';

import { Menu } from 'lucide-react';

export default function Topbar({
  onMenu,
}: {
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-3 bg-white/90 px-4 backdrop-blur shadow-sm ring-1 ring-black/5">
        {/* Menu Button */}
        <button
          onClick={onMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 transition"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>

        {/* Title */}
        <h1 className="ml-1 text-base font-semibold tracking-tight text-slate-900">
          Health Center
        </h1>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Accent Dot (optional, subtle branding) */}
        <div className="h-2 w-2 rounded-full bg-blue-500" />
      </div>
    </header>
  );
}
