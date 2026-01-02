'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
} from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import AttachRecordsModal from '@/components/modal/AttachRecordsModal';
import UpsertVisitModal from '@/components/modal/UpsertVisitModal';
import api from '@/lib/api';

/* ================= TYPES ================= */

type VisitRecord = {
  id: number;
  dose: string;
  status: string;
  vaccine: {
    name: string;
  };
};

type VisitDetails = {
  id: number;
  visitDate: string;
  location?: string;
  nurseName?: string;
  records: VisitRecord[];
};

type Visit = {
  id: number;
  visitDate: string;
  location?: string;
  nurseName?: string;
  child: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 5;

/* ================= PAGE ================= */

export default function VisitsPage() {
  return (
    <AuthGuard>
      <VisitsContent />
    </AuthGuard>
  );
}

/* ================= CONTENT ================= */

function VisitsContent() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] =
    useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  /* MODALS */
  const [openUpsert, setOpenUpsert] = useState(false);
  const [openAttach, setOpenAttach] = useState(false);

  const [selectedVisitId, setSelectedVisitId] =
    useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] =
    useState<number | null>(null);

  /* VIEW ATTACHED RECORDS */
  const [expandedVisitId, setExpandedVisitId] =
    useState<number | null>(null);

  const [visitCache, setVisitCache] = useState<{
    [key: number]: VisitDetails;
  }>({});

  /* ALERT */
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'warning',
    message: '',
    actionLabel: '',
    onAction: undefined as (() => void) | undefined,
  });

  /* ================= LOAD ================= */

  const loadVisits = async (page = pagination.page) => {
    try {
      setLoading(true);

      const res = await api.get(
        '/visits/getAllVisits',
        {
          params: {
            page,
            limit: PAGE_SIZE,
            search,
            sortBy: 'visitDate',
            sortOrder,
          },
        }
      );

      setVisits(res.data.data || []);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortOrder]);

  /* ================= VIEW RECORDS ================= */

  const toggleRecords = async (visitId: number) => {
    if (expandedVisitId === visitId) {
      setExpandedVisitId(null);
      return;
    }

    if (!visitCache[visitId]) {
      const res = await api.get(
        `/visits/getVisitById/${visitId}`
      );

      setVisitCache(prev => ({
        ...prev,
        [visitId]: res.data.data,
      }));
    }

    setExpandedVisitId(visitId);
  };

  /* ================= UI ================= */

  return (
    <>
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(a => ({ ...a, open: false }))
        }
      />

      <div className="mx-auto px-4 py-6">
        {/* HEADER */}
        <header className="mb-6 flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Immunization Visits
            </h1>
            <p className="text-sm text-slate-500">
              Visit history per child
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedVisitId(null);
              setSelectedChildId(null);
              setOpenUpsert(true);
            }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Create Visit
          </button>
        </header>

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <Skeleton />
          ) : (
            visits.map(visit => (
              <div
                key={visit.id}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                {/* MAIN */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {visit.child.firstName}{' '}
                      {visit.child.lastName}
                    </h3>

                    <div className="mt-2 flex gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(
                          visit.visitDate
                        ).toLocaleDateString()}
                      </span>

                      {visit.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {visit.location}
                        </span>
                      )}

                      {visit.nurseName && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-4 w-4" />
                          {visit.nurseName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    {/* ✅ EDIT (PRESERVED) */}
                    <button
                      onClick={() => {
                        setSelectedVisitId(visit.id);
                        setSelectedChildId(
                          visit.child.id
                        );
                        setOpenUpsert(true);
                      }}
                      className="text-xs text-blue-600 flex items-center gap-1"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {/* VIEW RECORDS */}
                    <button
                      onClick={() =>
                        toggleRecords(visit.id)
                      }
                      className="text-xs text-slate-600 flex items-center gap-1"
                    >
                      {expandedVisitId === visit.id ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      Records
                    </button>

                    {/* ATTACH */}
                    <button
                      onClick={() => {
                        setSelectedVisitId(visit.id);
                        setSelectedChildId(
                          visit.child.id
                        );
                        setOpenAttach(true);
                      }}
                      className="text-xs text-green-600 flex items-center gap-1"
                    >
                      <Link2 size={14} />
                      Attach
                    </button>
                  </div>
                </div>

                {/* ATTACHED RECORDS */}
                {expandedVisitId === visit.id &&
                  visitCache[visit.id] && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      {visitCache[
                        visit.id
                      ].records.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No records attached
                        </p>
                      ) : (
                        visitCache[
                          visit.id
                        ].records.map(r => (
                          <div
                            key={r.id}
                            className="flex justify-between border-b py-2 text-sm last:border-none"
                          >
                            <div>
                              <p className="font-medium">
                                {r.vaccine.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {r.dose}
                              </p>
                            </div>
                            <span className="text-xs text-slate-600">
                              {r.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODALS */}
      {openUpsert && (
        <UpsertVisitModal
          open={openUpsert}
          visitId={selectedVisitId}
          onClose={() => setOpenUpsert(false)}
          onSaved={loadVisits}
        />
      )}

      {openAttach &&
        selectedVisitId &&
        selectedChildId && (
          <AttachRecordsModal
            open={openAttach}
            visitId={selectedVisitId}
            childId={selectedChildId}
            onClose={() => setOpenAttach(false)}
            onSaved={loadVisits}
          />
        )}
    </>
  );
}

/* ================= SKELETON ================= */

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white p-6"
        >
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="mt-2 h-3 w-64 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}
