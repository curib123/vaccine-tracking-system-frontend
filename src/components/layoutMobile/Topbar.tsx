'use client';

import { Menu } from 'lucide-react';

export default function Topbar({
  onMenu,
}: {
  onMenu: () => void;
}) {
  return (
    <header className="h-14 bg-white border-b flex items-center px-4">
      <button onClick={onMenu}>
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      <h1 className="ml-4 font-semibold text-slate-800">
        Health Center
      </h1>
    </header>
  );
}
