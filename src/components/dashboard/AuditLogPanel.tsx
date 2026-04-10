'use client';

import { useEffect, useState } from 'react';

import { ClipboardList } from 'lucide-react';

import api from '@/lib/api';

type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    role?: {
      name?: string;
    };
  } | null;
};

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/notifications/audit-logs', {
        params: { limit: 8 },
      })
      .then(res => setLogs(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
          <p className="text-sm text-slate-500">Recent system activity for vaccines, children, and records</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <ClipboardList className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No audit entries yet.
          </div>
        ) : (
          logs.map(log => (
            <article key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {log.entityType.replace(/_/g, ' ')}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{log.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {log.user?.firstName || log.user?.lastName
                      ? `${log.user?.firstName ?? ''} ${log.user?.lastName ?? ''}`.trim()
                      : 'System'}
                    {log.user?.role?.name ? ` • ${log.user.role.name}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
