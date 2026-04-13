'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthGuard from '@/components/guards/AuthGuard';
import type { ChildRecordItem } from '@/components/immunization/ChildImmunizationRecordModal';
import {
  CardRow,
  ChildDetails,
  ImmunizationSummary,
} from '@/components/immunization/ChildImmunizationCard';
import AlertModal from '@/components/modal/AlertModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

const ChildImmunizationRecordModal = dynamic(
  () => import('@/components/immunization/ChildImmunizationRecordModal'),
  { ssr: false }
);

const UpsertChildModal = dynamic(
  () => import('@/components/modal/UpsertChildModal'),
  { ssr: false }
);

type Child = {
  id: number;
  ranking: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  barangay?: string | null;
  healthCenter?: string | null;
  familyNumber?: string | null;
  parent: {
    id: number;
    firstName: string;
    lastName: string;
  };
  summary?: {
    completionRate: number;
    totalCompleted: number;
    totalRequired: number;
  } | null;
  createdAt: string;
};

type CardPayload = {
  child: ChildDetails | null;
  summary: ImmunizationSummary;
  cardRows: CardRow[];
  records: ChildRecordItem[];
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
};

function formatSiblingOrder(ranking: number) {
  const mod10 = ranking % 10;
  const mod100 = ranking % 100;

  if (mod10 === 1 && mod100 !== 11) return `${ranking}st child`;
  if (mod10 === 2 && mod100 !== 12) return `${ranking}nd child`;
  if (mod10 === 3 && mod100 !== 13) return `${ranking}rd child`;
  return `${ranking}th child`;
}

function fullName(person: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
}

function ChildRecordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdParam = Number(searchParams.get('childId')) || null;

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(childIdParam);
  const [recordModalOpen, setRecordModalOpen] = useState(Boolean(childIdParam));
  const [cardPayload, setCardPayload] = useState<CardPayload | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 18,
    totalPages: 1,
    total: 0,
  });

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [progressFilter, setProgressFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const syncChildQuery = useCallback(
    (childId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (childId) {
        params.set('childId', String(childId));
      } else {
        params.delete('childId');
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `/admin/child-records?${nextQuery}` : '/admin/child-records');
    },
    [router, searchParams]
  );

  const fetchChildren = useCallback(async (preserveContent = false) => {
    try {
      if (preserveContent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const params: Record<string, string | number> = {
        page: 1,
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const { data } = await api.get('/child/getAllChildren', { params });
      setChildren(data.data || []);
      setPagination(current => ({
        ...current,
        page: 1,
        total: data.pagination?.total || (data.data || []).length,
      }));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadCard = useCallback(async (childId: number) => {
    try {
      setLoadingCard(true);
      const { data } = await api.get(`/records/child/${childId}`);
      setCardPayload({
        child: data.child,
        summary: data.summary,
        cardRows: data.cardRows || [],
        records: data.data || [],
      });
    } finally {
      setLoadingCard(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!childIdParam) return;

    setSelectedChildId(childIdParam);
    setRecordModalOpen(true);
  }, [childIdParam]);

  useEffect(() => {
    if (!recordModalOpen || !selectedChildId) return;
    loadCard(selectedChildId);
  }, [loadCard, recordModalOpen, selectedChildId]);

  const openRecordModal = (childId: number) => {
    setSelectedChildId(childId);
    setRecordModalOpen(true);
    syncChildQuery(childId);
  };

  const closeRecordModal = () => {
    setRecordModalOpen(false);
    syncChildQuery(null);
  };

  const reload = async () => {
    await fetchChildren(true);

    if (recordModalOpen && selectedChildId) {
      await loadCard(selectedChildId);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.patch(`/child/toggleIsDeleted/${deleteId}`);
    setAlertOpen(false);

    if (selectedChildId === deleteId) {
      setSelectedChildId(null);
      setCardPayload(null);
      setRecordModalOpen(false);
      syncChildQuery(null);
    }

    await reload();
  };

  const visibleChildren = useMemo(() => {
    const localQuery = search.trim().toLowerCase();

    return children
      .filter(child => {
        if (genderFilter === 'ALL') return true;
        return child.gender === genderFilter;
      })
      .filter(child => {
        if (!localQuery) return true;

        const haystack = [
          fullName(child),
          fullName(child.parent),
          child.birthPlace,
          child.barangay || '',
          child.familyNumber || '',
          child.healthCenter || '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(localQuery);
      })
      .filter(child => {
        if (progressFilter === 'ALL') return true;

        const completionRate = child.summary?.completionRate ?? 0;

        if (progressFilter === 'COMPLETE') {
          return completionRate === 100;
        }

        if (progressFilter === 'IN_PROGRESS') {
          return completionRate > 0 && completionRate < 100;
        }

        if (progressFilter === 'NOT_STARTED') {
          return completionRate === 0;
        }

        return true;
      })
      .sort((left, right) => {
        const createdTimeDiff =
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

        if (createdTimeDiff !== 0) {
          return createdTimeDiff;
        }

        return fullName(left).localeCompare(fullName(right));
      });
  }, [children, genderFilter, progressFilter, search]);

  useEffect(() => {
    setPagination(current => ({
      ...current,
      page: 1,
      total: visibleChildren.length,
      totalPages: Math.max(1, Math.ceil(visibleChildren.length / current.limit)),
    }));
  }, [visibleChildren.length]);

  const pagedChildren = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return visibleChildren.slice(start, end);
  }, [pagination.limit, pagination.page, visibleChildren]);

  const childStats = useMemo(() => {
    const totalCompletion = visibleChildren.reduce(
      (sum, child) => sum + (child.summary?.completionRate ?? 0),
      0
    );
    const fullyTracked = visibleChildren.filter(
      child => (child.summary?.completionRate ?? 0) === 100
    ).length;
    const linkedParents = new Set(visibleChildren.map(child => child.parent.id)).size;

    return {
      totalChildren: visibleChildren.length,
      averageCompletion:
        visibleChildren.length === 0 ? 0 : Math.round(totalCompletion / visibleChildren.length),
      fullyTracked,
      linkedParents,
    };
  }, [visibleChildren]);

  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} />;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">Child Registry</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Children records</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Review every registered child as a record card, open the immunization record from the view action, and manage child details without sorting by parent account.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Register Child
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Children on page" value={String(childStats.totalChildren)} />
        <MetricCard label="Average completion" value={`${childStats.averageCompletion}%`} />
        <MetricCard label="Fully tracked" value={String(childStats.fullyTracked)} />
        <MetricCard label="Linked parents" value={String(childStats.linkedParents)} />
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All child records</h2>
            <p className="text-sm text-slate-500">
              Every child appears as an individual record card, newest first, with direct record actions.
            </p>
            {isRefreshing && (
              <p className="mt-1 text-xs font-medium text-sky-600">Refreshing records...</p>
            )}
          </div>

          <div className="grid w-full gap-3 md:max-w-4xl md:grid-cols-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search child, parent, barangay, or family number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="ALL">All genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            <select
              value={progressFilter}
              onChange={e => setProgressFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="ALL">All progress</option>
              <option value="COMPLETE">Fully tracked</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="NOT_STARTED">Not started</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedChildren.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-14 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              No children found.
            </div>
          ) : (
            pagedChildren.map(child => {
              const selected = child.id === selectedChildId && recordModalOpen;

              return (
                <article
                  key={child.id}
                  className={`overflow-hidden rounded-[26px] border bg-white shadow-sm transition ${
                    selected
                      ? 'border-[#1d4ed8] bg-[#1d4ed8]/[0.04]'
                      : 'border-slate-200 hover:border-sky-200 hover:shadow-md'
                  }`}
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {formatSiblingOrder(child.ranking)}
                        </div>
                        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Added {new Date(child.createdAt).toLocaleDateString()}
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-slate-900">
                          {fullName(child)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(child.birthDate).toLocaleDateString()} • {child.gender === 'MALE' ? 'Male' : 'Female'}
                        </p>
                      </div>

                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {child.summary?.completionRate ?? 0}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div className="space-y-3 text-sm">
                      <InfoRow label="Birth place" value={child.birthPlace} />
                      <InfoRow label="Barangay" value={child.barangay || 'Not set'} />
                      <InfoRow label="Family no." value={child.familyNumber || 'Not set'} />
                      <InfoRow label="Health center" value={child.healthCenter || 'Not set'} />
                      <InfoRow label="Parent" value={fullName(child.parent)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <MiniStat
                        label="Completed"
                        value={String(child.summary?.totalCompleted ?? 0)}
                      />
                      <MiniStat
                        label="Required"
                        value={String(child.summary?.totalRequired ?? 0)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openRecordModal(child.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(child.id);
                          setModalOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50"
                        title="Edit Child"
                        aria-label="Edit Child"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(child.id);
                          setAlertOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50"
                        title="Archive Child"
                        aria-label="Archive Child"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination(current => ({
                  ...current,
                  page: Math.max(1, current.page - 1),
                }))
              }
              className="rounded-xl bg-slate-100 px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                setPagination(current => ({
                  ...current,
                  page: Math.min(current.totalPages, current.page + 1),
                }))
              }
              className="rounded-xl bg-slate-100 px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <ChildImmunizationRecordModal
        open={recordModalOpen}
        onClose={closeRecordModal}
        loading={loadingCard}
        childId={selectedChildId}
        child={cardPayload?.child ?? null}
        summary={cardPayload?.summary ?? null}
        cardRows={cardPayload?.cardRows ?? []}
        records={cardPayload?.records ?? []}
        allowStatusUpdate
        onRecordUpdated={reload}
      />

      <UpsertChildModal
        open={modalOpen}
        childId={editingId}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSaved={reload}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Archive child"
        message="This child will be hidden from active lists. Continue?"
        actionLabel="Archive"
        onClose={() => setAlertOpen(false)}
        onAction={confirmDelete}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

export default function ChildRecordsPage() {
  return (
    <AuthGuard>
      <ChildRecordsPageContent />
    </AuthGuard>
  );
}
