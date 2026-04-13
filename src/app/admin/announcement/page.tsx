'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  BellRing,
  CalendarDays,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import UpsertAnnouncementModal from '@/components/modal/UpsertAnnouncementModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

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

type AlertState = {
  open: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
};

const PAGE_SIZE = 10;

function statCardTone(index: number) {
  const tones = [
    'bg-emerald-50 text-emerald-700 ring-emerald-100',
    'bg-amber-50 text-amber-700 ring-amber-100',
    'bg-sky-50 text-sky-700 ring-sky-100',
  ];

  return tones[index % tones.length];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function AnnouncementPageContent() {
  useSessionGuard({ mode: 'protected', redirectTo: '/login' });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [openUpsert, setOpenUpsert] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  const loadAnnouncements = async (page = 1, preserveContent = false) => {
    try {
      if (preserveContent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get('/announcements/getAll', {
        params: { page, limit: PAGE_SIZE },
      });

      setAnnouncements(res.data.data || []);
      setPagination(res.data.pagination || {
        page,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
      });
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load announcements',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/remove/${id}`);

      setAlert({
        open: true,
        type: 'success',
        message: 'Announcement removed successfully',
      });

      const nextPage =
        announcements.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;

      await loadAnnouncements(nextPage, true);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to remove announcement',
      });
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return announcements
      .filter(announcement => {
        if (statusFilter === 'ALL') return true;
        return statusFilter === 'ACTIVE' ? announcement.isActive : !announcement.isActive;
      })
      .filter(announcement => {
        if (!query) return true;

        return [announcement.title, announcement.message]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [announcements, search, statusFilter]);

  const metrics = useMemo(() => {
    const activeCount = announcements.filter(item => item.isActive).length;
    const inactiveCount = announcements.length - activeCount;
    const latestAnnouncement = announcements
      .slice()
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )[0];

    return [
      {
        label: 'Published on page',
        value: announcements.length,
        hint: `${pagination.total} total announcement${pagination.total === 1 ? '' : 's'} recorded`,
        icon: Megaphone,
      },
      {
        label: 'Active now',
        value: activeCount,
        hint: `${inactiveCount} inactive on this page`,
        icon: BellRing,
      },
      {
        label: 'Latest publish',
        value: latestAnnouncement ? formatDate(latestAnnouncement.createdAt) : 'No data',
        hint: latestAnnouncement ? truncateText(latestAnnouncement.title, 36) : 'No announcements yet',
        icon: CalendarDays,
      },
    ];
  }, [announcements, pagination.total]);

  const recentAnnouncements = useMemo(
    () =>
      announcements
        .slice()
        .sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
        .slice(0, 4),
    [announcements]
  );

  if (loading) {
    return <TablePageSkeleton columns={3} rows={5} showFilters={false} />;
  }

  return (
    <>
      <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
        <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">Public Updates</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Announcements</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Organize public notices, review what is currently visible, and keep outbound health
                center updates clear and timely.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedId(null);
                setOpenUpsert(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Announcement
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
                  </div>

                  <div className={`rounded-2xl p-3 ring-1 ${statCardTone(index)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Announcement directory</h2>
                <p className="text-sm text-slate-500">
                  Search and review the announcements loaded for the current page.
                </p>
                {isRefreshing && (
                  <p className="mt-1 text-xs font-medium text-sky-600">Updating announcements...</p>
                )}
              </div>

              <div className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[minmax(0,1fr)_180px]">
                <label className="relative block w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search title or message"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={e =>
                    setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredAnnouncements.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-14 text-center text-sm text-slate-500 lg:col-span-2">
                  No announcements match this view.
                </div>
              ) : (
                filteredAnnouncements.map(announcement => (
                  <article
                    key={announcement.id}
                    className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              announcement.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {announcement.isActive ? 'Active' : 'Inactive'}
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-slate-900">
                            {announcement.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            Published {formatDateTime(announcement.createdAt)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedId(announcement.id);
                              setOpenUpsert(true);
                            }}
                            className="rounded-xl border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50"
                            title="Edit Announcement"
                            aria-label="Edit Announcement"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(announcement.id)}
                            className="rounded-xl border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50"
                            title="Remove Announcement"
                            aria-label="Remove Announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoCard
                          label="Visibility"
                          value={announcement.isActive ? 'Shown to users' : 'Hidden from users'}
                        />
                        <InfoCard
                          label="Message size"
                          value={`${announcement.message.trim().length} characters`}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          Message Preview
                        </p>
                        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                          {truncateText(announcement.message, 220)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
              <span>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadAnnouncements(pagination.page - 1, true)}
                  className="rounded-xl bg-slate-100 px-4 py-2 transition hover:bg-slate-200 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadAnnouncements(pagination.page + 1, true)}
                  className="rounded-xl bg-slate-100 px-4 py-2 transition hover:bg-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-slate-900">Recent publishing</h2>
              <p className="mt-1 text-sm text-slate-500">
                Most recent announcements loaded for this page.
              </p>

              <div className="mt-5 space-y-3">
                {recentAnnouncements.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No announcement data available.
                  </div>
                ) : (
                  recentAnnouncements.map(item => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.isActive ? 'Live' : 'Off'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-slate-900">Publishing notes</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p className="rounded-2xl bg-amber-50 px-4 py-3">
                  Keep titles short enough to scan quickly from mobile notification lists.
                </p>
                <p className="rounded-2xl bg-emerald-50 px-4 py-3">
                  Put the action or deadline near the start of the message so the key update lands fast.
                </p>
                <p className="rounded-2xl bg-sky-50 px-4 py-3">
                  Archive inactive announcements once they are no longer useful so the public feed stays current.
                </p>
              </div>
            </section>
          </aside>
        </section>
      </div>

      <UpsertAnnouncementModal
        open={openUpsert}
        announcementId={selectedId}
        onClose={() => {
          setOpenUpsert(false);
          setSelectedId(null);
        }}
        onSaved={() => loadAnnouncements(pagination.page, true)}
      />

      <AlertModal
        open={deleteId !== null || alert.open}
        type={deleteId !== null ? 'warning' : alert.type}
        message={
          deleteId !== null
            ? 'Are you sure you want to remove this announcement?'
            : alert.message
        }
        actionLabel={deleteId !== null ? 'Remove' : undefined}
        onAction={
          deleteId !== null
            ? async () => {
                await handleDelete(deleteId);
                setDeleteId(null);
              }
            : undefined
        }
        onClose={() => {
          setDeleteId(null);
          setAlert(current => ({ ...current, open: false }));
        }}
      />
    </>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function AnnouncementPage() {
  return (
    <AuthGuard>
      <AnnouncementPageContent />
    </AuthGuard>
  );
}
