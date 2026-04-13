'use client';

import { useMemo, useState } from 'react';

import { Download, ExternalLink, X } from 'lucide-react';

import ChildImmunizationCard, {
  CardRow,
  ChildDetails,
  ImmunizationSummary,
} from '@/components/immunization/ChildImmunizationCard';
import UpdateRecordStatusModal from '@/components/modal/UpdateRecordStatusModal';

export type ChildRecordItem = {
  id: number;
  dose: string;
  doseNumber?: number | null;
  scheduleLabel?: string | null;
  status: string;
  nextDueDate?: string | null;
  dateGiven?: string | null;
  remarks?: string | null;
  isLate?: boolean;
  isMissed?: boolean;
  vaccine: {
    name: string;
  };
};

type EditableRecord = ChildRecordItem & {
  child?: {
    firstName: string;
    lastName: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  childId?: number | null;
  child: ChildDetails | null;
  summary: ImmunizationSummary;
  cardRows: CardRow[];
  records: ChildRecordItem[];
  allowStatusUpdate?: boolean;
  onRecordUpdated?: () => void | Promise<void>;
};

export default function ChildImmunizationRecordModal({
  open,
  onClose,
  loading = false,
  childId = null,
  child,
  summary,
  cardRows,
  records,
  allowStatusUpdate = false,
  onRecordUpdated,
}: Props) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EditableRecord | null>(null);

  const grouped = useMemo(
    () =>
      records.reduce(
        (acc, record) => {
          if (record.status === 'COMPLETED') {
            acc.completed.push(record);
          } else {
            acc.pending.push(record);
          }

          return acc;
        },
        {
          pending: [] as ChildRecordItem[],
          completed: [] as ChildRecordItem[],
        }
      ),
    [records]
  );

  const latestPendingRecords = useMemo(() => {
    const prioritizedPending = grouped.pending
      .slice()
      .sort((left, right) => {
        const leftTime = left.nextDueDate ? new Date(left.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.nextDueDate ? new Date(right.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;

        if (leftTime !== rightTime) {
          return leftTime - rightTime;
        }

        return left.id - right.id;
      });

    const seenVaccines = new Set<string>();

    return prioritizedPending.filter(record => {
      const vaccineKey = String(record.vaccine.name).toLowerCase();

      if (seenVaccines.has(vaccineKey)) {
        return false;
      }

      seenVaccines.add(vaccineKey);
      return true;
    });
  }, [grouped.pending]);

  const timelineItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records
      .map(record => {
        const dueDate = record.nextDueDate ? new Date(record.nextDueDate) : null;
        const givenDate = record.dateGiven ? new Date(record.dateGiven) : null;
        const status = String(record.status || '').toUpperCase();
        const isCompleted = status === 'COMPLETED';
        const isPending = status === 'PENDING';
        const isAttentionNeeded =
          Boolean(record.isMissed) ||
          status === 'SKIPPED' ||
          status === 'CANCELLED' ||
          Boolean(record.isLate) ||
          (isPending && dueDate ? dueDate.getTime() < today.getTime() : false);
        const sortDate = givenDate ?? dueDate;

        return {
          ...record,
          status,
          dueDate,
          givenDate,
          sortTime: sortDate ? sortDate.getTime() : Number.MAX_SAFE_INTEGER,
          isCompleted,
          isPending,
          isAttentionNeeded,
        };
      })
      .sort((left, right) => {
        if (left.sortTime !== right.sortTime) {
          return left.sortTime - right.sortTime;
        }

        const vaccineDiff = left.vaccine.name.localeCompare(right.vaccine.name);

        if (vaccineDiff !== 0) {
          return vaccineDiff;
        }

        return (left.doseNumber ?? left.id) - (right.doseNumber ?? right.id);
      });
  }, [records]);

  if (!open) return null;

  const childName = child
    ? {
        firstName: child.firstName,
        lastName: child.lastName,
      }
    : undefined;

  const openStatusModal = (record: ChildRecordItem) => {
    setSelectedRecord({
      ...record,
      child: childName,
    });
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedRecord(null);
  };

  const openPrintView = (autoPrint = false) => {
    if (!childId || typeof window === 'undefined') return;

    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');

    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', user);
    }

    const url = autoPrint
      ? `/print/child/${childId}?autoprint=1`
      : `/print/child/${childId}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
        <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-[#eef3f8] shadow-2xl ring-1 ring-white/40">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f5b63]">
                Child Records
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {child ? `${child.firstName} ${child.lastName}` : 'Child immunization record'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openPrintView(false)}
                disabled={!childId}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open printable form
              </button>
              <button
                type="button"
                onClick={() => openPrintView(true)}
                disabled={!childId}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0f5b63] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0b4d54] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close immunization record"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {loading ? (
              <div className="rounded-[28px] bg-white px-6 py-20 text-center text-sm text-slate-400 shadow-sm ring-1 ring-black/5">
                Loading child immunization record...
              </div>
            ) : (
              <>
                <ChildImmunizationCard
                  child={child}
                  summary={summary}
                  cardRows={cardRows}
                  showLowStockBadge={false}
                />

                <ImmunizationTimeline records={timelineItems} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <RecordPanel
                    title="Pending / Due"
                    emptyLabel="No pending doses."
                    records={latestPendingRecords}
                    accent="amber"
                    canUpdate={allowStatusUpdate}
                    onUpdateRecord={openStatusModal}
                  />
                  <RecordPanel
                    title="Completed"
                    emptyLabel="No completed doses yet."
                    records={grouped.completed}
                    accent="emerald"
                    canUpdate={false}
                    onUpdateRecord={openStatusModal}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <UpdateRecordStatusModal
        open={statusModalOpen}
        record={selectedRecord}
        onClose={closeStatusModal}
        onSaved={async () => {
          await onRecordUpdated?.();
          closeStatusModal();
        }}
      />
    </>
  );
}

function ImmunizationTimeline({
  records,
}: {
  records: Array<
    ChildRecordItem & {
      status: string;
      dueDate: Date | null;
      givenDate: Date | null;
      sortTime: number;
      isCompleted: boolean;
      isPending: boolean;
      isAttentionNeeded: boolean;
    }
  >;
}) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Tracking timeline</h3>
          <p className="text-sm text-slate-500">
            Follow each dose by due date and see what was completed, what is upcoming, and what needs attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <LegendPill label="Completed" tone="emerald" />
          <LegendPill label="Upcoming" tone="sky" />
          <LegendPill label="Needs attention" tone="rose" />
        </div>
      </div>

      <div className="mt-5">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No timeline entries yet.
          </div>
        ) : (
          <div className="space-y-0">
            {records.map((record, index) => {
              const toneClasses = record.isCompleted
                ? {
                    dot: 'bg-emerald-500 ring-emerald-100',
                    badge: 'bg-emerald-100 text-emerald-700',
                    border: 'border-emerald-100',
                  }
                : record.isAttentionNeeded
                  ? {
                      dot: 'bg-rose-500 ring-rose-100',
                      badge: 'bg-rose-100 text-rose-700',
                      border: 'border-rose-100',
                    }
                  : {
                      dot: 'bg-sky-500 ring-sky-100',
                      badge: 'bg-sky-100 text-sky-700',
                      border: 'border-sky-100',
                    };

              const primaryDateLabel = record.givenDate ? 'Given' : 'Due';
              const primaryDateValue = record.givenDate ?? record.dueDate;
              const detailBadges = [
                record.scheduleLabel,
                record.isLate ? 'Late' : null,
                record.isMissed ? 'Missed' : null,
              ].filter(Boolean);

              return (
                <div key={record.id} className="grid grid-cols-[22px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-2 h-3 w-3 rounded-full ring-4 ${toneClasses.dot}`}
                    />
                    {index < records.length - 1 ? (
                      <span className="mt-1 h-full w-px bg-slate-200" />
                    ) : null}
                  </div>

                  <article
                    className={`mb-4 rounded-2xl border bg-slate-50 px-4 py-3 ${toneClasses.border}`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {record.vaccine.name}
                            {record.doseNumber ? ` - Dose ${record.doseNumber}` : ''}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses.badge}`}
                          >
                            {record.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {record.dose}
                          {record.scheduleLabel ? ` - ${record.scheduleLabel}` : ''}
                        </p>

                        {detailBadges.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {detailBadges.map(detail => (
                              <span
                                key={`${record.id}-${detail}`}
                                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                              >
                                {detail}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 md:min-w-[150px]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {primaryDateLabel}
                        </div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {primaryDateValue
                            ? primaryDateValue.toLocaleDateString()
                            : 'Date pending'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Target: {record.dueDate ? record.dueDate.toLocaleDateString() : 'TBD'}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      {record.remarks || fallbackTimelineRemark(record)}
                    </p>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function LegendPill({
  label,
  tone,
}: {
  label: string;
  tone: 'emerald' | 'sky' | 'rose';
}) {
  const classes = {
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return <span className={`rounded-full px-3 py-1 ${classes[tone]}`}>{label}</span>;
}

function fallbackTimelineRemark(record: {
  status: string;
  givenDate: Date | null;
  dueDate: Date | null;
  isLate?: boolean;
  isMissed?: boolean;
}) {
  if (record.status === 'COMPLETED') {
    return record.isLate
      ? 'Completed after the target schedule.'
      : 'Completed within the tracking record.';
  }

  if (record.status === 'PENDING') {
    if (record.dueDate && record.dueDate.getTime() < Date.now()) {
      return 'Still pending past the target schedule.';
    }

    return 'Scheduled and waiting for the next vaccine date.';
  }

  if (record.isMissed || record.status === 'SKIPPED') {
    return 'Marked as missed in the child record.';
  }

  if (record.status === 'CANCELLED') {
    return 'Cancelled in the child record.';
  }

  return 'Tracking update recorded.';
}

function RecordPanel({
  title,
  emptyLabel,
  records,
  accent,
  canUpdate = false,
  onUpdateRecord,
}: {
  title: string;
  emptyLabel: string;
  records: ChildRecordItem[];
  accent: 'amber' | 'emerald';
  canUpdate?: boolean;
  onUpdateRecord?: (record: ChildRecordItem) => void;
}) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            accent === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {records.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {emptyLabel}
          </div>
        ) : (
          records.map(record => (
            <article key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-slate-900">{record.vaccine.name}</div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-200">
                  {record.status}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {record.dose} - {record.scheduleLabel || 'No schedule label'}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Due: {record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : 'TBD'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Given: {record.dateGiven ? new Date(record.dateGiven).toLocaleDateString() : 'Not yet given'}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {record.remarks || 'No remarks'}
              </div>

              {canUpdate ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdateRecord?.(record)}
                    className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    Update status
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
