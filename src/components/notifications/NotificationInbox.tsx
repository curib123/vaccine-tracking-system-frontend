'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

import api from '@/lib/api';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
};

type Props = {
  title: string;
  subtitle: string;
  limit?: number;
  compact?: boolean;
};

export default function NotificationInbox({
  title,
  subtitle,
  limit = 100,
  compact = false,
}: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get('/notifications/me', {
        params: { limit },
      });

      setItems(res.data.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [limit]);

  const unreadCount = useMemo(
    () => items.filter(item => !item.readAt).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === 'unread') {
      return items.filter(item => !item.readAt);
    }

    return items;
  }, [activeFilter, items]);

  const markAsRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item
      )
    );
  };

  const markAllUnreadAsRead = async () => {
    const unreadItems = items.filter(item => !item.readAt);

    await Promise.all(unreadItems.map(item => api.patch(`/notifications/${item.id}/read`)));

    const now = new Date().toISOString();
    setItems(current => current.map(item => ({ ...item, readAt: item.readAt || now })));
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h1 className={`${compact ? 'text-lg' : 'text-2xl'} font-semibold text-slate-900`}>
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              Only notifications for the signed-in account appear here
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeFilter === 'unread'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => loadNotifications({ refresh: true })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={markAllUnreadAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {activeFilter === 'unread'
              ? 'No unread notifications.'
              : 'No notifications for this account yet.'}
          </div>
        ) : (
          filteredItems.map(item => (
            <article
              key={item.id}
              className={`rounded-[24px] border px-5 py-4 transition ${
                item.readAt
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-amber-200 bg-amber-50/70'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                      {item.type.replaceAll('_', ' ')}
                    </span>
                    {!item.readAt ? (
                      <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                        Unread
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                {!item.readAt ? (
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function NotificationPanelLink({
  href,
}: {
  href: string;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[#0f5b63] transition hover:text-[#167a76]"
    >
      View all
    </Link>
  );
}
