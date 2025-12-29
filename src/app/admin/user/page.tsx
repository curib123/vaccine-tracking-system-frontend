'use client';

import {
  useEffect,
  useState,
} from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */
type Role = {
  id: number;
  name: string;
  description: string;
};

type User = {
  id: number;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  contactNo: string;
  address: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ================= COMPONENT ================= */
export default function UserManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /* ================= INIT ================= */
  useEffect(() => {
    fetchRoles();
    fetchUsers(1);
  }, []);

  /* ================= API ================= */
  const fetchRoles = async () => {
    const res = await fetch(`${API_BASE}/roles/getAllRoles`);
    const json = await res.json();
    setRoles(json.data || []);
  };

  const fetchUsers = async (page: number) => {
    const res = await fetch(
      `${API_BASE}/user/getAllUsers?page=${page}&limit=${pagination.limit}`
    );
    const json = await res.json();
    setUsers(json.data || []);
    setPagination(json.pagination);
  };

  const toggleStatus = async (id: number) => {
    await fetch(`${API_BASE}/user/toggleIsActive/${id}/toogle-status`, {
      method: 'PATCH',
    });
    fetchUsers(pagination.page);
  };

  /* ================= UI ================= */
  return (
    <div className="bg-slate-50 p-6 space-y-10">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold text-blue-700">
          User Management
        </h1>
        <p className="text-sm text-slate-500">
          Manage system users and roles
        </p>
      </header>

      {/* ================= ROLES ================= */}
      <section className="bg-white rounded-2xl shadow">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-slate-700">Roles</h2>
          <button className="
            px-4 py-2 rounded-lg
            bg-blue-600 text-white
            border border-blue-600
            hover:bg-transparent hover:text-blue-600
            transition font-medium
          ">
            Create Role
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium">{role.name}</td>
                <td className="px-6 py-4 text-slate-600">
                  {role.description}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="
                    px-3 py-1.5 rounded-lg
                    bg-blue-600 text-white
                    border border-blue-600
                    hover:bg-transparent hover:text-blue-600
                    transition
                  ">
                    Edit
                  </button>
                  <button className="
                    px-3 py-1.5 rounded-lg
                    bg-red-600 text-white
                    border border-red-600
                    hover:bg-transparent hover:text-red-600
                    transition
                  ">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ================= USERS ================= */}
      <section className="bg-white rounded-2xl shadow">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-slate-700">Users</h2>
          <button className="
            px-4 py-2 rounded-lg
            bg-blue-600 text-white
            border border-blue-600
            hover:bg-transparent hover:text-blue-600
            transition font-medium
          ">
            Create User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Contact No</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">

                  <td className="px-4 py-3">
                    {u.firstName} {u.middleName} {u.lastName}
                  </td>

                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.contactNo}</td>
                  <td className="px-4 py-3 text-slate-600">{u.address}</td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                      {u.roleName}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition
                        ${u.isActive
                          ? 'bg-blue-600 text-white border border-blue-600 hover:bg-transparent hover:text-blue-600'
                          : 'bg-slate-400 text-white border border-slate-400 hover:bg-transparent hover:text-slate-500'
                        }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right space-x-2">
                    <button className="
                      px-3 py-1.5 rounded-lg
                      bg-blue-600 text-white
                      border border-blue-600
                      hover:bg-transparent hover:text-blue-600
                      transition
                    ">
                      Edit
                    </button>
                    <button className="
                      px-3 py-1.5 rounded-lg
                      bg-indigo-600 text-white
                      border border-indigo-600
                      hover:bg-transparent hover:text-indigo-600
                      transition
                    ">
                      Permissions
                    </button>
                    <button className="
                      px-3 py-1.5 rounded-lg
                      bg-red-600 text-white
                      border border-red-600
                      hover:bg-transparent hover:text-red-600
                      transition
                    ">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between p-5 text-sm border-t">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="space-x-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="
                px-4 py-2 rounded-lg
                bg-blue-600 text-white
                border border-blue-600
                hover:bg-transparent hover:text-blue-600
                transition
                disabled:opacity-40 disabled:pointer-events-none
              "
            >
              Previous
            </button>

            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="
                px-4 py-2 rounded-lg
                bg-blue-600 text-white
                border border-blue-600
                hover:bg-transparent hover:text-blue-600
                transition
                disabled:opacity-40 disabled:pointer-events-none
              "
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
