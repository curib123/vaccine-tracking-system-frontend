'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  Syringe,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import AuthGuard from '@/components/guards/AuthGuard';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import api from '@/lib/api';

type ChildReportRow = {
  childId: number;
  ranking: number;
  childName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  barangay?: string | null;
  healthCenter?: string | null;
  parentName?: string | null;
  totalCompleted: number;
  totalRequired: number;
  completionRate: number;
  lastVaccinatedAt?: string | null;
};

type FutureVaccinationRow = ChildReportRow & {
  pendingCount: number;
  nextDueDate: string;
  nextVaccineName: string;
  nextDose: string;
  nextScheduleLabel?: string | null;
};

type VaccinationEvent = {
  recordId: number;
  childId: number;
  childName: string;
  parentName?: string | null;
  vaccineName: string;
  vaccineCode: string;
  dose: string;
  scheduleLabel?: string | null;
  dateGiven: string;
};

type ReportData = {
  generatedAt: string;
  summary: {
    vaccinatedChildren: number;
    futureVaccinationChildren: number;
    notVaccinatedChildren: number;
    fullyVaccinatedChildren: number;
    vaccinationsThisWeek: number;
    vaccinationsThisMonth: number;
    vaccinationsThisYear: number;
  };
  children: {
    vaccinated: ChildReportRow[];
    futureVaccination: FutureVaccinationRow[];
    notVaccinated: Array<ChildReportRow & { pendingCount: number }>;
  };
  vaccinations: {
    week: VaccinationEvent[];
    month: VaccinationEvent[];
    year: VaccinationEvent[];
  };
};

type ChildTab = 'vaccinated' | 'futureVaccination' | 'notVaccinated';
type PeriodTab = 'week' | 'month' | 'year';

const CHILD_TAB_LABELS: Record<ChildTab, string> = {
  vaccinated: 'Vaccinated Children',
  futureVaccination: 'Future Vaccination',
  notVaccinated: 'Not Vaccinated Yet',
};

const PERIOD_TAB_LABELS: Record<PeriodTab, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function ReportsPageContent() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [childTab, setChildTab] = useState<ChildTab>('vaccinated');
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/records/reports/vaccination', {
          params: {
            search: debouncedSearch || undefined,
          },
        });
        setReport(data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [debouncedSearch]);

  const childRows = useMemo(() => {
    if (!report) return [];
    return report.children[childTab] || [];
  }, [childTab, report]);

  const vaccinationRows = useMemo(() => {
    if (!report) return [];
    return report.vaccinations[periodTab] || [];
  }, [periodTab, report]);

  if (loading) {
    return <TablePageSkeleton columns={5} rows={6} showHeaderAction={false} />;
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#082f49_0%,#0f766e_46%,#67e8f9_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">Vaccination Reports</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Child vaccination reporting
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/80">
              Review which children are already vaccinated, who still has future doses, who has not started yet, and every completed vaccination recorded this week, month, and year.
            </p>
          </div>

          <div className="rounded-2xl bg-white/14 px-4 py-3 text-sm text-white/85 ring-1 ring-white/20">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Vaccinated children"
          value={report.summary.vaccinatedChildren}
          detail={`${report.summary.fullyVaccinatedChildren} fully vaccinated`}
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <SummaryCard
          label="Future vaccination"
          value={report.summary.futureVaccinationChildren}
          detail="Children with upcoming doses"
          tone="sky"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <SummaryCard
          label="Not vaccinated yet"
          value={report.summary.notVaccinatedChildren}
          detail="Children with zero completed doses"
          tone="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <SummaryCard
          label="Vaccinations this month"
          value={report.summary.vaccinationsThisMonth}
          detail={`${report.summary.vaccinationsThisWeek} this week • ${report.summary.vaccinationsThisYear} this year`}
          tone="amber"
          icon={<Syringe className="h-5 w-5" />}
        />
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Search report data</h2>
            <p className="text-sm text-slate-500">
              Filter by child name, parent name, barangay, or health center.
            </p>
          </div>

          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search report records"
              className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Child status report</h2>
              <p className="text-sm text-slate-500">
                Grouped by vaccination progress so it is easy to follow up by child.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(CHILD_TAB_LABELS) as ChildTab[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChildTab(tab)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    childTab === tab
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {CHILD_TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Child</th>
                    <th className="px-5 py-3 text-left font-medium">Parent</th>
                    <th className="px-5 py-3 text-left font-medium">
                      {childTab === 'futureVaccination' ? 'Next schedule' : 'Progress'}
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      {childTab === 'notVaccinated' ? 'Pending doses' : 'Last vaccine'}
                    </th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {childRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center text-slate-500">
                        No child records found for this report section.
                      </td>
                    </tr>
                  ) : (
                    childRows.map(row => (
                      <tr key={row.childId} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{row.childName}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {row.gender === 'MALE' ? 'Male' : 'Female'} • Born {formatDate(row.birthDate)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div>{row.parentName || '-'}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {[row.barangay, row.healthCenter].filter(Boolean).join(' • ') || 'No location set'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {childTab === 'futureVaccination' ? (
                            <div>
                              <div className="font-medium text-slate-900">
                                {(row as FutureVaccinationRow).nextVaccineName}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {(row as FutureVaccinationRow).nextDose}
                                {(row as FutureVaccinationRow).nextScheduleLabel
                                  ? ` • ${(row as FutureVaccinationRow).nextScheduleLabel}`
                                  : ''}
                                {' • '}
                                {formatDate((row as FutureVaccinationRow).nextDueDate)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900">{row.completionRate}% complete</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {row.totalCompleted} of {row.totalRequired} doses completed
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {childTab === 'notVaccinated' ? (
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                              {(row as ChildReportRow & { pendingCount: number }).pendingCount} pending
                            </span>
                          ) : (
                            formatDate(row.lastVaccinatedAt)
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/child-records?childId=${row.childId}`)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Open
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Report guide</h2>
              <p className="text-sm text-slate-500">
                Use these groups to decide which families need updates first.
              </p>
            </div>

            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <GuideCard
              title="Vaccinated children"
              body="Children with at least one completed immunization record."
            />
            <GuideCard
              title="Future vaccination"
              body="Children with pending immunizations scheduled today or later."
            />
            <GuideCard
              title="Not vaccinated yet"
              body="Children who still have zero completed immunization records."
            />
            <GuideCard
              title="This week, month, and year"
              body="Completed vaccine doses recorded inside each time window."
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Completed vaccinations</h2>
            <p className="text-sm text-slate-500">
              A period-based report of vaccine doses that were already administered.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_TAB_LABELS) as PeriodTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriodTab(tab)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  periodTab === tab
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {PERIOD_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Child</th>
                  <th className="px-5 py-3 text-left font-medium">Parent</th>
                  <th className="px-5 py-3 text-left font-medium">Vaccine</th>
                  <th className="px-5 py-3 text-left font-medium">Dose</th>
                  <th className="px-5 py-3 text-left font-medium">Date given</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {vaccinationRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-500">
                      No completed vaccinations recorded for this period.
                    </td>
                  </tr>
                ) : (
                  vaccinationRows.map(row => (
                    <tr key={row.recordId} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-900">{row.childName}</td>
                      <td className="px-5 py-4 text-slate-700">{row.parentName || '-'}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="font-medium text-slate-900">{row.vaccineName}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.vaccineCode}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div>{row.dose}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.scheduleLabel || '-'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{formatDate(row.dateGiven)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/child-records?childId=${row.childId}`)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            View child
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: number;
  detail: string;
  tone: 'emerald' | 'sky' | 'rose' | 'amber';
  icon: ReactNode;
}) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneMap[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </article>
  );
}

function GuideCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </article>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsPageContent />
    </AuthGuard>
  );
}
