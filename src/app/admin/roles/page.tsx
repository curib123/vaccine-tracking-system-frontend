'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import RoleModal from '@/components/modal/RoleModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Role = {
  id: number;
  name: string;
  description?: string;
};

type AlertState = {
  open: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  action?: () => void;
};

/* ================= PAGE CONTENT ================= */
function RolesPageContent() {
  useSessionGuard({ mode: 'protected', redirectTo: '/login' });

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  /* Modals */
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  /* Alert */
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  /* ================= FETCH ROLES ================= */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/roles/getAllRoles');
      setRoles(data.data || []);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load roles',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /* ================= ACTION HANDLERS ================= */
  const openCreateRole = () => {
    setEditingRoleId(null);
    setOpenRoleModal(true);
  };

  const openEditRole = (id: number) => {
    setEditingRoleId(id);
    setOpenRoleModal(true);
  };

  const confirmRemoveRole = (id: number) => {
    setAlert({
      open: true,
      type: 'warning',
      message: 'Are you sure you want to remove this role?',
      action: async () => {
        try {
          await api.patch(`/roles/removeRole/${id}/delete-role`);
          setAlert({
            open: true,
            type: 'success',
            message: 'Role removed successfully',
          });
          fetchRoles();
        } catch (err: any) {
          setAlert({
            open: true,
            type: 'error',
            message:
              err.response?.data?.message ||
              'Failed to remove role',
          });
        }
      },
    });
  };

  /* ================= RENDER ================= */
  if (loading) {
    return <TablePageSkeleton columns={3} rows={5} showFilters={false} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen px-6 py-8 space-y-8">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Roles
          </h1>
          <p className="text-sm text-slate-500">
            Manage system access roles and permissions
          </p>
        </div>

        <button
          onClick={openCreateRole}
          className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 shadow-sm hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          Create Role
        </button>
      </header>

      {/* Table */}
      <section className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold uppercase text-slate-600">
            Available Roles
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map(role => (
              <tr
                key={role.id}
                className="border-t hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4 font-medium text-slate-800">
                  {role.name}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {role.description || '—'}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditRole(role.id)}
                      className="p-2 rounded-lg border text-blue-600 hover:bg-blue-50 transition"
                      title="Edit Role"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => confirmRemoveRole(role.id)}
                      className="p-2 rounded-lg border text-red-600 hover:bg-red-50 transition"
                      title="Remove Role"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && roles.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  No roles found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Role Modal */}
      <RoleModal
        open={openRoleModal}
        roleId={editingRoleId}
        onClose={() => setOpenRoleModal(false)}
        onSuccess={fetchRoles}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        actionLabel={alert.action ? 'Confirm' : undefined}
        onAction={alert.action}
        onClose={() =>
          setAlert({ ...alert, open: false })
        }
      />
    </div>
  );
}

/* ================= PAGE ================= */
export default function RolesPage() {
  return (
    <AuthGuard>
      <RolesPageContent />
    </AuthGuard>
  );
}
