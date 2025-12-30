'use client';

import {
  useEffect,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Role = {
  id: number;
  name: string;
  description: string;
};

/* ================= PAGE ================= */
function RolesPageContent() {
  useSessionGuard({ mode: 'protected', redirectTo: '/login' });

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data } = await api.get('/roles/getAllRoles');
    setRoles(data.data || []);
  };

  return (
    <div className="bg-slate-50 min-h-screen px-6 py-8 space-y-10">

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Roles
        </h1>
        <p className="text-sm text-slate-500">
          System access roles
        </p>
      </header>

      <section className="bg-white rounded-xl shadow-md">
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold uppercase text-slate-700">
            Available Roles
          </h2>
        </div>

        <table className="w-full text-sm">
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {role.name}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {role.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function RolesPage() {
  return (
    <AuthGuard>
      <RolesPageContent />
    </AuthGuard>
  );
}
