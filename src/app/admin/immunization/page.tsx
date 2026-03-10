'use client';

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

/* ================= TYPES ================= */

type Child = {
  id: number;
  firstName: string;
  lastName: string;
};

type Vaccine = {
  id: number;
  name: string;
};

type VisitRecord = {
  id: number;
  dose: string;
  dateGiven?: string | null;
  administeredBy?: string | null;
  batchNumber?: string | null;
  manufacturer?: string | null;
  remarks?: string | null;
};

type Visit = {
  id: number;
  visitDate: string;
  location?: string;
  nurseName?: string;
  records: VisitRecord[];
};

type ImmunizationRecord = {
  id: number;
  dose: string;
  status: string;
  nextDueDate?: string | null;

  child: Child;
  vaccine: Vaccine;
  visitId?: number | null;
};

type StatusOption = {
  value: string;
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
  const [records, setRecords] = useState<
    ImmunizationRecord[]
  >([]);
  const [statuses, setStatuses] = useState<
    StatusOption[]
  >([]);
  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      totalPages: 1,
    });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('');
  const [loading, setLoading] = useState(true);

  const [expandedVisitId, setExpandedVisitId] =
    useState<number | null>(null);

  const [visitCache, setVisitCache] = useState<{
    [key: number]: Visit;
  }>({});

  /* ---------- LOAD ---------- */
  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    fetchRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const fetchStatuses = async () => {
    const res = await api.get('/records/statuses');
    setStatuses(res.data.data || []);
  };

  const fetchRecords = async (page: number) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/records', {
        params,
      });

      setRecords(data.data || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- VISIT DETAILS ---------- */
  const loadVisit = async (visitId: number) => {
    if (visitCache[visitId]) return;

    const res = await api.get(
      `/visits/getVisitById/${visitId}`
    );

    setVisitCache(prev => ({
      ...prev,
      [visitId]: res.data.data,
    }));
  };

  const toggleVisit = async (visitId: number) => {
    if (expandedVisitId === visitId) {
      setExpandedVisitId(null);
      return;
    }

    await loadVisit(visitId);
    setExpandedVisitId(visitId);
  };

  const hasData = useMemo(
    () => records.length > 0,
    [records]
  );

  /* ---------- STATUS COLOR (DATA-DRIVEN) ---------- */
  const statusColor = (value: string) => {
    const v = value.toLowerCase();
    if (v.includes('complete'))
      return 'bg-green-100 text-green-700';
    if (v.includes('pending'))
      return 'bg-blue-100 text-blue-700';
    if (v.includes('skip'))
      return 'bg-slate-100 text-slate-600';
    if (v.includes('cancel'))
      return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  /* ---------- RENDER ---------- */
  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} showHeaderAction={false} />;
  }

  return (
    <div className="bg-slate-50 px-6 py-8 space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Immunization Records
        </h1>
        <p className="text-sm text-slate-500">
          Records linked to clinic visits
        </p>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search child or vaccine"
          className="px-4 py-2 rounded-lg border text-sm w-64"
        />

        <select
          value={statusFilter}
          onChange={e =>
            setStatusFilter(e.target.value)
          }
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="">All Status</option>
          {statuses.map(s => (
            <option
              key={s.value}
              value={s.value}
            >
              {s.label}
            </option>
          ))}
        </select>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">
                Child
              </th>
              <th className="px-6 py-3 text-left">
                Vaccine
              </th>
              <th className="px-6 py-3 text-left">
                Dose
              </th>
              <th className="px-6 py-3 text-left">
                Due Date
              </th>
              <th className="px-6 py-3 text-left">
                Visit
              </th>
              <th className="px-6 py-3 text-left">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td
                  colSpan={5}
                  className="py-14 text-center text-slate-400"
                >
                  No records found
                </td>
              </tr>
            )}

            {records.map(r => (
              <Fragment key={r.id}>
                {/* MAIN ROW */}
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {r.child.firstName}{' '}
                    {r.child.lastName}
                  </td>

                  <td className="px-6 py-4">
                    {r.vaccine.name}
                  </td>

                  <td className="px-6 py-4">
                    {r.dose}
                  </td>

                  <td className="px-6 py-4">
                    {r.nextDueDate
                      ? new Date(r.nextDueDate).toLocaleDateString()
                      : '—'}
                  </td>

                  <td className="px-6 py-4">
                    {r.visitId ? (
                      <button
                        onClick={() =>
                          toggleVisit(r.visitId!)
                        }
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expandedVisitId === r.visitId
                          ? 'Hide Visit'
                          : 'View Visit'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColor(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>

                {/* EXPANDED VISIT */}
                {r.visitId &&
                  expandedVisitId === r.visitId &&
                  visitCache[r.visitId] && (
                    <tr className="bg-slate-50">
                      <td
                        colSpan={6}
                        className="px-6 py-5 text-sm"
                      >
                        {/* VISIT INFO */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              Visit Date
                            </p>
                            <p className="font-medium">
                              {new Date(
                                visitCache[
                                  r.visitId
                                ].visitDate
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Location
                            </p>
                            <p className="font-medium">
                              {visitCache[
                                r.visitId
                              ].location || '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Nurse
                            </p>
                            <p className="font-medium">
                              {visitCache[
                                r.visitId
                              ].nurseName || '—'}
                            </p>
                          </div>
                        </div>

                        {/* ADMINISTERED RECORDS */}
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          Administered Vaccines
                        </p>

                        <div className="space-y-2">
                          {visitCache[
                            r.visitId
                          ].records.map(rec => (
                            <div
                              key={rec.id}
                              className="rounded-lg bg-white px-4 py-3 text-xs shadow-sm"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-500">
                                    Dose:
                                  </span>{' '}
                                  {rec.dose}
                                </div>

                                <div>
                                  <span className="text-slate-500">
                                    Date Given:
                                  </span>{' '}
                                  {rec.dateGiven
                                    ? new Date(
                                        rec.dateGiven
                                      ).toLocaleDateString()
                                    : '—'}
                                </div>

                                <div>
                                  <span className="text-slate-500">
                                    Administered By:
                                  </span>{' '}
                                  {rec.administeredBy ||
                                    '—'}
                                </div>

                                <div>
                                  <span className="text-slate-500">
                                    Batch:
                                  </span>{' '}
                                  {rec.batchNumber ||
                                    '—'}
                                </div>

                                <div>
                                  <span className="text-slate-500">
                                    Manufacturer:
                                  </span>{' '}
                                  {rec.manufacturer ||
                                    '—'}
                                </div>

                                {rec.remarks && (
                                  <div className="col-span-2">
                                    <span className="text-slate-500">
                                      Remarks:
                                    </span>{' '}
                                    {rec.remarks}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
              </Fragment>
            ))}
          </tbody>
        </table>
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
