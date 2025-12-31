'use client';

import {
  useEffect,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type AnnouncementForm = {
  title: string;
  message: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  announcementId?: number | null; // null = create, number = edit
  onClose: () => void;
  onSaved: () => void;
};

/* ================= INITIAL FORM ================= */
const initialForm: AnnouncementForm = {
  title: '',
  message: '',
  isActive: true,
};

/* ================= COMPONENT ================= */
export default function UpsertAnnouncementModal({
  open,
  announcementId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(announcementId);

  const [form, setForm] = useState<AnnouncementForm>(initialForm);
  const [loading, setLoading] = useState(false);

  /* 🔔 ALERT MODAL */
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  });

  /* ================= LOAD DATA (EDIT) ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm(initialForm);
      return;
    }

    setLoading(true);

    api
      .get(`/announcements/get/${announcementId}`)
      .then(res => {
        setForm({
          title: res.data.data.title,
          message: res.data.data.message,
          isActive: res.data.data.isActive,
        });
      })
      .catch(() => {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load announcement',
        });
      })
      .finally(() => setLoading(false));
  }, [open, isEdit, announcementId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Title and message are required',
      });
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await api.put(
          `/announcements/update/${announcementId}`,
          form
        );
      } else {
        await api.post('/announcements/create', form);
      }

      /* 🔥 SHOW IMMEDIATELY */
      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Announcement updated successfully'
          : 'Announcement created successfully',
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save announcement',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* ================= UI ================= */
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl animate-scaleIn">
          {/* HEADER */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {isEdit ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEdit
                ? 'Update announcement details'
                : 'Create a new announcement'}
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e =>
                  setForm({ ...form, title: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={e =>
                  setForm({ ...form, message: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Write announcement message..."
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Active Status
                </p>
                <p className="text-xs text-gray-500">
                  Show this announcement publicly
                </p>
              </div>

              <button
                onClick={() =>
                  setForm({
                    ...form,
                    isActive: !form.isActive,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading
                ? 'Saving...'
                : isEdit
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* 🔔 ALERT */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />
    </>
  );
}
