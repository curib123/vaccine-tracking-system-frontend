'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Baby,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

import ParentGuard from '@/components/guards/ParentGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* =====================================================
   TYPES (MATCH BACKEND)
===================================================== */

type SessionUser = {
  id?: number;
  firstName?: string;
  lastName?: string;
};

type Child = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: string;
  birthPlace?: string;
  createdAt: string;
};

type ImmunizationRecord = {
  id: number;
  vaccine: {
    name: string;
  };
  dose?: string;
  doseNumber?: number;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  dateGiven?: string;
  nextDueDate?: string;
  isMissed: boolean;
  isLate: boolean;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* =====================================================
   PAGE
===================================================== */

export default function ParentChildrenPage() {
  return (
    <ParentGuard>
      <ParentChildrenContent />
    </ParentGuard>
  );
}

/* =====================================================
   CONTENT
===================================================== */

function ParentChildrenContent() {
  const [user, setUser] = useState<SessionUser | null>(null);

  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<
    Record<number, ImmunizationRecord[]>
  >({});

  const [expandedChildId, setExpandedChildId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  /* QUERY STATE */
  const [page, setPage] = useState(1);
  const limit = 6;

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [sortBy, setSortBy] =
    useState<'createdAt' | 'firstName'>('createdAt');
  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  });

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'error' | 'success',
    message: '',
  });

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch {}
  }, []);

  /* ================= LOAD CHILDREN ================= */
  const loadChildren = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/parent/${user.id}/children`,
        {
          params: {
            page,
            limit,
            search: search || undefined,
            gender: gender || undefined,
            sortBy,
            sortOrder,
          },
        }
      );

      setChildren(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load children information.',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD RECORDS ================= */
  const loadRecords = async (childId: number) => {
    if (records[childId]) return;

    const res = await api.get(`/records/child/${childId}`);

    setRecords(p => ({
      ...p,
      [childId]: res.data.data || [],
    }));
  };

  const queryKey = useMemo(
    () => `${page}|${search}|${gender}|${sortBy}|${sortOrder}`,
    [page, search, gender, sortBy, sortOrder]
  );

  useEffect(() => {
    loadChildren();
  }, [queryKey, user?.id]);

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 px-8 py-10 text-white shadow-sm">
        <div className="relative z-10">
          <p className="text-sm text-blue-100">
            Family Overview
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Your Children
          </h1>
          <p className="mt-2 max-w-xl text-sm text-blue-100">
            View your children’s details and immunization
            records.
          </p>
        </div>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </header>

      {/* ================= FILTER BAR ================= */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <input
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search child name…"
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5"
        />

        <select
          value={gender}
          onChange={e => {
            setPage(1);
            setGender(e.target.value as any);
          }}
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5"
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <select
          value={sortBy}
          onChange={e =>
            setSortBy(e.target.value as any)
          }
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5"
        >
          <option value="createdAt">Date Added</option>
          <option value="firstName">First Name</option>
        </select>

        <button
          onClick={() =>
            setSortOrder(o =>
              o === 'asc' ? 'desc' : 'asc'
            )
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5"
        >
          <Filter className="h-4 w-4" />
          {sortOrder === 'asc'
            ? 'Ascending'
            : 'Descending'}
        </button>
      </div>

      {/* ================= CHILD CARDS ================= */}
      {loading ? (
        <Skeleton />
      ) : children.length === 0 ? (
        <Empty />
      ) : (
        <section className="space-y-4">
          {children.map(child => {
            const expanded =
              expandedChildId === child.id;

            return (
              <article
                key={child.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                {/* CHILD HEADER */}
                <button
                  onClick={async () => {
                    setExpandedChildId(
                      expanded ? null : child.id
                    );
                    if (!expanded) {
                      await loadRecords(child.id);
                    }
                  }}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <Baby className="h-6 w-6" />
                    </div>

                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {child.gender} • Born{' '}
                        {fmtDate(child.birthDate)}
                      </p>
                    </div>
                  </div>

                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {/* IMMUNIZATION RECORDS */}
                {expanded && (
                  <div className="mt-5 space-y-2">
                    {records[child.id]?.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No immunization records available.
                      </p>
                    ) : (
                      records[child.id]?.map(record => (
                        <RecordRow
                          key={record.id}
                          record={record}
                        />
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* ================= PAGINATION ================= */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {pagination.page} of{' '}
            {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-xl bg-slate-100 px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={
                page >= pagination.totalPages
              }
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl bg-slate-100 px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= ALERT ================= */}
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

/* =====================================================
   RECORD ROW
===================================================== */

function RecordRow({
  record,
}: {
  record: ImmunizationRecord;
}) {
  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  const statusStyles: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    SKIPPED: 'bg-slate-100 text-slate-500',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {record.vaccine.name}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Dose {record.doseNumber ?? '—'}
            {record.dose ? ` • ${record.dose}` : ''}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Given: {fmtDate(record.dateGiven)}
          </p>

          {record.status === 'PENDING' && (
            <p className="mt-0.5 text-xs text-slate-500">
              Next due:{' '}
              {fmtDate(record.nextDueDate)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[record.status]}`}
          >
            {record.status}
          </span>

          {record.isMissed && (
            <span className="text-xs font-medium text-red-600">
              Missed
            </span>
          )}

          {record.isLate && !record.isMissed && (
            <span className="text-xs font-medium text-amber-600">
              Late
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STATES
===================================================== */

function Empty() {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-slate-500">
        No children found.
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-28 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
