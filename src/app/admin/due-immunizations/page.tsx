'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import AuthGuard from '@/components/guards/AuthGuard';
import UpdateRecordStatusModal from '@/components/modal/UpdateRecordStatusModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

type Child = {
  id: number;
  firstName: string;
  lastName: string;
};

type Vaccine = {
  id: number;
  name: string;
};

type RecordItem = {
  id: number;
  dose: string;
  status: string;
  nextDueDate?: string | null;
  child: Child;
  vaccine: Vaccine;
};

type DueTab = 'today' | 'week' | 'overdue';

const TAB_LABELS: Record<DueTab, string> = {
  today: 'Due Today',
  week: 'Due This Week',
  overdue: 'Overdue',
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function DueImmunizationsContent() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DueTab>('today');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const loadPendingRecords = async () => {
    try {
      setLoading(true);

      const res = await api.get('/records', {
        params: {
          page: 1,
          limit: 500,
          status: 'PENDING',
        },
      });

      setRecords(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRecords();
  }, []);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  );

  const categorized = useMemo(() => {
    const groups: Record<DueTab, RecordItem[]> = {
      today: [],
      week: [],
      overdue: [],
    };

    records.forEach(record => {
      if (record.status !== 'PENDING' || !record.nextDueDate) return;

      const dueDate = new Date(record.nextDueDate);

      if (dueDate < todayStart) {
        groups.overdue.push(record);
        return;
      }

      if (dueDate >= todayStart && dueDate <= todayEnd) {
        groups.today.push(record);
        return;
      }

      if (dueDate > todayEnd && dueDate <= weekEnd) {
        groups.week.push(record);
      }
    });

    return groups;
  }, [records, todayEnd, todayStart, weekEnd]);

  const filteredRecords = useMemo(() => {
    const source = categorized[activeTab];
    const query = search.trim().toLowerCase();

    if (!query) return source;

    return source.filter(record =>
      `${record.child.firstName} ${record.child.lastName} ${record.vaccine.name} ${record.dose}`
        .toLowerCase()
        .includes(query)
    );
  }, [activeTab, categorized, search]);

  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} showHeaderAction={false} />;
  }

  return (
    <>
      <div className="space-y-6">
        <header className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Action Queue</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Due immunizations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Update vaccine records directly from the due queue. Visit creation has been removed to keep the immunization workflow simple.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(TAB_LABELS) as DueTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl border p-5 text-left transition ${
                activeTab === tab
                  ? 'border-sky-200 bg-sky-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{TAB_LABELS[tab]}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {categorized[tab].length}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  {tab === 'today' ? (
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                  ) : tab === 'week' ? (
                    <CalendarClock className="h-5 w-5 text-amber-600" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search child, vaccine, or dose"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Child</th>
                <th className="px-6 py-3 text-left font-medium">Vaccine</th>
                <th className="px-6 py-3 text-left font-medium">Dose</th>
                <th className="px-6 py-3 text-left font-medium">Due Date</th>
                <th className="px-6 py-3 text-left font-medium">Priority</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    No pending records in this queue.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id} className="border-t hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {record.child.firstName} {record.child.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{record.vaccine.name}</td>
                    <td className="px-6 py-4 text-slate-700">{record.dose}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {record.nextDueDate
                        ? new Date(record.nextDueDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          activeTab === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : activeTab === 'today'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {TAB_LABELS[activeTab]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/children?childId=${record.child.id}`)}
                          className="rounded-lg border p-2 text-slate-700 transition hover:bg-slate-50"
                          title="Open Child Card"
                          aria-label="Open Child Card"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setStatusModalOpen(true);
                          }}
                          className="rounded-lg border p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Update Status"
                          aria-label="Update Status"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Workflow: open the child card when you need context, then update the dose directly from this queue.
        </div>
      </div>

      <UpdateRecordStatusModal
        open={statusModalOpen}
        record={selectedRecord}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedRecord(null);
        }}
        onSaved={() => {
          setStatusModalOpen(false);
          setSelectedRecord(null);
          loadPendingRecords();
        }}
      />
    </>
  );
}

export default function DueImmunizationsPage() {
  return (
    <AuthGuard>
      <DueImmunizationsContent />
    </AuthGuard>
  );
}
