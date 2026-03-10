'use client';

import {
  useEffect,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import { DashboardSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

/* ================= TYPES ================= */
type DashboardData = {
  children: {
    total: number;
    newThisMonth: number;
    gender: {
      male: number;
      female: number;
    };
  };
  vaccines: {
    total: number;
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
};

/* ================= COMPONENT ================= */
function DashboardPageContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8  h-[80vh] overflow-scroll">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Health Center Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Immunization overview and workload insights
        </p>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Total Children"
          value={data.children.total}
          sub={`${data.children.newThisMonth} new this month`}
          color="blue"
        />

        <KpiCard
          title="Completion Rate"
          value={`${data.immunization.completionRate}%`}
          sub={`${data.immunization.completed} completed`}
          color="green"
        />

        <KpiCard
          title="Overdue Immunizations"
          value={data.immunization.overdue}
          sub="Needs immediate action"
          color="red"
        />

        <KpiCard
          title="Due Today"
          value={data.due.today}
          sub="Scheduled for today"
          color="amber"
        />
      </section>

      {/* WORKLOAD */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InfoCard
          title="Due This Week"
          value={data.due.thisWeek}
          description="Upcoming immunizations in 7 days"
        />

        <InfoCard
          title="Due This Month"
          value={data.due.thisMonth}
          description="Scheduled this month"
        />

        <InfoCard
          title="Vaccines Registered"
          value={data.vaccines.total}
          description="Available vaccine types"
        />
      </section>

      {/* IMMUNIZATION STATUS */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Immunization Status Breakdown
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard label="Completed" value={data.immunization.completed} color="green" />
          <StatusCard label="Pending" value={data.immunization.pending} color="blue" />
          <StatusCard label="Missed" value={data.immunization.skipped} color="slate" />
          <StatusCard label="Cancelled" value={data.immunization.cancelled} color="red" />
        </div>
      </section>

      {/* CHART PLACEHOLDER */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Monthly Immunization Trend
        </h2>

        <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed rounded-xl">
          Chart will be displayed here
        </div>
      </section>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function KpiCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: number | string;
  sub: string;
  color: string;
}) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-2">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400">{sub}</p>
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
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {description}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: any = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    slate: 'text-slate-600',
    red: 'text-red-600',
  };

  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}

/* ================= EXPORT ================= */
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
}
