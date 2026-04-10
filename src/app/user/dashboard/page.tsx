'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  LucideIcon,
  Percent,
  Users,
} from 'lucide-react';

import NotificationPanel from '@/components/dashboard/NotificationPanel';
import ParentGuard from '@/components/guards/ParentGuard';
import AlertModal from '@/components/modal/AlertModal';
import { CardListSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

/* =====================================================
   TYPES
===================================================== */

type SessionUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleName?: string;
};

type DashboardData = {
  totalChildren: number;
  completed: number;
  pending: number;
  missed: number;
  completionRate: number;
};

/* =====================================================
   PAGE
===================================================== */

export default function ParentDashboardPage() {
  return (
    <ParentGuard>
      <ParentDashboardContent />
    </ParentGuard>
  );
}

/* =====================================================
   CONTENT
===================================================== */

function ParentDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'error' | 'success',
    message: '',
  });

  /* ===== LOAD DASHBOARD ===== */
  useEffect(() => {
    api
      .get('/parentDashboard')
      .then(r => setData(r.data.data))
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Unable to load dashboard data.',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const fullName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : 'Parent';

  const roleLabel = user?.roleName
    ? user.roleName.replace(/_/g, ' ')
    : 'Parent';

  return (
    <>
      {/* ================= BLUE HEADER ================= */}
      <header className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 px-8 py-10 text-white shadow-sm">
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-sm text-blue-100">
            Welcome back
          </span>

          <h1 className="text-3xl font-semibold tracking-tight">
            {fullName}
          </h1>

          <p className="max-w-xl text-sm text-blue-100">
            Monitor and track your children’s immunization progress in one place.
          </p>

          {/* Role badge */}
          <div className="mt-4 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            {roleLabel}
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </header>

      {/* ================= DASHBOARD ================= */}
      {loading ? (
        <SkeletonList />
      ) : (
        data && (
          <section className="grid gap-4">
            <StatCard
              label="Registered Children"
              value={data.totalChildren}
              icon={Users}
            />
            <StatCard
              label="Completed Immunizations"
              value={data.completed}
              icon={CheckCircle}
              accent="green"
            />
            <StatCard
              label="Pending Immunizations"
              value={data.pending}
              icon={Clock}
              accent="amber"
            />
            <StatCard
              label="Missed Immunizations"
              value={data.missed}
              icon={AlertTriangle}
              accent="red"
            />
            <StatCard
              label="Overall Completion Rate"
              value={`${data.completionRate}%`}
              icon={Percent}
              accent="blue"
              emphasize
            />

            <NotificationPanel title="Reminder Inbox" href="/user/notifications" />
          </section>
        )
      )}

      {/* ================= ALERT ================= */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() =>
          setAlert(prev => ({ ...prev, open: false }))
        }
      />
    </>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'slate',
  emphasize = false,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: 'slate' | 'green' | 'amber' | 'red' | 'blue';
  emphasize?: boolean;
}) {
  const accents: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
          <p
            className={`mt-1 text-3xl font-semibold ${
              emphasize ? 'text-blue-600' : 'text-slate-900'
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accents[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SKELETON
===================================================== */

function SkeletonList() {
  return <CardListSkeleton count={5} />;
}
