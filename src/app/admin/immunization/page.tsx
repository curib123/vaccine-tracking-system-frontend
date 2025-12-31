'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Child = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
};

type Vaccine = {
  id: number;
  name: string;
};

type RecordStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

type Record = {
  id: number;
  dose: string;
  doseNumber?: number | null;
  status: RecordStatus;
  nextDueDate?: string | null;
  isMissed: boolean;
  isLate: boolean;
  child: Child;
  vaccine: Vaccine;
};

type StatusOption = {
  value: RecordStatus;
  label: string;
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ================= PAGE ================= */
function RecordsPageContent() {
  /* ---------- STATE ---------- */
  const [records, setRecords] = useState<Record[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [missed, setMissed] = useState(false);

  const [sortBy, setSortBy] = useState('nextDueDate');
  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('asc');

  /* ---------- LOAD ---------- */
  useEffect(() => {
    fetchRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, overdue, missed, sortBy, sortOrder]);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    const { data } = await api.get('/records/statuses');
    setStatuses(data.data || []);
  };

  const fetchRecords = async (page: number) => {
    const params: any = {
      page,
      limit: pagination.limit,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (status) params.status = status;
    if (overdue) params.overdue = true;
    if (missed) params.missed = true;

    const { data } = await api.get('/records', { params });

    setRecords(data.data || []);
    setPagination(data.pagination);
  };

  /* ---------- UPDATE STATUS ---------- */
  const updateStatus = async (
    recordId: number,
    newStatus: RecordStatus
  ) => {
    try {
      setUpdatingId(recordId);

      await api.patch(`/records/${recordId}/status`, {
        status: newStatus,
      });

      await fetchRecords(pagination.page);
    } finally {
      setUpdatingId(null);
    }
  };

  const hasData = useMemo(
    () => records.length > 0,
    [records]
  );

  /* ---------- STATUS COLOR ---------- */
  const statusColor = (s: RecordStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-blue-100 text-blue-700';
      case 'SKIPPED':
        return 'bg-slate-100 text-slate-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return '';
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-6">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Immunization Records
        </h1>
        <p className="text-sm text-slate-500">
          Auto-generated child immunization schedules
        </p>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search child or vaccine"
          className="px-4 py-2 rounded-lg border text-sm w-64"
        />

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="">All Status</option>
          {statuses.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={overdue}
            onChange={e => setOverdue(e.target.checked)}
          />
          Overdue
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={missed}
            onChange={e => setMissed(e.target.checked)}
          />
          Missed
        </label>

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={e => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so as 'asc' | 'desc');
          }}
          className="px-4 py-2 rounded-lg border text-sm ml-auto"
        >
          <option value="nextDueDate:asc">Due Date ↑</option>
          <option value="nextDueDate:desc">Due Date ↓</option>
          <option value="createdAt:desc">Created (Newest)</option>
          <option value="status:asc">Status</option>
        </select>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Child</th>
              <th className="px-6 py-3 text-left">Vaccine</th>
              <th className="px-6 py-3 text-left">Dose</th>
              <th className="px-6 py-3 text-left">Due Date</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td colSpan={5} className="py-14 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            )}

            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {r.child.firstName} {r.child.lastName}
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {r.vaccine.name}
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {r.dose}
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {r.nextDueDate
                    ? new Date(r.nextDueDate).toLocaleDateString()
                    : '—'}
                </td>

                <td className="px-6 py-4">
                  <select
                    disabled={updatingId === r.id}
                    value={r.status}
                    onChange={e =>
                      updateStatus(
                        r.id,
                        e.target.value as RecordStatus
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusColor(
                      r.status
                    )}`}
                  >
                    {statuses.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-slate-500">
          <span>
            Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchRecords(pagination.page - 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchRecords(pagination.page + 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================= EXPORT ================= */
export default function RecordsPage() {
  return (
    <AuthGuard>
      <RecordsPageContent />
    </AuthGuard>
  );
}
