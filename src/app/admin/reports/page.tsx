'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Printer,
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

type NotVaccinatedRow = ChildReportRow & {
  pendingCount: number;
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
    notVaccinated: NotVaccinatedRow[];
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

const CHILD_TABLE_PAGE_SIZE = 10;
const VACCINATION_TABLE_PAGE_SIZE = 10;

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: rows.length,
  };
}

function buildPrintDocument({
  title,
  subtitle,
  generatedAt,
  search,
  page,
  totalPages,
  rowCount,
  tableHtml,
}: {
  title: string;
  subtitle: string;
  generatedAt: string;
  search: string;
  page: number;
  totalPages: number;
  rowCount: number;
  tableHtml: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          .print-shell {
            width: 100%;
          }

          .print-header {
            border-bottom: 2px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }

          .print-eyebrow {
            margin: 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #64748b;
          }

          .print-title {
            margin: 6px 0 0;
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
          }

          .print-subtitle {
            margin: 4px 0 0;
            font-size: 14px;
            color: #475569;
          }

          .print-meta {
            display: grid;
            gap: 6px;
            margin: 14px 0 18px;
            font-size: 12px;
            color: #334155;
          }

          .print-meta strong {
            color: #0f172a;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            line-height: 1.35;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
          }

          .print-table thead {
            display: table-header-group;
          }

          .print-table th {
            background: #f8fafc;
            color: #475569;
            font-weight: 700;
          }

          .print-table tr {
            break-inside: avoid;
          }

          .print-muted {
            font-size: 11px;
            color: #64748b;
          }

          .print-badge {
            display: inline-block;
            border-radius: 999px;
            background: #fff1f2;
            color: #be123c;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="print-shell">
          <header class="print-header">
            <p class="print-eyebrow">Health Center System</p>
            <h1 class="print-title">${escapeHtml(title)}</h1>
            <p class="print-subtitle">${escapeHtml(subtitle)}</p>
          </header>
          <section class="print-meta">
            <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
            <div><strong>Search filter:</strong> ${escapeHtml(search || 'All records')}</div>
            <div><strong>Page:</strong> ${page} of ${totalPages}</div>
            <div><strong>Rows on this page:</strong> ${rowCount}</div>
          </section>
          ${tableHtml}
        </div>
      </body>
    </html>
  `;
}

function buildChildTableHtml(
  rows: Array<ChildReportRow | FutureVaccinationRow | NotVaccinatedRow>,
  childTab: ChildTab
) {
  const progressHeader = childTab === 'futureVaccination' ? 'Next schedule' : 'Progress';
  const lastHeader = childTab === 'notVaccinated' ? 'Pending doses' : 'Last vaccine';

  const body =
    rows.length === 0
      ? `<tr><td colspan="4">No child records found for this report section.</td></tr>`
      : rows
          .map(row => {
            const childMeta = `${row.gender === 'MALE' ? 'Male' : 'Female'} | Born ${formatDate(row.birthDate)}`;
            const locationMeta =
              [row.barangay, row.healthCenter].filter(Boolean).join(' | ') || 'No location set';

            const progressCell =
              childTab === 'futureVaccination'
                ? `<div><strong>${escapeHtml((row as FutureVaccinationRow).nextVaccineName)}</strong></div><div class="print-muted">${escapeHtml((row as FutureVaccinationRow).nextDose)}${
                    (row as FutureVaccinationRow).nextScheduleLabel
                      ? ` | ${escapeHtml((row as FutureVaccinationRow).nextScheduleLabel || '')}`
                      : ''
                  } | ${escapeHtml(formatDate((row as FutureVaccinationRow).nextDueDate))}</div>`
                : `<div><strong>${escapeHtml(String(row.completionRate))}% complete</strong></div><div class="print-muted">${escapeHtml(
                    `${row.totalCompleted} of ${row.totalRequired} doses completed`
                  )}</div>`;

            const lastCell =
              childTab === 'notVaccinated'
                ? `<span class="print-badge">${escapeHtml(String((row as NotVaccinatedRow).pendingCount))} pending</span>`
                : escapeHtml(formatDate(row.lastVaccinatedAt));

            return `
              <tr>
                <td>
                  <div><strong>${escapeHtml(row.childName)}</strong></div>
                  <div class="print-muted">${escapeHtml(childMeta)}</div>
                </td>
                <td>
                  <div>${escapeHtml(row.parentName || '-')}</div>
                  <div class="print-muted">${escapeHtml(locationMeta)}</div>
                </td>
                <td>${progressCell}</td>
                <td>${lastCell}</td>
              </tr>
            `;
          })
          .join('');

  return `
    <table class="print-table">
      <thead>
        <tr>
          <th>Child</th>
          <th>Parent</th>
          <th>${escapeHtml(progressHeader)}</th>
          <th>${escapeHtml(lastHeader)}</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function buildVaccinationTableHtml(rows: VaccinationEvent[]) {
  const body =
    rows.length === 0
      ? `<tr><td colspan="5">No completed vaccinations recorded for this period.</td></tr>`
      : rows
          .map(
            row => `
              <tr>
                <td><strong>${escapeHtml(row.childName)}</strong></td>
                <td>${escapeHtml(row.parentName || '-')}</td>
                <td>
                  <div><strong>${escapeHtml(row.vaccineName)}</strong></div>
                  <div class="print-muted">${escapeHtml(row.vaccineCode)}</div>
                </td>
                <td>
                  <div>${escapeHtml(row.dose)}</div>
                  <div class="print-muted">${escapeHtml(row.scheduleLabel || '-')}</div>
                </td>
                <td>${escapeHtml(formatDate(row.dateGiven))}</td>
              </tr>
            `
          )
          .join('');

  return `
    <table class="print-table">
      <thead>
        <tr>
          <th>Child</th>
          <th>Parent</th>
          <th>Vaccine</th>
          <th>Dose</th>
          <th>Date given</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function ReportsPageContent() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [childTab, setChildTab] = useState<ChildTab>('vaccinated');
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');
  const [childPage, setChildPage] = useState(1);
  const [vaccinationPage, setVaccinationPage] = useState(1);
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

  const childPagination = useMemo(
    () => paginateRows(childRows, childPage, CHILD_TABLE_PAGE_SIZE),
    [childPage, childRows]
  );

  const vaccinationPagination = useMemo(
    () => paginateRows(vaccinationRows, vaccinationPage, VACCINATION_TABLE_PAGE_SIZE),
    [vaccinationPage, vaccinationRows]
  );

  const activeChildTabLabel = CHILD_TAB_LABELS[childTab];
  const activePeriodTabLabel = PERIOD_TAB_LABELS[periodTab];

  useEffect(() => {
    document.title = `Vaccination Reports - ${activeChildTabLabel} - ${activePeriodTabLabel}`;
  }, [activeChildTabLabel, activePeriodTabLabel]);

  useEffect(() => {
    setChildPage(1);
  }, [childTab, debouncedSearch]);

  useEffect(() => {
    setVaccinationPage(1);
  }, [periodTab, debouncedSearch]);

  const openPrintWindow = (documentHtml: string) => {
    const printWindow = window.open('', '_blank', 'width=1024,height=768');

    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();

    const finalizePrint = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    if (printWindow.document.readyState === 'complete') {
      window.setTimeout(finalizePrint, 150);
    } else {
      printWindow.onload = () => window.setTimeout(finalizePrint, 150);
    }
  };

  const handlePrintChildTable = () => {
    openPrintWindow(
      buildPrintDocument({
        title: `${activeChildTabLabel} Table`,
        subtitle: 'Child vaccination status report',
        generatedAt: new Date(report?.generatedAt || new Date()).toLocaleString(),
        search: search.trim(),
        page: childPagination.page,
        totalPages: childPagination.totalPages,
        rowCount: childPagination.rows.length,
        tableHtml: buildChildTableHtml(childPagination.rows, childTab),
      })
    );
  };

  const handlePrintVaccinationTable = () => {
    openPrintWindow(
      buildPrintDocument({
        title: `${activePeriodTabLabel} Completed Vaccinations`,
        subtitle: 'Completed vaccination history',
        generatedAt: new Date(report?.generatedAt || new Date()).toLocaleString(),
        search: search.trim(),
        page: vaccinationPagination.page,
        totalPages: vaccinationPagination.totalPages,
        rowCount: vaccinationPagination.rows.length,
        tableHtml: buildVaccinationTableHtml(vaccinationPagination.rows),
      })
    );
  };

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
          detail={`${report.summary.vaccinationsThisWeek} this week | ${report.summary.vaccinationsThisYear} this year`}
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

            <div className="flex flex-wrap items-center gap-2">
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

              <button
                type="button"
                onClick={handlePrintChildTable}
                disabled={childPagination.rows.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Printer className="h-4 w-4" />
                Print This Table
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <ChildStatusTable
                rows={childPagination.rows}
                childTab={childTab}
                showActions
                onOpenChild={childId => router.push(`/admin/child-records?childId=${childId}`)}
              />
            </div>
          </div>

          <PaginationBar
            page={childPagination.page}
            totalPages={childPagination.totalPages}
            total={childPagination.total}
            pageSize={CHILD_TABLE_PAGE_SIZE}
            onPrevious={() => setChildPage(current => Math.max(1, current - 1))}
            onNext={() =>
              setChildPage(current => Math.min(childPagination.totalPages, current + 1))
            }
          />
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

          <div className="flex flex-wrap items-center gap-2">
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

            <button
              type="button"
              onClick={handlePrintVaccinationTable}
              disabled={vaccinationPagination.rows.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Printer className="h-4 w-4" />
              Print This Table
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <VaccinationTable
              rows={vaccinationPagination.rows}
              showActions
              onOpenChild={childId => router.push(`/admin/child-records?childId=${childId}`)}
            />
          </div>
        </div>

        <PaginationBar
          page={vaccinationPagination.page}
          totalPages={vaccinationPagination.totalPages}
          total={vaccinationPagination.total}
          pageSize={VACCINATION_TABLE_PAGE_SIZE}
          onPrevious={() => setVaccinationPage(current => Math.max(1, current - 1))}
          onNext={() =>
            setVaccinationPage(current =>
              Math.min(vaccinationPagination.totalPages, current + 1)
            )
          }
        />
      </section>
    </div>
  );
}

function ChildStatusTable({
  rows,
  childTab,
  showActions,
  onOpenChild,
}: {
  rows: Array<ChildReportRow | FutureVaccinationRow | NotVaccinatedRow>;
  childTab: ChildTab;
  showActions: boolean;
  onOpenChild?: (childId: number) => void;
}) {
  const columnCount = showActions ? 5 : 4;

  return (
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
          {showActions ? (
            <th className="px-5 py-3 text-right font-medium">Action</th>
          ) : null}
        </tr>
      </thead>

      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className="px-5 py-14 text-center text-slate-500">
              No child records found for this report section.
            </td>
          </tr>
        ) : (
          rows.map(row => (
            <tr key={row.childId} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">{row.childName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {row.gender === 'MALE' ? 'Male' : 'Female'} | Born {formatDate(row.birthDate)}
                </div>
              </td>
              <td className="px-5 py-4 text-slate-700">
                <div>{row.parentName || '-'}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {[row.barangay, row.healthCenter].filter(Boolean).join(' | ') || 'No location set'}
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
                        ? ` | ${(row as FutureVaccinationRow).nextScheduleLabel}`
                        : ''}
                      {' | '}
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
                    {(row as NotVaccinatedRow).pendingCount} pending
                  </span>
                ) : (
                  formatDate(row.lastVaccinatedAt)
                )}
              </td>
              {showActions ? (
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenChild?.(row.childId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Open
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function VaccinationTable({
  rows,
  showActions,
  onOpenChild,
}: {
  rows: VaccinationEvent[];
  showActions: boolean;
  onOpenChild?: (childId: number) => void;
}) {
  const columnCount = showActions ? 6 : 5;

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-5 py-3 text-left font-medium">Child</th>
          <th className="px-5 py-3 text-left font-medium">Parent</th>
          <th className="px-5 py-3 text-left font-medium">Vaccine</th>
          <th className="px-5 py-3 text-left font-medium">Dose</th>
          <th className="px-5 py-3 text-left font-medium">Date given</th>
          {showActions ? (
            <th className="px-5 py-3 text-right font-medium">Action</th>
          ) : null}
        </tr>
      </thead>

      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className="px-5 py-14 text-center text-slate-500">
              No completed vaccinations recorded for this period.
            </td>
          </tr>
        ) : (
          rows.map(row => (
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
              {showActions ? (
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenChild?.(row.childId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View child
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
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

function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
      <span>
        Showing {startItem}-{endItem} of {total} records
      </span>

      <div className="flex items-center gap-2">
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page === 1}
          onClick={onPrevious}
          className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={onNext}
          className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsPageContent />
    </AuthGuard>
  );
}
