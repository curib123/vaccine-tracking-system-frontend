'use client';

import {
  Baby,
  Bell,
  Home,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ================= NAV ITEMS ================= */

const items = [
  { href: '/user/dashboard', label: 'Home', icon: Home },
  { href: '/user/announcements', label: 'Announcements', icon: Bell },
  { href: '/user/children', label: 'Children', icon: Baby },
  { href: '/user/profile', label: 'Profile', icon: User },
];

/* ================= COMPONENT ================= */

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur">
      <div className="flex h-16 items-center justify-around">
        {items.map(i => {
          const active = path === i.href;
          const Icon = i.icon;

          return (
            <Link
              key={i.href}
              href={i.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 transition"
            >
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-xl transition
                  ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
              </div>

              <span
                className={`text-[11px] font-medium ${
                  active
                    ? 'text-blue-600'
                    : 'text-slate-500'
                }`}
              >
                {i.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
