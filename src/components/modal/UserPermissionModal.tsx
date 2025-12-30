'use client';

import {
  useEffect,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Permission = {
  id: number;
  code: string;
};

type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  message: string;
};

type Props = {
  open: boolean;
  userId: number | null;
  onClose: () => void;
  onUpdated: () => void;
};

/* ================= COMPONENT ================= */
export default function UserPermissionModal({
  open,
  userId,
  onClose,
  onUpdated,
}: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    if (!open || !userId) return;

    setSelected([]);

    const load = async () => {
      try {
        const [permRes, userPermRes] = await Promise.all([
          api.get('/roles/getAllPermissions'),
          api.get(`/user/userPermission/${userId}/permissions`),
        ]);

        setPermissions(permRes.data?.data || []);

        setSelected(
          userPermRes.data?.data?.permissions?.map(
            (p: Permission) => p.id
          ) || []
        );
      } catch (err) {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load permissions',
        });
      }
    };

    load();
  }, [open, userId]);

  /* =========================
     ACTIONS
  ========================= */
  const togglePermission = (id: number) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await api.put(`/user/userPermission/${userId}/permissions`, {
        permissionIds: selected,
      });

      setAlert({
        open: true,
        type: 'success',
        message: 'Permissions updated successfully',
      });

      onUpdated();
    } catch (e: any) {
      setAlert({
        open: true,
        type: 'error',
        message: e.response?.data?.message || 'Update failed',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xl px-6">
        {/* MODAL */}
        <div
          className="
            w-full max-w-3xl rounded-[28px] bg-white/95
            shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)]
            animate-scaleIn p-8
          "
        >
          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              User Permissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enable or revoke access capabilities
            </p>
          </div>

          {/* PERMISSIONS */}
          <div
            className="
              mb-10 max-h-[340px] overflow-y-auto
              rounded-2xl bg-slate-50/80 p-5
              shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]
              flex flex-wrap gap-3
            "
          >
            {permissions.map(p => {
              const active = selected.includes(p.id);

              return (
                <button
                  key={p.id}
                  onClick={() => togglePermission(p.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-blue-600 text-white shadow-[0_10px_25px_-10px_rgba(37,99,235,0.8)] scale-[1.05]'
                        : 'bg-white text-slate-600 shadow-md hover:shadow-lg hover:-translate-y-[1px] hover:text-blue-600'
                    }
                  `}
                >
                  {p.code}
                </button>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="
                px-6 py-2.5 rounded-xl
                bg-slate-100 text-slate-600
                shadow hover:shadow-md transition
              "
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="
                px-7 py-2.5 rounded-xl
                bg-blue-600 text-white font-medium
                shadow-[0_15px_35px_-10px_rgba(37,99,235,0.9)]
                hover:bg-blue-700 hover:shadow-[0_20px_45px_-10px_rgba(37,99,235,1)]
                transition disabled:opacity-60
              "
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ALERT MODAL (ALWAYS ON TOP) */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert(a => ({ ...a, open: false }));
          onClose(); // ✅ close permission modal AFTER alert
        }}
      />
    </>
  );
}
