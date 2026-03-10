'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarClock,
  CalendarDays,
  Link2,
  Plus,
  Search,
} from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import AttachRecordsModal from '@/components/modal/AttachRecordsModal';
import UpsertChildModal from '@/components/modal/UpsertChildModal';
import UpsertVisitModal from '@/components/modal/UpsertVisitModal';
import {
  Shimmer,
  TablePageSkeleton,
} from '@/components/ui/Shimmer';
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
  visitId?: number | null;
};

type VisitSummary = {
  id: number;
  visitDate: string;
  child: Child;
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
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DueTab>('today');
  const [search, setSearch] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachVisitId, setAttachVisitId] = useState<number | null>(null);
  const [attachChildId, setAttachChildId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'success' | 'error' | 'warning',
    message: '',
  });

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
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load due immunization records.',
      });
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
  const weekEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));

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

  const handleOpenChild = (record: RecordItem) => {
    setSelectedChildId(record.child.id);
    setChildModalOpen(true);
  };

  const handleCreateVisit = (record: RecordItem) => {
    setSelectedChild(record.child);
    setUpsertOpen(true);
  };

  const handleAttach = async (record: RecordItem) => {
    try {
      setActionLoadingId(record.id);

      const res = await api.get('/visits/getAllVisits', {
        params: {
          page: 1,
          limit: 20,
          search: `${record.child.firstName} ${record.child.lastName}`,
          sortBy: 'visitDate',
          sortOrder: 'desc',
        },
      });

      const latestVisit = (res.data.data || []).find(
        (visit: VisitSummary) => visit.child?.id === record.child.id
      );

      if (!latestVisit) {
        setAlert({
          open: true,
          type: 'warning',
          message: 'Create a visit for this child first before attaching records.',
        });
        return;
      }

      setAttachVisitId(latestVisit.id);
      setAttachChildId(record.child.id);
      setAttachOpen(true);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load the latest visit for this child.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} showHeaderAction={false} />;
  }

  return (
    <>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Due Immunizations
            </h1>
            <p className="text-sm text-slate-500">
              Nurse work queue for pending child immunizations based on due dates
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(TAB_LABELS) as DueTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl border p-5 text-left transition ${
                activeTab === tab
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {TAB_LABELS[tab]}
                  </p>
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
                    <CalendarClock className="h-5 w-5 text-red-600" />
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
                filteredRecords.map(record => {
                  const isBusy = actionLoadingId === record.id;

                  return (
                    <tr key={record.id} className="border-t hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {record.child.firstName} {record.child.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {record.vaccine.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {record.dose}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {record.nextDueDate
                          ? new Date(record.nextDueDate).toLocaleDateString()
                          : '—'}
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
                            onClick={() => handleOpenChild(record)}
                            className="rounded-lg border px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            Open Child
                          </button>
                          <button
                            onClick={() => handleCreateVisit(record)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                          >
                            <Plus className="mr-1 inline h-3.5 w-3.5" />
                            Create Visit
                          </button>
                          <button
                            onClick={() => handleAttach(record)}
                            disabled={isBusy}
                            className="rounded-lg border px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            {isBusy ? (
                              <Shimmer className="h-4 w-16" />
                            ) : (
                              <>
                                <Link2 className="mr-1 inline h-3.5 w-3.5" />
                                Attach
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Workflow: open the child if you need context, create the actual visit when the child arrives, then attach the pending records to that visit.
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

      {upsertOpen && (
        <UpsertVisitModal
          open={upsertOpen}
          initialChild={selectedChild}
          onClose={() => {
            setUpsertOpen(false);
            setSelectedChild(null);
          }}
          onSaved={() => {
            setUpsertOpen(false);
            setSelectedChild(null);
            loadPendingRecords();
          }}
        />
      )}

      <UpsertChildModal
        open={childModalOpen}
        childId={selectedChildId}
        onClose={() => {
          setChildModalOpen(false);
          setSelectedChildId(null);
        }}
        onSaved={() => {
          setChildModalOpen(false);
          setSelectedChildId(null);
          loadPendingRecords();
        }}
      />

      {attachOpen && attachVisitId && attachChildId && (
        <AttachRecordsModal
          open={attachOpen}
          visitId={attachVisitId}
          childId={attachChildId}
          onClose={() => {
            setAttachOpen(false);
            setAttachVisitId(null);
            setAttachChildId(null);
          }}
          onSaved={() => {
            setAttachOpen(false);
            setAttachVisitId(null);
            setAttachChildId(null);
            loadPendingRecords();
          }}
        />
      )}
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
