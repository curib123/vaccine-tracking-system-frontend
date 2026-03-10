'use client';

import {
  useEffect,
  useState,
} from 'react';

import { Megaphone } from 'lucide-react';

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
  roleName?: string;
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

/* =====================================================
   PAGE
===================================================== */

export default function AnnouncementPage() {
  return (
    <ParentGuard>
      <AnnouncementContent />
    </ParentGuard>
  );
}

/* =====================================================
   CONTENT
===================================================== */

function AnnouncementContent() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'error' | 'success',
    message: '',
  });

  /* ===== LOAD USER ===== */
  useEffect(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch {}
  }, []);

  /* ===== LOAD ANNOUNCEMENTS ===== */
  const loadAnnouncements = async (page = 1) => {
    try {
      setLoading(true);

      const res = await api.get('/announcements/getAll', {
        params: { page, limit: PAGE_SIZE },
      });

      setAnnouncements(
        res.data.data.filter((a: Announcement) => a.isActive)
      );
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Unable to load announcements.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(1);
  }, []);

  const fullName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : 'Parent';

  const roleLabel = user?.roleName
    ? user.roleName.replace(/_/g, ' ')
    : 'Parent';

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <>
      {/* ================= BLUE HEADER ================= */}
      <header className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 px-8 py-10 text-white shadow-sm">
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-sm text-blue-100">
            Announcements for
          </span>

          <h1 className="text-3xl font-semibold tracking-tight">
            {fullName}
          </h1>

          <p className="max-w-xl text-sm text-blue-100">
            Official updates and notices from the health center.
          </p>

          <div className="mt-4 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            {roleLabel}
          </div>
        </div>

        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </header>

      {/* ================= ANNOUNCEMENT CARDS ================= */}
      {loading ? (
        <SkeletonCards />
      ) : announcements.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {announcements.map(a => (
            <article
              key={a.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Megaphone className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {a.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 line-clamp-4">
                    {a.message}
                  </p>

                  <p className="mt-4 text-xs text-slate-500">
                    {fmtDate(a.createdAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ================= PAGINATION ================= */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() =>
                loadAnnouncements(pagination.page - 1)
              }
              className="rounded-xl bg-slate-100 px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={
                pagination.page >= pagination.totalPages
              }
              onClick={() =>
                loadAnnouncements(pagination.page + 1)
              }
              className="rounded-xl bg-slate-100 px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
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
   STATES
===================================================== */

function EmptyState() {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-slate-500">
        No announcements available at the moment.
      </p>
    </div>
  );
}

function SkeletonCards() {
  return <CardListSkeleton count={6} />;
}
