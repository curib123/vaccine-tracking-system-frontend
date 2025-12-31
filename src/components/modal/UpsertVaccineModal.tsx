'use client';

import {
  useEffect,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

type VaccineForm = {
  name: string;
  description: string;
  recommendedAge: string;
};

type Props = {
  open: boolean;
  vaccineId?: number | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

const initialForm: VaccineForm = {
  name: '',
  description: '',
  recommendedAge: '',
};

function UpsertVaccineModalContent({
  open,
  vaccineId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(vaccineId);

  const [form, setForm] = useState<VaccineForm>(initialForm);
  const [saving, setSaving] = useState(false);

  /* 🔔 ALERT STATE (IMMEDIATE SHOW) */
  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    open: false,
    type: 'success',
    message: '',
  });

  /* ================= LOAD FOR EDIT ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm(initialForm);
      return;
    }

    (async () => {
      try {
        const res = await api.get(
          `/vaccine/getVaccineById/${vaccineId}`
        );

        setForm({
          name: res.data.data.name || '',
          description: res.data.data.description || '',
          recommendedAge: res.data.data.recommendedAge || '',
        });
      } catch {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load vaccine data',
        });
      }
    })();
  }, [open, vaccineId, isEdit]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.recommendedAge) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Vaccine name and recommended age are required',
      });
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/vaccine/update/${vaccineId}`, form);
      } else {
        await api.post('/vaccine/create', form);
      }

      /* ✅ SHOW ALERT IMMEDIATELY */
      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Vaccine updated successfully'
          : 'Vaccine created successfully',
      });

      onSaved();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save vaccine',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* MODAL */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl animate-scaleIn">

          {/* HEADER */}
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Update Vaccine' : 'Create Vaccine'}
            </h2>
            <p className="text-sm text-slate-500">
              Vaccine information and recommended age
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Vaccine Name
              </label>
              <input
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
                className="mt-1 w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. BCG, OPV, MMR"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Recommended Age
              </label>
              <input
                value={form.recommendedAge}
                onChange={e =>
                  setForm({
                    ...form,
                    recommendedAge: e.target.value,
                  })
                }
                className="mt-1 w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. At birth, 6 weeks, 9 months"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <textarea
                value={form.description}
                onChange={e =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving
                ? 'Saving...'
                : isEdit
                ? 'Update Vaccine'
                : 'Create Vaccine'}
            </button>
          </div>
        </div>
      </div>

      {/* 🔔 ALERT MODAL (NOT GUARDED – IMMEDIATE) */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert(p => ({ ...p, open: false }));
          if (alert.type === 'success') onClose();
        }}
      />
    </>
  );
}

/* ================= EXPORT WITH AUTH GUARD ================= */
export default function UpsertVaccineModal(props: Props) {
  return (
   
      <UpsertVaccineModalContent {...props} />
 
  );
}
