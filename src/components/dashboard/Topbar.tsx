'use client';

import axios from 'axios';
import {
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import api from '@/lib/api'; // ✅ Axios Bearer instance

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/children': 'Parent Records',
  '/admin/child-records': 'Children Records',
  '/admin/notifications': 'Notifications',
  '/admin/parents': 'Parent Records',
  '/admin/immunization': 'Children Records',
  '/admin/due-immunizations': 'Due Immunizations',
  '/admin/reports': 'Vaccination Reports',
  '/admin/vaccines': 'Vaccine Management',
  '/admin/user': 'User Management',
  '/admin/roles': 'Role Management',
  '/admin/administration': 'Administration',
};

export default function Topbar({
  user,
  onToggle,
}: {
  user: {
    firstName?: string;
    lastName?: string;
    roleName?: string;
  } | null;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const title =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[
      Object.keys(PAGE_TITLES).find((key) =>
        pathname.startsWith(key)
      ) || ''
    ] ??
    'Dashboard';

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      await api.post('/auth/logoutUser'); // 🔐 Bearer token sent automatically

      sessionStorage.clear(); // remove JWT
      localStorage.clear();
      router.replace('/login');
    } catch (error: unknown) {
      const details = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error;

      console.error('Logout failed', details);
    }
  };

  return (
    <header
      className="
        sticky top-0 z-40
        h-20
        px-6
        py-3
        flex items-center justify-between
        backdrop-blur-xl
        bg-white/70
        border-b border-white/30
        shadow-[0_8px_30px_rgba(0,0,0,0.06)]
      "
    >
      {/* ================= LEFT ================= */}
      <div className="flex items-center gap-5">
        <button
          onClick={onToggle}
          className="
            p-2.5
            rounded-xl
            bg-white/60
            hover:bg-white/90
            transition
            shadow-sm
          "
        >
          <Menu className="text-[#0B4FB3]" size={22} />
        </button>

        <div className="leading-tight">
          <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Health Center System
          </p>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-7">
        {/* User Info */}
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            {user?.firstName} {user?.lastName}
          </p>
          <span
            className="
              inline-block mt-1
              px-3 py-0.5
              rounded-full
              text-xs font-medium
              bg-blue-500/90 text-white
            "
          >
            {user?.roleName}
          </span>
        </div>

        {/* Avatar + Dropdown */}
        <div className="relative group">
          <div
            className="
              w-11 h-11
              rounded-full
              bg-gradient-to-br from-[#0B4FB3] to-[#0A3F8F]
              text-white
              flex items-center justify-center
              font-semibold
              shadow-md
              cursor-pointer
              ring-2 ring-white/60
            "
          >
            {user?.firstName?.charAt(0) ?? <User size={18} />}
          </div>

          {/* Dropdown */}
          <div
            className="
              absolute right-0 mt-4 w-40
              rounded-2xl
              bg-white/80
              backdrop-blur-xl
              border border-white/40
              shadow-xl
              opacity-0 scale-95
              pointer-events-none
              group-hover:opacity-100
              group-hover:scale-100
              group-hover:pointer-events-auto
              transition-all duration-200
            "
          >
            <button
              onClick={logout}
              className="
                w-full flex items-center gap-2
                px-4 py-3
                text-sm font-medium text-gray-700
                hover:bg-red-50
                hover:text-red-600
                rounded-2xl
                transition
              "
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
