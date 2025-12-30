'use client';

import {
  useEffect,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Permission = {
  id: number;
  code: string;
};

type Props = {
  open: boolean;
  roleId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  message: string;
};

/* ================= COMPONENT ================= */
export default function RoleModal({
  open,
  roleId = null,
  onClose,
  onSuccess,
}: Props) {
  /* ================= STATE ================= */
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  /* ================= LOAD DATA ================= */
  const loadPermissions = async () => {
    const { data } = await api.get('/roles/getAllPermissions');
    setPermissions(data.data || []);
  };

  const loadRole = async () => {
    if (!roleId) return;
    const { data } = await api.get(`/roles/getRole/${roleId}`);
    const role = data.data;

    setName(role.name);
    setDescription(role.description || '');
    setSelectedPermissions(
      role.permissions?.map((p: any) => p.permission.id) || []
    );
  };

  useEffect(() => {
    if (!open) return;

    setName('');
    setDescription('');
    setSelectedPermissions([]);

    loadPermissions();
    loadRole();
  }, [open, roleId]);

  /* ================= ACTIONS ================= */
  const togglePermission = (id: number) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Role name is required',
      });
      return;
    }

    setLoading(true);

    try {
      if (!roleId) {
        await api.post('/roles/create', {
          name,
          description,
          permissionIds: selectedPermissions,
        });
      } else {
        await api.put(`/roles/updateRole/${roleId}`, {
          name,
          description,
        });

        await api.put(`/roles/updatePermission/${roleId}/permissions`, {
          permissionIds: selectedPermissions,
        });
      }

      // ✅ SHOW ALERT FIRST
      setAlert({
        open: true,
        type: 'success',
        message: roleId
          ? 'Role updated successfully'
          : 'Role created successfully',
      });

      onSuccess();

      // ✅ CLOSE MODAL AFTER ALERT RENDERS
      setTimeout(() => {
        onClose();
      }, 150);
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err.response?.data?.message ||
          'Failed to save role',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <AuthGuard>
      <>
        {/* ================= MODAL ================= */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-scaleIn">
              {/* Header */}
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {roleId ? 'Update Role' : 'Create Role'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Control system access using permissions
                </p>
              </div>

              {/* Role Name */}
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role Name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ADMIN / HEALTH / PARENT"
                  className="w-full rounded-xl bg-white px-4 py-3 shadow-sm outline-none
                    focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl bg-white px-4 py-3 shadow-sm outline-none
                    focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                />
              </div>

              {/* Permissions */}
              <div className="mb-7">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Permissions
                </label>

                <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-2xl bg-slate-100/70 p-4 shadow-inner">
                  {permissions.map(p => {
                    const selected = selectedPermissions.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                          ${
                            selected
                              ? 'bg-blue-600 text-white shadow-md scale-[1.03]'
                              : 'bg-white text-slate-600 shadow hover:text-blue-600 hover:shadow-md'
                          }`}
                      >
                        {p.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl bg-white px-5 py-2.5 text-slate-600 shadow transition hover:shadow-md"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-white shadow-md transition
                    hover:bg-blue-700 hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ALERT (ALWAYS MOUNTED) ================= */}
        <AlertModal
          open={alert.open}
          type={alert.type}
          message={alert.message}
          onClose={() =>
            setAlert(prev => ({ ...prev, open: false }))
          }
        />
      </>
    </AuthGuard>
  );
}
