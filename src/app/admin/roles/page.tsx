'use client';

import { useEffect, useMemo, useState } from 'react';

import axios from 'axios';
import { BadgeCheck, KeyRound, Pencil, Plus, Search, Shield, Trash2 } from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import RoleModal from '@/components/modal/RoleModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

type Permission = {
  id: number;
  code: string;
};

type RolePermission = {
  id: number;
  permission: Permission;
};

type Role = {
  id: number;
  name: string;
  description?: string | null;
  permissions: RolePermission[];
};

type AlertState = {
  open: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  action?: () => void;
};

function sentenceCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function permissionDomain(code: string) {
  const parts = code.split('_');
  return parts.length > 1 ? parts.slice(1).join(' ') : code;
}

function statCardTone(index: number) {
  const tones = [
    'bg-emerald-50 text-emerald-700 ring-emerald-100',
    'bg-amber-50 text-amber-700 ring-amber-100',
    'bg-sky-50 text-sky-700 ring-sky-100',
  ];

  return tones[index % tones.length];
}

function RolesPageContent() {
  useSessionGuard({ mode: 'protected', redirectTo: '/login' });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  const fetchRoles = async () => {
    setLoading(true);

    try {
      const [{ data: roleData }, { data: permissionData }] = await Promise.all([
        api.get('/roles/getAllRoles'),
        api.get('/roles/getAllPermissions'),
      ]);

      setRoles(roleData.data || []);
      setPermissions(permissionData.data || []);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load roles',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return roles;
    }

    return roles.filter(role => {
      const haystack = [
        role.name,
        role.description || '',
        ...role.permissions.map(item => item.permission.code),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [roles, search]);

  const metrics = useMemo(() => {
    const totalRolePermissions = roles.reduce((sum, role) => sum + role.permissions.length, 0);
    const averagePermissions = roles.length === 0 ? 0 : Math.round(totalRolePermissions / roles.length);
    const permissionCoverage =
      permissions.length === 0 || roles.length === 0
        ? 0
        : Math.round(
            (roles.reduce((sum, role) => sum + role.permissions.length / permissions.length, 0) /
              roles.length) *
              100
          );

    return [
      {
        label: 'Active roles',
        value: roles.length,
        hint: `${filteredRoles.length} shown in this view`,
        icon: Shield,
      },
      {
        label: 'Permission catalog',
        value: permissions.length,
        hint: `${averagePermissions} average per role`,
        icon: KeyRound,
      },
      {
        label: 'Coverage',
        value: `${permissionCoverage}%`,
        hint: 'Average permission coverage by role',
        icon: BadgeCheck,
      },
    ];
  }, [filteredRoles.length, permissions.length, roles]);

  const topPermissionDomains = useMemo(() => {
    const counts = new Map<string, number>();

    roles.forEach(role => {
      role.permissions.forEach(({ permission }) => {
        const key = sentenceCase(permissionDomain(permission.code));
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [roles]);

  const openCreateRole = () => {
    setEditingRoleId(null);
    setOpenRoleModal(true);
  };

  const openEditRole = (id: number) => {
    setEditingRoleId(id);
    setOpenRoleModal(true);
  };

  const confirmRemoveRole = (id: number) => {
    setAlert({
      open: true,
      type: 'warning',
      message: 'Are you sure you want to remove this role?',
      action: async () => {
        try {
          await api.patch(`/roles/removeRole/${id}/delete-role`);
          setAlert({
            open: true,
            type: 'success',
            message: 'Role removed successfully',
          });
          fetchRoles();
        } catch (error: unknown) {
          const errorMessage = axios.isAxiosError<{ message?: string }>(error)
            ? error.response?.data?.message
            : undefined;

          setAlert({
            open: true,
            type: 'error',
            message: errorMessage || 'Failed to remove role',
          });
        }
      },
    });
  };

  if (loading) {
    return <TablePageSkeleton columns={3} rows={5} showFilters={false} />;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">Access Design</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Role management</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Shape permission sets by role, review access coverage at a glance, and keep the admin access map organized as the system grows.
            </p>
          </div>

          <button
            onClick={openCreateRole}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Role
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
              <h2 className="text-lg font-semibold text-slate-900">Roles directory</h2>
              <p className="text-sm text-slate-500">
                Search by role name, description, or permission code.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search roles or permissions"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredRoles.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-14 text-center text-sm text-slate-500 lg:col-span-2">
                No roles match this search.
              </div>
            ) : (
              filteredRoles.map(role => (
                <article
                  key={role.id}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-slate-900">{role.name}</h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {role.description?.trim() || 'No description yet.'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditRole(role.id)}
                          className="rounded-xl border border-slate-200 p-2 text-sky-700 transition hover:bg-sky-50"
                          title="Edit Role"
                          aria-label="Edit Role"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmRemoveRole(role.id)}
                          className="rounded-xl border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50"
                          title="Remove Role"
                          aria-label="Remove Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard
                        label="Access breadth"
                        value={`${permissions.length === 0 ? 0 : Math.round((role.permissions.length / permissions.length) * 100)}%`}
                      />
                      <InfoCard
                        label="Primary domains"
                        value={
                          Array.from(
                            new Set(
                              role.permissions.map(({ permission }) =>
                                sentenceCase(permissionDomain(permission.code))
                              )
                            )
                          )
                            .slice(0, 2)
                            .join(', ') || 'General'
                        }
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Permission Set
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.permissions.length === 0 ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            No permissions assigned
                          </span>
                        ) : (
                          role.permissions.map(({ id, permission }) => (
                            <span
                              key={id}
                              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                            >
                              {sentenceCase(permission.code)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-slate-900">Catalog focus</h2>
            <p className="mt-1 text-sm text-slate-500">
              Most-used permission domains across all active roles.
            </p>

            <div className="mt-5 space-y-3">
              {topPermissionDomains.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No permission data available.
                </div>
              ) : (
                topPermissionDomains.map(([domain, count]) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{domain}</p>
                      <p className="text-xs text-slate-500">Assigned across active roles</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-slate-900">Design notes</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-amber-50 px-4 py-3">
                Keep role names short and stable so they stay readable in user lists and audit logs.
              </p>
              <p className="rounded-2xl bg-emerald-50 px-4 py-3">
                Use descriptions to explain when a role should be assigned, not to restate the name.
              </p>
              <p className="rounded-2xl bg-sky-50 px-4 py-3">
                Permission-heavy roles are easiest to maintain when grouped around a single operational responsibility.
              </p>
            </div>
          </section>
        </aside>
      </section>

      <RoleModal
        open={openRoleModal}
        roleId={editingRoleId}
        onClose={() => setOpenRoleModal(false)}
        onSuccess={fetchRoles}
      />

      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        actionLabel={alert.action ? 'Confirm' : undefined}
        onAction={alert.action}
        onClose={() => setAlert(current => ({ ...current, open: false, action: undefined }))}
      />
    </div>
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

export default function RolesPage() {
  return (
    <AuthGuard>
      <RolesPageContent />
    </AuthGuard>
  );
}
