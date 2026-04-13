'use client';

import { useEffect, useMemo, useState } from 'react';

import axios from 'axios';
import { Check, Search } from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

type Permission = {
  id: number;
  code: string;
};

type RolePermission = {
  id: number;
  permission: Permission;
};

type RoleResponse = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: RolePermission[];
};

type Props = {
  open: boolean;
  roleId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type AlertState = {
  open: boolean;
  type: 'success' | 'error';
  message: string;
};

type PermissionGroup = {
  label: string;
  permissions: Permission[];
};

function sentenceCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function permissionGroupLabel(code: string) {
  const parts = code.split('_');
  return parts.length > 1 ? sentenceCase(parts.slice(1).join('_')) : sentenceCase(code);
}

export default function RoleModal({
  open,
  roleId = null,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    if (!open) return;

    setName('');
    setDescription('');
    setSelectedPermissions([]);
    setSearch('');

    const load = async () => {
      try {
        const permissionPromise = api.get('/roles/getAllPermissions');
        const rolePromise = roleId ? api.get(`/roles/getRole/${roleId}`) : Promise.resolve(null);
        const [permissionResponse, roleResponse] = await Promise.all([permissionPromise, rolePromise]);

        setPermissions(permissionResponse.data.data || []);

        if (roleResponse) {
          const role: RoleResponse = roleResponse.data.data;
          setName(role.name);
          setDescription(role.description || '');
          setSelectedPermissions(role.permissions?.map(item => item.permission.id) || []);
        }
      } catch {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load role details',
        });
      }
    };

    load();
  }, [open, roleId]);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return permissions;
    }

    return permissions.filter(permission =>
      permission.code.toLowerCase().includes(query)
    );
  }, [permissions, search]);

  const groupedPermissions = useMemo<PermissionGroup[]>(() => {
    const map = new Map<string, Permission[]>();

    filteredPermissions.forEach(permission => {
      const key = permissionGroupLabel(permission.code);
      const group = map.get(key) || [];
      group.push(permission);
      map.set(key, group);
    });

    return Array.from(map.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([label, groupPermissions]) => ({
        label,
        permissions: groupPermissions.sort((left, right) => left.code.localeCompare(right.code)),
      }));
  }, [filteredPermissions]);

  const togglePermission = (id: number) => {
    setSelectedPermissions(current =>
      current.includes(id) ? current.filter(permissionId => permissionId !== id) : [...current, id]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(permissions.map(permission => permission.id));
  };

  const clearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Role name is required',
      });
      return;
    }

    setLoading(true);

    try {
      if (!roleId) {
        await api.post('/roles/create', {
          name,
          description,
          permissionIds: selectedPermissions,
        });
      } else {
        await api.put(`/roles/updateRole/${roleId}`, {
          name,
          description,
        });

        await api.put(`/roles/updatePermission/${roleId}/permissions`, {
          permissionIds: selectedPermissions,
        });
      }

      setAlert({
        open: true,
        type: 'success',
        message: roleId ? 'Role updated successfully' : 'Role created successfully',
      });

      onSuccess();

      setTimeout(() => {
        onClose();
      }, 150);
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;

      setAlert({
        open: true,
        type: 'error',
        message: errorMessage || 'Failed to save role',
      });
    } finally {
      setLoading(false);
    }
  };

  const coverage = permissions.length === 0 ? 0 : Math.round((selectedPermissions.length / permissions.length) * 100);

  return (
    <AuthGuard>
      <>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]">
              <div className="grid max-h-[92vh] xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.95fr)]">
                <div className="overflow-y-auto px-6 py-6 md:px-7">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Role Builder</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                        {roleId ? 'Update role' : 'Create role'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Configure a role identity, then choose the permission set that should travel with it.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <FieldShell label="Role name">
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ADMIN, NURSE, STAFF"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      />
                    </FieldShell>

                    <FieldShell label="Coverage">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {selectedPermissions.length} of {permissions.length} permissions selected
                      </div>
                    </FieldShell>
                  </div>

                  <div className="mt-4">
                    <FieldShell label="Description">
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe when this role should be assigned."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      />
                    </FieldShell>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Permission catalog</h3>
                        <p className="text-sm text-slate-500">
                          Search and toggle permissions by operational area.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <label className="relative block w-full lg:w-72">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search permissions"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                          />
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllPermissions}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={clearPermissions}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {groupedPermissions.length === 0 ? (
                        <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-500">
                          No permissions match this search.
                        </div>
                      ) : (
                        groupedPermissions.map(group => (
                          <section key={group.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-slate-900">{group.label}</h4>
                                <p className="text-xs text-slate-500">
                                  {group.permissions.length} permission{group.permissions.length === 1 ? '' : 's'}
                                </p>
                              </div>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {
                                  group.permissions.filter(permission =>
                                    selectedPermissions.includes(permission.id)
                                  ).length
                                } selected
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {group.permissions.map(permission => {
                                const active = selectedPermissions.includes(permission.id);

                                return (
                                  <button
                                    key={permission.id}
                                    type="button"
                                    onClick={() => togglePermission(permission.id)}
                                    className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                      active
                                        ? 'border-emerald-200 bg-emerald-50'
                                        : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {sentenceCase(permission.code)}
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500">{permission.code}</div>
                                    </div>

                                    <span
                                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                        active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <aside className="border-l border-slate-100 bg-slate-50/70 px-6 py-6 md:px-7">
                  <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Live summary</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {name.trim() || 'Untitled role'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {description.trim() || 'Add a description so admins know when to assign this role.'}
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">Permission coverage</span>
                        <span className="font-semibold text-slate-900">{coverage}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#0f5b63_0%,#f6c94c_100%)] transition-all"
                          style={{ width: `${coverage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <SummaryRow label="Selected permissions" value={String(selectedPermissions.length)} />
                      <SummaryRow label="Catalog size" value={String(permissions.length)} />
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <h3 className="text-lg font-semibold text-slate-900">Selected permissions</h3>
                    <div className="mt-4 flex max-h-[320px] flex-wrap gap-2 overflow-y-auto">
                      {selectedPermissions.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                          No permissions selected yet.
                        </div>
                      ) : (
                        permissions
                          .filter(permission => selectedPermissions.includes(permission.id))
                          .map(permission => (
                            <span
                              key={permission.id}
                              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                            >
                              {sentenceCase(permission.code)}
                            </span>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="rounded-xl bg-[#0f5b63] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c4a51] disabled:opacity-60"
                    >
                      {loading ? 'Saving...' : roleId ? 'Save changes' : 'Create role'}
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        <AlertModal
          open={alert.open}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(current => ({ ...current, open: false }))}
        />
      </>
    </AuthGuard>
  );
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
