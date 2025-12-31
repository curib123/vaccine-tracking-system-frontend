'use client';

import {
  Baby,
  Bell,
  Home,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/user/announcements', label: 'Announcements', icon: Bell },
  { href: '/user/children', label: 'Children', icon: Baby },
  { href: '/user/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex justify-around items-center">
      {items.map(i => {
        const active = path === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center text-xs ${
              active ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <i.icon className="w-5 h-5" />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
