'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import UpsertUserModal from '@/components/modal/UpsertUserModal';
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

/* ================= PAGE ================= */
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

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertUserId, setAlertUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page: number) => {
    const { data } = await api.get('/user/getAllUsers', {
      params: { page, limit: pagination.limit },
    });
    setUsers(data.data || []);
    setPagination(data.pagination);
  };

  const reload = () => fetchUsers(pagination.page);

  const currentUser = useMemo(
    () => users.find(u => u.id === sessionUser?.id),
    [users, sessionUser]
  );

  const otherUsers = useMemo(
    () => users.filter(u => u.id !== sessionUser?.id),
    [users, sessionUser]
  );

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        Loading users…
      </div>
    );
  }

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
{/* CURRENT USER */}
{currentUser && (
  <section className="relative bg-white rounded-2xl shadow-md px-6 py-5">
    {/* Subtle top accent */}
    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-500/80" />

    <div className="flex items-start justify-between">
      {/* LEFT */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          My Account
        </p>

        <h3 className="text-base font-semibold text-slate-900 leading-tight">
          {currentUser.firstName} {currentUser.lastName}
        </h3>

        <p className="text-sm text-slate-500">
          {currentUser.email}
        </p>

        {/* Badges */}
        <div className="flex gap-2 pt-2">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            {currentUser.roleName}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Optional avatar */}
      <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-semibold">
        {currentUser.firstName?.[0]}
        {currentUser.lastName?.[0]}
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
      <td
        colSpan={8}
        className="py-12 text-center text-slate-400"
      >
        No users found
      </td>
    </tr>
  )}

  {otherUsers.map(u => (
    <tr key={u.id} className="hover:bg-slate-50 transition">

      {/* NAME */}
      <td className="px-6 py-4">
        <p className="font-medium text-slate-800">
          {u.firstName} {u.middleName} {u.lastName}
        </p>
      </td>

      {/* EMAIL */}
      <td className="px-6 py-4 text-slate-500">
        {u.email}
      </td>

      {/* CONTACT */}
      <td className="px-6 py-4 text-slate-500">
        {u.contactNo || '—'}
      </td>

      {/* ADDRESS */}
      <td className="px-6 py-4 text-slate-500 max-w-[240px] truncate">
        {u.address || '—'}
      </td>

      {/* ROLE */}
      <td className="px-6 py-4 text-center">
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          {u.roleName}
        </span>
      </td>

      {/* STATUS */}
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

      {/* CREATED */}
      <td className="px-6 py-4 text-slate-500 text-sm">
        {new Date(u.createdAt).toLocaleDateString()}
      </td>

      {/* ACTIONS */}
      <td className="px-6 py-4 text-right space-x-2">
        <button
          onClick={() => {
            setSelectedId(u.id);
            setModalOpen(true);
          }}
          className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() => {
            setAlertUserId(u.id);
            setAlertOpen(true);
          }}
          className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition"
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
  {/* Page info */}
  <span>
    Page <span className="font-medium text-slate-700">{pagination.page}</span> of{' '}
    <span className="font-medium text-slate-700">{pagination.totalPages}</span>
  </span>

  {/* Controls */}
  <div className="flex items-center gap-2">
    <button
      disabled={pagination.page === 1}
      onClick={() => fetchUsers(pagination.page - 1)}
      className="
        px-4 py-2 rounded-lg
        bg-slate-100 text-slate-700
        hover:bg-slate-200
        disabled:opacity-40 disabled:cursor-not-allowed
        transition
      "
    >
      Previous
    </button>

    <button
      disabled={pagination.page === pagination.totalPages}
      onClick={() => fetchUsers(pagination.page + 1)}
      className="
        px-4 py-2 rounded-lg
        bg-slate-100 text-slate-700
        hover:bg-slate-200
        disabled:opacity-40 disabled:cursor-not-allowed
        transition
      "
    >
      Next
    </button>
  </div>
</div>

      </section>

      <UpsertUserModal
        open={modalOpen}
        userId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
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

export default function UsersPage() {
  return (
    <AuthGuard>
      <UsersPageContent />
    </AuthGuard>
  );
}
