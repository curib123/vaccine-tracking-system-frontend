'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import useDebouncedValue from '@/hooks/useDebouncedValue';
import api from '@/lib/api';

const ChildImmunizationRecordModal = dynamic(
  () => import('@/components/immunization/ChildImmunizationRecordModal'),
  { ssr: false }
);

const UpsertChildModal = dynamic(
  () => import('@/components/modal/UpsertChildModal'),
  { ssr: false }
);

type Parent = {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNo?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
};

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
  familyNumber?: string | null;
  summary?: {
    completionRate: number;
    totalCompleted: number;
    totalRequired: number;
  } | null;
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
  total?: number;
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

function ChildrenPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdParam = Number(searchParams.get('childId')) || null;

  const [parents, setParents] = useState<Parent[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<Record<number, Child[]>>({});
  const [selectedChildId, setSelectedChildId] = useState<number | null>(childIdParam);
  const [recordModalOpen, setRecordModalOpen] = useState(Boolean(childIdParam));
  const [cardPayload, setCardPayload] = useState<CardPayload | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 8,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedParentForCreate, setSelectedParentForCreate] = useState<Parent | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const latestRequestRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const syncChildQuery = useCallback(
    (childId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (childId) {
        params.set('childId', String(childId));
      } else {
        params.delete('childId');
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `/admin/children?${nextQuery}` : '/admin/children');
    },
    [router, searchParams]
  );

  const fetchParents = useCallback(async (page: number, preserveContent = hasLoadedRef.current) => {
    const requestId = ++latestRequestRef.current;

    try {
      if (preserveContent) {
        setIsFetching(true);
      } else {
        setLoading(true);
      }

      const params: Record<string, string | number> = {
        page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (debouncedSearch) params.search = debouncedSearch;

      const { data } = await api.get('/parent/getAllParents', { params });
      const parentList = data.data || [];

      setParents(parentList);
      setPagination(data.pagination);

      const childEntries = await Promise.all(
        parentList.map(async (parent: Parent) => {
          const childResponse = await api.get(`/parent/${parent.id}/children`, {
            params: {
              page: 1,
              limit: 100,
              sortBy: 'ranking',
              sortOrder: 'asc',
            },
          });

          return [parent.id, childResponse.data.data || []] as const;
        })
      );

      if (requestId !== latestRequestRef.current) {
        return;
      }

      setChildrenByParent(Object.fromEntries(childEntries));
      hasLoadedRef.current = true;
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [debouncedSearch, pagination.limit]);

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
    fetchParents(1);
  }, [fetchParents]);

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
    await fetchParents(pagination.page, true);

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

  const totalChildrenOnPage = useMemo(
    () => Object.values(childrenByParent).reduce((sum, children) => sum + children.length, 0),
    [childrenByParent]
  );

  if (loading) {
    return <TablePageSkeleton columns={5} rows={6} />;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">Family Registry</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Parents and children records</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Each parent card shows every registered child in birth-order sequence. Click any child to open that child&apos;s immunization record.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setSelectedParentForCreate(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Register Child
          </button>
        </div>
      </header>

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Parent cards</h2>
            <p className="text-sm text-slate-500">
              {parents.length} parent{parents.length === 1 ? '' : 's'} on this page • {totalChildrenOnPage} child
              {totalChildrenOnPage === 1 ? '' : 'ren'} listed
            </p>
            {isFetching && (
              <p className="mt-1 text-xs font-medium text-sky-600">Updating results...</p>
            )}
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parent name or email"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition md:max-w-md focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          {parents.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 xl:col-span-2">
              No parents found.
            </div>
          ) : (
            parents.map(parent => {
              const children = childrenByParent[parent.id] || [];

              return (
                <article
                  key={parent.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{fullName(parent)}</h3>
                        <p className="mt-1 text-sm text-slate-500">{parent.email}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {parent.contactNo || 'No contact number'} • {parent.address || 'No address'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 text-right ring-1 ring-slate-200">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Children</div>
                        <div className="mt-1 text-2xl font-semibold text-[#1d4ed8]">{children.length}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setSelectedParentForCreate(parent);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
                      >
                        <Plus className="h-4 w-4" />
                        Add child
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 px-5 py-5">
                    {children.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No children registered under this parent yet.
                      </div>
                    ) : (
                      children.map(child => {
                        const selected = child.id === selectedChildId && recordModalOpen;

                        return (
                          <div
                            key={child.id}
                            className={`rounded-[22px] border px-4 py-4 transition ${
                              selected
                                ? 'border-[#1d4ed8] bg-[#1d4ed8]/[0.04]'
                                : 'border-slate-200 bg-white hover:border-sky-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => openRecordModal(child.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                    {formatSiblingOrder(child.ranking)}
                                  </div>
                                  <h4 className="mt-3 font-semibold text-slate-900">
                                    {fullName(child)}
                                  </h4>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {new Date(child.birthDate).toLocaleDateString()} • {child.barangay || child.birthPlace}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    Family no.: {child.familyNumber || 'Not set'}
                                  </p>
                                </div>

                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {child.summary?.completionRate ?? 0}%
                                </div>
                              </div>
                            </button>

                            <div className="mt-4 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(child.id);
                                  setSelectedParentForCreate(null);
                                  setModalOpen(true);
                                }}
                                className="rounded-xl border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50"
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
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchParents(pagination.page - 1, true)}
              className="rounded-xl bg-slate-100 px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchParents(pagination.page + 1, true)}
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
        preselectedParent={selectedParentForCreate}
        onClose={() => {
          setModalOpen(false);
          setSelectedParentForCreate(null);
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

export default function ChildrenPage() {
  return (
    <AuthGuard>
      <ChildrenPageContent />
    </AuthGuard>
  );
}
