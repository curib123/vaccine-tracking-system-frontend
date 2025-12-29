'use client';

import {
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

/* 🔹 SAME ROUTES AS SIDEBAR */
const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/children': 'Children Records',
  '/admin/parents': 'Parent Management',
  '/admin/immunization': 'Immunization',
  '/admin/vaccines': 'Vaccine Management',
  '/admin/user': 'User Management',
  '/admin/administration': 'Administration',
};

export default function Topbar({
  user,
  collapsed,
  onToggle,
}: {
  user: any;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /* 🔹 Resolve title */
  const title =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[
      Object.keys(PAGE_TITLES).find((key) =>
        pathname.startsWith(key)
      ) || ''
    ] ??
    'Dashboard';

  const logout = () => {
    sessionStorage.clear();
    router.replace('/login');
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
      {/* ================= Left ================= */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <Menu className="text-[#0B4FB3]" size={22} />
        </button>

        {/* 🔹 DYNAMIC TITLE */}
        <h1 className="text-lg font-semibold text-gray-800">
          {title}
        </h1>
      </div>

      {/* ================= Right ================= */}
      <div className="flex items-center gap-6">
        {/* User Info */}
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            {user?.firstName} {user?.lastName}
          </p>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white">
            {user?.roleName}
          </span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-[#0B4FB3] text-white flex items-center justify-center font-semibold cursor-pointer">
            {user?.firstName?.charAt(0) ?? <User size={18} />}
          </div>

          <div className="absolute right-0 mt-2 w-36 bg-white border rounded-xl shadow-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl"
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
