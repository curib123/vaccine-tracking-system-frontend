'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import UpsertVaccineModal from '@/components/modal/UpsertVaccineModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Vaccine = {
  id: number;
  name: string;
  description?: string;
  recommendedAge: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ================= PAGE ================= */
function VaccinePageContent() {
  /* ================= STATE ================= */
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchVaccines(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder]);

  const fetchVaccines = async (page: number) => {
    const params: any = {
      page,
      limit: pagination.limit,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;

    const { data } = await api.get('/vaccine/getAllVaccines', { params });

    setVaccines(data.data || []);
    setPagination(data.pagination);
  };

  const reload = () => fetchVaccines(pagination.page);

  /* ================= ACTIONS ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    await api.patch(`/vaccine/toggleIsDeleted/${deleteId}`);
    setAlertOpen(false);
    reload();
  };

  /* ================= MEMO ================= */
  const hasData = useMemo(() => vaccines.length > 0, [vaccines]);

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8">

      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Vaccine Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage vaccines and recommended schedules
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedId(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Create Vaccine
        </button>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vaccine"
          className="px-4 py-2 rounded-lg border text-sm w-64"
        />

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={e => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so as 'asc' | 'desc');
          }}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="name:asc">Name A–Z</option>
          <option value="recommendedAge:asc">Recommended Age</option>
        </select>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Vaccine</th>
              <th className="px-6 py-3 text-left font-medium">
                Recommended Age
              </th>
              <th className="px-6 py-3 text-left font-medium">Description</th>
              <th className="px-6 py-3 text-left font-medium">Created</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td
                  colSpan={5}
                  className="py-14 text-center text-slate-400"
                >
                  No vaccines found
                </td>
              </tr>
            )}

            {vaccines.map(v => (
              <tr key={v.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {v.name}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {v.recommendedAge}
                </td>

                <td className="px-6 py-4 text-slate-500 max-w-[300px] truncate">
                  {v.description || '—'}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setSelectedId(v.id);
                      setModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-blue-600 shadow hover:shadow-md transition text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setDeleteId(v.id);
                      setAlertOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-red-600 shadow hover:shadow-md transition text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 text-sm text-slate-500">
          <span>
            Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchVaccines(pagination.page - 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchVaccines(pagination.page + 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <UpsertVaccineModal
        open={modalOpen}
        vaccineId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Remove Vaccine"
        message="Are you sure you want to remove this vaccine?"
        actionLabel="Remove"
        onClose={() => setAlertOpen(false)}
        onAction={confirmDelete}
      />
    </div>
  );
}

/* ================= EXPORT ================= */
export default function VaccinePage() {
  return (
    <AuthGuard>
      <VaccinePageContent />
    </AuthGuard>
  );
}
