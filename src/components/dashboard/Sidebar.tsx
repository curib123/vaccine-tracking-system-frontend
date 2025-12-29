'use client';

import {
  Baby,
  Building2,
  LayoutDashboard,
  LogOut,
  Syringe,
  UserCog,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

type SidebarProps = {
  collapsed: boolean;
};

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/children', label: 'Children Records', icon: Baby },
  { href: '/admin/parents', label: 'Parent Management', icon: Users },
  { href: '/admin/immunization', label: 'Immunization', icon: Syringe },
  { href: '/admin/vaccines', label: 'Vaccine Management', icon: Syringe },
  { href: '/admin/users', label: 'User Management', icon: UserCog },
  { href: '/admin/administration', label: 'Administration', icon: Building2 },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    sessionStorage.clear();
    router.replace('/login');
  };

  return (
    <aside
      className={`
        min-h-screen flex flex-col
        transition-all duration-300
        ${collapsed ? 'w-[88px]' : 'w-80'}
        bg-gradient-to-b from-[#0B4FB3] to-[#0A3F8F]
        text-white
      `}
    >
      {/* ================= LOGO ================= */}
      <div className="flex flex-col items-center justify-center py-10">
        <div
          className={`relative transition-all duration-300 ${
            collapsed ? 'w-14 h-14' : 'w-20 h-20'
          }`}
        >
          <Image
            src="/logo.png"
            alt="ImmuniTrack Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {!collapsed && (
          <>
            <span className="mt-4 text-2xl font-semibold tracking-wide">
              ImmuniTrack
            </span>
            <span className="mt-1 text-sm text-white/70">
              Immunization Management System
            </span>
          </>
        )}
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-6 space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-4
                px-5 py-3.5 rounded-xl
                transition
                ${
                  active
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }
              `}
            >
              <Icon size={22} className="shrink-0" />
              {!collapsed && (
                <span className="text-base font-medium">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ================= LOGOUT ================= */}
      <div className="px-6 pb-8">
        <button
          onClick={logout}
          className="
            w-full flex items-center justify-center gap-3
            px-5 py-3.5 rounded-xl
            text-base font-medium
            bg-white/10
            hover:bg-red-500/20
            transition
          "
        >
          <LogOut size={22} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
