'use client';

import {
  useEffect,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import UpsertAnnouncementModal
  from '@/components/modal/UpsertAnnouncementModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Announcement = {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

/* ================= COMPONENT ================= */
export default function AnnouncementPage() {
  /* ================= STATE ================= */
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  /* MODALS */
  const [openUpsert, setOpenUpsert] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  /* DELETE CONFIRM */
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ALERT */
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'warning',
    message: '',
  });

  const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });


  /* ================= LOAD ================= */
  const loadAnnouncements = async (page = 1) => {
    try {
      setLoading(true);

      const res = await api.get('/announcements/getAll', {
        params: { page, limit: PAGE_SIZE },
      });

      setAnnouncements(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load announcements',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(1);
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/remove/${id}`);

      setAlert({
        open: true,
        type: 'success',
        message: 'Announcement removed successfully',
      });

      loadAnnouncements(pagination.page);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to remove announcement',
      });
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Announcements
            </h1>
            <p className="text-sm text-gray-500">
              Manage system announcements
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedId(null);
              setOpenUpsert(true);
            }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create Announcement
          </button>
        </div>

        {/* TABLE */}
       <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 text-gray-600">
      <tr>
        <th className="px-5 py-3 text-left font-medium">
          Title
        </th>
        <th className="px-5 py-3 text-left font-medium">
          Message
        </th>
        <th className="px-5 py-3 text-center font-medium">
          Status
        </th>
        <th className="px-5 py-3 text-center font-medium">
          Created At
        </th>
        <th className="px-5 py-3 text-right font-medium">
          Actions
        </th>
      </tr>
    </thead>

    <tbody className="divide-y">
      {loading ? (
        <tr>
          <td
            colSpan={5}
            className="px-5 py-8 text-center text-gray-500"
          >
            Loading announcements…
          </td>
        </tr>
      ) : announcements.length === 0 ? (
        <tr>
          <td
            colSpan={5}
            className="px-5 py-8 text-center text-gray-500"
          >
            No announcements found
          </td>
        </tr>
      ) : (
        announcements.map(a => (
          <tr key={a.id} className="hover:bg-gray-50">
            {/* TITLE */}
            <td className="px-5 py-3 font-medium text-gray-800">
              {a.title}
            </td>

            {/* MESSAGE */}
            <td className="px-5 py-3 text-gray-600 max-w-md">
              <p className="line-clamp-2">
                {a.message}
              </p>
            </td>

            {/* STATUS */}
            <td className="px-5 py-3 text-center">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  a.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {a.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>

            {/* CREATED AT */}
            <td className="px-5 py-3 text-center text-gray-500">
              {fmtDate(a.createdAt)}
            </td>

            {/* ACTIONS */}
            <td className="px-5 py-3 text-right space-x-2">
              <button
                onClick={() => {
                  setSelectedId(a.id);
                  setOpenUpsert(true);
                }}
                className="rounded-lg border px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  setDeleteId(a.id);
                  setAlert({
                    open: true,
                    type: 'warning',
                    message:
                      'Are you sure you want to remove this announcement?',
                  });
                }}
                className="rounded-lg border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>

  

  {/* PAGINATION */}
  <div className="flex items-center justify-between px-5 py-4 border-t text-sm">
    <span className="text-gray-500">
      Page {pagination.page} of {pagination.totalPages}
    </span>

    <div className="flex gap-2">
      <button
        disabled={pagination.page <= 1}
        onClick={() =>
          loadAnnouncements(pagination.page - 1)
        }
        className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
      >
        Previous
      </button>

      <button
        disabled={
          pagination.page >= pagination.totalPages
        }
        onClick={() =>
          loadAnnouncements(pagination.page + 1)
        }
        className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
</div>

      </div>

      {/* UPSERT MODAL */}
      <UpsertAnnouncementModal
        open={openUpsert}
        announcementId={selectedId}
        onClose={() => setOpenUpsert(false)}
        onSaved={() => loadAnnouncements(pagination.page)}
      />

      

      {/* ALERT / CONFIRM MODAL */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        actionLabel={deleteId ? 'Yes, Remove' : undefined}
        onAction={
          deleteId
            ? async () => {
                await handleDelete(deleteId);
                setDeleteId(null);
              }
            : undefined
        }
        onClose={() => {
          setAlert(prev => ({ ...prev, open: false }));
          setDeleteId(null);
        }}
      />
    </>
  );
}
