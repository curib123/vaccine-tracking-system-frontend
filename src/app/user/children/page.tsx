'use client';

import { useEffect, useState } from 'react';

import ParentGuard from '@/components/guards/ParentGuard';
import ChildImmunizationRecordModal, {
  ChildRecordItem,
} from '@/components/immunization/ChildImmunizationRecordModal';
import {
  CardRow,
  ChildDetails,
  ImmunizationSummary,
} from '@/components/immunization/ChildImmunizationCard';
import AlertModal from '@/components/modal/AlertModal';
import { CardListSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

type SessionUser = {
  id?: number;
};

type Child = {
  id: number;
  ranking: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
};

type CardPayload = {
  child: ChildDetails | null;
  summary: ImmunizationSummary;
  cardRows: CardRow[];
  records: ChildRecordItem[];
};

function formatSiblingOrder(ranking: number) {
  const mod10 = ranking % 10;
  const mod100 = ranking % 100;

  if (mod10 === 1 && mod100 !== 11) return `${ranking}st child`;
  if (mod10 === 2 && mod100 !== 12) return `${ranking}nd child`;
  if (mod10 === 3 && mod100 !== 13) return `${ranking}rd child`;
  return `${ranking}th child`;
}

export default function ParentChildrenPage() {
  return (
    <ParentGuard>
      <ParentChildrenContent />
    </ParentGuard>
  );
}

function ParentChildrenContent() {
  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [cardPayload, setCardPayload] = useState<CardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCard, setLoadingCard] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'error' | 'success',
    message: '',
  });

  useEffect(() => {
    if (!user?.id) return;

    api
      .get(`/parent/${user.id}/children`, {
        params: {
          page: 1,
          limit: 50,
        },
      })
      .then(res => {
        const list = res.data.data || [];
        setChildren(list);
        if (list[0]?.id) {
          setSelectedChildId(list[0].id);
        }
      })
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load your children.',
        })
      )
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!recordModalOpen || !selectedChildId) return;

    setLoadingCard(true);

    api
      .get(`/records/child/${selectedChildId}`)
      .then(res =>
        setCardPayload({
          child: res.data.child,
          summary: res.data.summary,
          cardRows: res.data.cardRows || [],
          records: res.data.data || [],
        })
      )
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load the immunization card.',
        })
      )
      .finally(() => setLoadingCard(false));
  }, [recordModalOpen, selectedChildId]);

  const openChildModal = (childId: number) => {
    setSelectedChildId(childId);
    setRecordModalOpen(true);
  };

  return (
    <>
      <header className="relative mb-8 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0f5b63_0%,#167a76_60%,#f6c94c_100%)] px-8 py-10 text-white shadow-sm">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.28em] text-white/70">Family Records</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Child Immunization Cards</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Review each child&apos;s vaccine schedule in a modal card view using the same layout used at the health center.
          </p>
        </div>
      </header>

      {loading ? (
        <CardListSkeleton count={2} />
      ) : children.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-black/5">
          No child records found for this account.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children.map(child => (
            <button
              key={child.id}
              type="button"
              onClick={() => openChildModal(child.id)}
              className={`rounded-[24px] border bg-white px-5 py-5 text-left shadow-sm ring-1 ring-black/5 transition ${
                selectedChildId === child.id && recordModalOpen
                  ? 'border-[#0f5b63] bg-[#0f5b63]/[0.04]'
                  : 'border-slate-200 hover:border-sky-200'
              }`}
            >
              <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {formatSiblingOrder(child.ranking)}
              </div>
              <div className="mt-3 font-semibold text-slate-900">
                {child.firstName} {child.lastName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Born {child.birthDate ? new Date(child.birthDate).toLocaleDateString() : 'Unknown'}
              </div>
            </button>
          ))}
        </div>
      )}

      <ChildImmunizationRecordModal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        loading={loadingCard}
        childId={selectedChildId}
        child={cardPayload?.child ?? null}
        summary={cardPayload?.summary ?? null}
        cardRows={cardPayload?.cardRows ?? []}
        records={cardPayload?.records ?? []}
      />

      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
      />
    </>
  );
}
