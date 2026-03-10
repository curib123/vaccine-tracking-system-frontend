'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import GenerateVaccineModal
  from '@/components/modal/GenerateVaccineModal'; // 🆕
import UpsertChildModal from '@/components/modal/UpsertChildModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Child = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  createdAt: string;
  parent?: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ================= PAGE CONTENT ================= */
function ChildrenPageContent() {
  /* ================= STATE ================= */
  const [children, setChildren] = useState<Child[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🆕 Generate vaccine modal state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateChildId, setGenerateChildId] =
    useState<number | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchChildren(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchChildren = async (page: number) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;

      const { data } = await api.get(
        '/child/getAllChildren',
        { params }
      );

      setChildren(data.data || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => fetchChildren(pagination.page);

  /* ================= ACTIONS ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    await api.patch(
      `/child/toggleIsDeleted/${deleteId}`
    );
    setAlertOpen(false);
    reload();
  };

  /* ================= MEMO ================= */
  const hasData = useMemo(
    () => children.length > 0,
    [children]
  );

  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} />;
  }

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8">
      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Child Records
          </h1>
          <p className="text-sm text-slate-500">
            Manage registered children and guardians
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedId(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Register Child
        </button>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search child name or birthplace"
          className="px-4 py-2 rounded-lg border text-sm w-72"
        />
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">
                Child
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Gender
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Birth Date
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Birth Place
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Parent
              </th>
              <th className="px-6 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td
                  colSpan={6}
                  className="py-14 text-center text-slate-400"
                >
                  No children found
                </td>
              </tr>
            )}

            {children.map(c => (
              <tr
                key={c.id}
                className="hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4 font-medium text-slate-800">
                  {c.firstName} {c.middleName}{' '}
                  {c.lastName}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {c.gender}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {new Date(
                    c.birthDate
                  ).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {c.birthPlace}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {c.parent
                    ? `${c.parent.firstName} ${c.parent.lastName}`
                    : '—'}
                </td>

                <td className="px-6 py-4 text-right space-x-2">
                  {/* 🆕 GENERATE VACCINE */}
                  <button
                    onClick={() => {
                      setGenerateChildId(c.id);
                      setGenerateOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-green-600 shadow hover:shadow-md transition text-xs"
                  >
                    Add Vaccine Record
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(c.id);
                      setModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-blue-600 shadow hover:shadow-md transition text-xs"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setDeleteId(c.id);
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
            Page <strong>{pagination.page}</strong>{' '}
            of{' '}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                fetchChildren(pagination.page - 1)
              }
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={
                pagination.page === pagination.totalPages
              }
              onClick={() =>
                fetchChildren(pagination.page + 1)
              }
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <UpsertChildModal
        open={modalOpen}
        childId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />

      {/* 🆕 GENERATE VACCINE MODAL */}
      <GenerateVaccineModal
        open={generateOpen}
        childId={generateChildId}
        onClose={() => {
          setGenerateOpen(false);
          setGenerateChildId(null);
        }}
        onGenerated={() => {
          setGenerateOpen(false);
          setGenerateChildId(null);
          reload();
        }}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Remove Child"
        message="Are you sure you want to remove this child?"
        actionLabel="Remove"
        onClose={() => setAlertOpen(false)}
        onAction={confirmDelete}
      />
    </div>
  );
}

/* ================= EXPORT ================= */
export default function ChildrenPage() {
  return (
    <AuthGuard>
      <ChildrenPageContent />
    </AuthGuard>
  );
}
