'use client';

import { useEffect, useMemo, useState } from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AuditLogPanel from '@/components/dashboard/AuditLogPanel';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import { DashboardSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

type DashboardData = {
  children: {
    total: number;
    newThisMonth: number;
    gender: {
      male: number;
      female: number;
    };
  };
  users: {
    total: number;
    active: number;
    parents: number;
    staff: number;
  };
  vaccines: {
    total: number;
    lowStockCount: number;
    totalStock: number;
    lowStockItems: Array<{
      id: number;
      name: string;
      stockQuantity: number;
      reorderLevel: number;
      unit: string;
    }>;
  };
  immunization: {
    totalRecords: number;
    completed: number;
    pending: number;
    skipped: number;
    cancelled: number;
    overdue: number;
    completionRate: number;
  };
  due: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topPendingVaccines: Array<{
    vaccineId: number;
    name: string;
    pendingCount: number;
  }>;
  topCompletedVaccines: Array<{
    vaccineId: number;
    name: string;
    completedCount: number;
  }>;
  recentChildren: Array<{
    id: number;
    fullName: string;
    gender: 'MALE' | 'FEMALE';
    ranking: number;
    createdAt: string;
    parentName: string;
  }>;
};

type TrendPoint = {
  month: number;
  total: number;
  completed: number;
};

const monthFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
});

function DashboardPageContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [overviewRes, trendRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/dashboard/trend'),
      ]);

      setData(overviewRes.data.data);
      setTrend(
        (trendRes.data.data || []).map((item: { month: unknown; total: unknown; completed: unknown }) => ({
          month: Number(item.month),
          total: Number(item.total),
          completed: Number(item.completed),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const trendRows = useMemo(() => {
    const mapped = new Map(
      trend.map(item => [item.month, item])
    );

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const row = mapped.get(month);

      return {
        month,
        label: monthFormatter.format(new Date(2026, index, 1)),
        total: row?.total || 0,
        completed: row?.completed || 0,
      };
    });
  }, [trend]);

  const maxTrendValue = Math.max(
    1,
    ...trendRows.map(item => Math.max(item.total, item.completed))
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const totalGender = data.children.gender.male + data.children.gender.female;
  const maleShare =
    totalGender === 0 ? 0 : Math.round((data.children.gender.male / totalGender) * 100);
  const femaleShare =
    totalGender === 0 ? 0 : Math.round((data.children.gender.female / totalGender) * 100);

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#0f5b63_50%,#f6c94c_100%)] px-6 py-7 text-white shadow-sm">
        <p className="text-sm uppercase tracking-[0.28em] text-white/70">
          Overview Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Health Center Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">
          Monitor children, workload, vaccine demand, stock pressure, account activity, and monthly immunization performance in one screen.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Children"
          value={data.children.total}
          sub={`${data.children.newThisMonth} new this month`}
          tone="blue"
        />
        <KpiCard
          title="Completion Rate"
          value={`${data.immunization.completionRate}%`}
          sub={`${data.immunization.completed} completed records`}
          tone="green"
        />
        <KpiCard
          title="Overdue Records"
          value={data.immunization.overdue}
          sub="Pending doses past due date"
          tone="red"
        />
        <KpiCard
          title="Low Stock Vaccines"
          value={data.vaccines.lowStockCount}
          sub={`${data.vaccines.totalStock} total doses in inventory`}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          title="Due Today"
          value={data.due.today}
          description="Children scheduled for today"
        />
        <InfoCard
          title="Due This Week"
          value={data.due.thisWeek}
          description="Upcoming vaccines within 7 days"
        />
        <InfoCard
          title="Total Users"
          value={data.users.total}
          description={`${data.users.active} active accounts`}
        />
        <InfoCard
          title="Registered Vaccines"
          value={data.vaccines.total}
          description="Custom and standard vaccines"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr,0.95fr]">
        <Panel title="Monthly Immunization Trend" subtitle="Records created vs completed this year">
          <div className="grid gap-3">
            {trendRows.map(item => (
              <div key={item.month} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                <div className="text-sm font-medium text-slate-500">{item.label}</div>
                <div className="space-y-2">
                  <TrendBar
                    label="Total"
                    value={item.total}
                    width={(item.total / maxTrendValue) * 100}
                    tone="bg-sky-500"
                  />
                  <TrendBar
                    label="Completed"
                    value={item.completed}
                    width={(item.completed / maxTrendValue) * 100}
                    tone="bg-emerald-500"
                  />
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>{item.total} total</div>
                  <div>{item.completed} done</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Child Demographics" subtitle="Gender distribution and account mix">
          <div className="space-y-5">
            <MetricRow
              label="Male children"
              value={data.children.gender.male}
              secondary={`${maleShare}%`}
              progress={maleShare}
              tone="bg-sky-500"
            />
            <MetricRow
              label="Female children"
              value={data.children.gender.female}
              secondary={`${femaleShare}%`}
              progress={femaleShare}
              tone="bg-rose-500"
            />
            <MetricRow
              label="Parent accounts"
              value={data.users.parents}
              secondary={`${data.users.total === 0 ? 0 : Math.round((data.users.parents / data.users.total) * 100)}%`}
              progress={data.users.total === 0 ? 0 : Math.round((data.users.parents / data.users.total) * 100)}
              tone="bg-indigo-500"
            />
            <MetricRow
              label="Staff accounts"
              value={data.users.staff}
              secondary={`${data.users.total === 0 ? 0 : Math.round((data.users.staff / data.users.total) * 100)}%`}
              progress={data.users.total === 0 ? 0 : Math.round((data.users.staff / data.users.total) * 100)}
              tone="bg-amber-500"
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Immunization Status" subtitle="Current record distribution">
          <div className="grid grid-cols-2 gap-3">
            <StatusCard label="Completed" value={data.immunization.completed} tone="green" />
            <StatusCard label="Pending" value={data.immunization.pending} tone="blue" />
            <StatusCard label="Skipped" value={data.immunization.skipped} tone="slate" />
            <StatusCard label="Cancelled" value={data.immunization.cancelled} tone="red" />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Total records: <span className="font-semibold text-slate-900">{data.immunization.totalRecords}</span>
          </div>
        </Panel>

        <Panel title="Top Pending Vaccines" subtitle="Vaccines with the highest open demand">
          <AnalyticsList
            items={data.topPendingVaccines.map(item => ({
              label: item.name,
              value: item.pendingCount,
            }))}
            emptyLabel="No pending vaccine demand right now."
            valueSuffix="pending"
            tone="amber"
          />
        </Panel>

        <Panel title="Top Completed Vaccines" subtitle="Most administered vaccines">
          <AnalyticsList
            items={data.topCompletedVaccines.map(item => ({
              label: item.name,
              value: item.completedCount,
            }))}
            emptyLabel="No completed vaccine records yet."
            valueSuffix="completed"
            tone="green"
          />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <Panel title="Low Stock Watchlist" subtitle="Vaccines at or below reorder level">
          {data.vaccines.lowStockItems.length === 0 ? (
            <EmptyState label="All vaccine inventory levels are currently healthy." />
          ) : (
            <div className="space-y-3">
              {data.vaccines.lowStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Reorder level: {item.reorderLevel} {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-rose-700">
                      {item.stockQuantity}
                    </div>
                    <div className="text-xs text-rose-600">{item.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Child Registrations" subtitle="Latest additions to the registry">
          {data.recentChildren.length === 0 ? (
            <EmptyState label="No child registrations available yet." />
          ) : (
            <div className="space-y-3">
              {data.recentChildren.map(child => (
                <div key={child.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{child.fullName}</div>
                      <div className="mt-1 text-sm text-slate-500">{child.parentName}</div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {child.ranking}
                      {child.ranking === 1 ? 'st' : child.ranking === 2 ? 'nd' : child.ranking === 3 ? 'rd' : 'th'} child
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {child.gender === 'MALE' ? 'Male' : 'Female'} • Registered{' '}
                    {new Date(child.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <NotificationPanel title="Role Notifications" href="/admin/notifications" />
        <AuditLogPanel />
      </section>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  title,
  value,
  sub,
  tone,
}: {
  title: string;
  value: number | string;
  sub: string;
  tone: 'blue' | 'green' | 'red' | 'amber';
}) {
  const tones = {
    blue: 'bg-sky-50 text-sky-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-slate-500">{title}</p>
      <div className={`mt-3 inline-flex rounded-2xl px-4 py-2 text-3xl font-bold ${tones[tone]}`}>
        {value}
      </div>
      <p className="mt-3 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'blue' | 'slate' | 'red';
}) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`mt-2 inline-flex rounded-xl px-3 py-1 text-xl font-semibold ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function TrendBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: number;
  width: number;
  tone: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${tone}`}
          style={{ width: `${Math.max(width, value > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  secondary,
  progress,
  tone,
}: {
  label: string;
  value: number;
  secondary: string;
  progress: number;
  tone: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {value} • {secondary}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${tone}`}
          style={{ width: `${Math.max(progress, value > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function AnalyticsList({
  items,
  emptyLabel,
  valueSuffix,
  tone,
}: {
  items: Array<{ label: string; value: number }>;
  emptyLabel: string;
  valueSuffix: string;
  tone: 'amber' | 'green';
}) {
  const toneClass = tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

  if (items.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
          <div className="font-medium text-slate-700">{item.label}</div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
            {item.value} {valueSuffix}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
}
