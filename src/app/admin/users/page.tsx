'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import UpsertUserModal from '@/components/modal/UpsertUserModal';
import UserPermissionModal from '@/components/modal/UserPermissionModal';
import useSessionGuard from '@/hooks/useSessionGuard';
import api from '@/lib/api';

/* ================= TYPES ================= */
type User = {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNo?: string;
  address?: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ================= PAGE CONTENT ================= */
function UsersPageContent() {
  const { user: sessionUser, loading } = useSessionGuard({
    mode: 'protected',
    redirectTo: '/login',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  /* 🆕 SEARCH / FILTER / SORT */
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionUserId, setPermissionUserId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertUserId, setAlertUserId] = useState<number | null>(null);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isActive, sortBy, sortOrder]);

  const fetchUsers = async (page: number) => {
    const params: any = {
      page,
      limit: pagination.limit,
      sortBy,
      sortOrder,
    };

    if (search) params.search = search;
    if (isActive !== '') params.isActive = isActive;

    const { data } = await api.get('/user/getAllUsers', { params });

    setUsers(data.data || []);
    setPagination(data.pagination);
  };

  const reload = () => fetchUsers(pagination.page);

  /* ================= MEMO ================= */
  const currentUser = useMemo(
    () => users.find(u => u.id === sessionUser?.id),
    [users, sessionUser]
  );

  const otherUsers = useMemo(
    () => users.filter(u => u.id !== sessionUser?.id),
    [users, sessionUser]
  );

  /* ================= ACTIONS ================= */
  const toggleStatus = async (id: number) => {
    await api.patch(`/user/toggleIsActive/${id}/toogle-status`);
    reload();
  };

  const removeUser = async () => {
    if (!alertUserId) return;
    await api.patch(`/user/toggleIsDeleted/${alertUserId}/removing`);
    reload();
    setAlertOpen(false);
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        Loading users…
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-10">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Users
        </h1>
        <p className="text-sm text-slate-500">
          Manage system users
        </p>
      </header>

      {/* 🆕 FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="px-4 py-2 border rounded-lg text-sm w-64"
        />

        <select
          value={isActive}
          onChange={e => setIsActive(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={e => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so as 'asc' | 'desc');
          }}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="lastName:asc">Name A–Z</option>
          <option value="email:asc">Email A–Z</option>
        </select>
      </section>

      {/* CURRENT USER */}
      {currentUser && (
        <section className="relative bg-white rounded-2xl shadow-md px-6 py-5">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-500/80" />

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                My Account
              </p>

              <h3 className="text-base font-semibold text-slate-900">
                {currentUser.firstName} {currentUser.lastName}
              </h3>

              <p className="text-sm text-slate-500">
                {currentUser.email}
              </p>

              <div className="flex gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {currentUser.roleName}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* USERS TABLE */}
      <section className="bg-white rounded-xl shadow-md">

        <div className="flex justify-between items-center px-6 py-5">
          <h2 className="text-sm font-semibold uppercase text-slate-700">
            All Users
          </h2>
          <button
            onClick={() => {
              setSelectedId(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            Create User
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Email</th>
              <th className="px-6 py-3 text-left font-medium">Contact</th>
              <th className="px-6 py-3 text-left font-medium">Address</th>
              <th className="px-6 py-3 text-center font-medium">Role</th>
              <th className="px-6 py-3 text-center font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Created</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {otherUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            )}

            {otherUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {u.firstName} {u.middleName} {u.lastName}
                </td>
                <td className="px-6 py-4 text-slate-500">{u.email}</td>
                <td className="px-6 py-4 text-slate-500">{u.contactNo || '—'}</td>
                <td className="px-6 py-4 text-slate-500 max-w-[240px] truncate">
                  {u.address || '—'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {u.roleName}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleStatus(u.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      u.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setPermissionUserId(u.id);
                      setPermissionOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-700 shadow hover:text-blue-600 transition text-xs"
                  >
                    Permissions
                  </button>
                  <button
                    onClick={() => {
                      setSelectedId(u.id);
                      setModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-blue-600 shadow transition text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setAlertUserId(u.id);
                      setAlertOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-red-600 shadow transition text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 text-sm text-slate-500">
          <span>
            Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <UpsertUserModal
        open={modalOpen}
        userId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />

      <UserPermissionModal
        open={permissionOpen}
        userId={permissionUserId}
        onClose={() => setPermissionOpen(false)}
        onUpdated={reload}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Remove User"
        message="Are you sure you want to remove this user?"
        actionLabel="Remove"
        onClose={() => setAlertOpen(false)}
        onAction={removeUser}
      />
    </div>
  );
}

/* ================= PAGE ================= */
export default function UsersPage() {
  return (
    <AuthGuard>
      <UsersPageContent />
    </AuthGuard>
  );
}
