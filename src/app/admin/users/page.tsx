"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

import AuthGuard from "@/components/guards/AuthGuard";
import AlertModal from "@/components/modal/AlertModal";
import { TablePageSkeleton } from "@/components/ui/Shimmer";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import useSessionGuard from "@/hooks/useSessionGuard";
import api from "@/lib/api";

const UpsertUserModal = dynamic(
  () => import("@/components/modal/UpsertUserModal"),
  { ssr: false }
);

const UserPermissionModal = dynamic(
  () => import("@/components/modal/UserPermissionModal"),
  { ssr: false }
);

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

type RoleTab = {
  label: string;
  count: number;
};

const ALL_ROLES_TAB = "All Roles";

function fullName(user: Pick<User, "firstName" | "middleName" | "lastName">) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");
}

function roleTone(roleName: string) {
  const normalized = roleName.trim().toUpperCase();

  if (normalized.includes("ADMIN")) {
    return "bg-sky-100 text-sky-700";
  }

  if (normalized.includes("PARENT")) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-violet-100 text-violet-700";
}

function UsersPageContent() {
  const { user: sessionUser, loading: sessionLoading } = useSessionGuard({
    mode: "protected",
    redirectTo: "/login",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeRoleTab, setActiveRoleTab] = useState(ALL_ROLES_TAB);
  const debouncedSearch = useDebouncedValue(search.trim());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionUserId, setPermissionUserId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertUserId, setAlertUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const latestRequestRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const fetchUsers = useCallback(async (page: number, preserveContent = hasLoadedRef.current) => {
    const requestId = ++latestRequestRef.current;

    try {
      if (preserveContent) {
        setIsFetching(true);
      } else {
        setLoading(true);
      }

      const params: Record<string, string | number> = {
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (isActive !== "") params.isActive = isActive;

      const { data } = await api.get("/user/getAllUsers", { params });

      if (requestId !== latestRequestRef.current) {
        return;
      }

      setUsers(data.data || []);
      setPagination(data.pagination);
      hasLoadedRef.current = true;
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [debouncedSearch, isActive, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const reload = () => fetchUsers(pagination.page, true);

  const currentUser = useMemo(
    () => users.find((u) => u.id === sessionUser?.id),
    [users, sessionUser],
  );

  const otherUsers = useMemo(
    () => users.filter((u) => u.id !== sessionUser?.id),
    [users, sessionUser],
  );

  const roleTabs = useMemo<RoleTab[]>(() => {
    const counts = otherUsers.reduce<Record<string, number>>((acc, user) => {
      acc[user.roleName] = (acc[user.roleName] || 0) + 1;
      return acc;
    }, {});

    const orderedRoles = Object.entries(counts).sort((left, right) =>
      left[0].localeCompare(right[0]),
    );

    return [
      {
        label: ALL_ROLES_TAB,
        count: otherUsers.length,
      },
      ...orderedRoles.map(([label, count]) => ({ label, count })),
    ];
  }, [otherUsers]);

  useEffect(() => {
    if (!roleTabs.some((tab) => tab.label === activeRoleTab)) {
      setActiveRoleTab(ALL_ROLES_TAB);
    }
  }, [activeRoleTab, roleTabs]);

  const visibleUsers = useMemo(() => {
    if (activeRoleTab === ALL_ROLES_TAB) {
      return otherUsers;
    }

    return otherUsers.filter((user) => user.roleName === activeRoleTab);
  }, [activeRoleTab, otherUsers]);

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

  if (sessionLoading || loading) {
    return <TablePageSkeleton columns={8} rows={6} />;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">
              Access Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Organize accounts by role, review each user as a card, and manage
              permissions without switching to a table view.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedId(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1d4ed8] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </header>

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            <p className="text-sm text-slate-500">
              Search, narrow by status, and sort the current user page.
            </p>
            {isFetching && (
              <p className="mt-1 text-xs font-medium text-sky-600">
                Updating results...
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(":");
                setSortBy(sb);
                setSortOrder(so as "asc" | "desc");
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="lastName:asc">Name A-Z</option>
              <option value="email:asc">Email A-Z</option>
            </select>
          </div>
        </div>
      </section>

      {currentUser && (
        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="h-1 bg-[#1d4ed8]" />
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                My Account
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {fullName(currentUser)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
              <p className="mt-2 text-sm text-slate-500">
                {currentUser.contactNo || "No contact number"} {" - "}{" "}
                {currentUser.address || "No address"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(
                  currentUser.roleName,
                )}`}
              >
                {currentUser.roleName}
              </span>
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                {currentUser.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Users by role</h2>
            <p className="text-sm text-slate-500">
              {otherUsers.length} user{otherUsers.length === 1 ? "" : "s"} on
              this page
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {roleTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveRoleTab(tab.label)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeRoleTab === tab.label
                    ? "bg-[#1d4ed8] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleUsers.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              No users found in this role tab.
            </div>
          ) : (
            visibleUsers.map((user) => (
              <article
                key={user.id}
                className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
              >
                <div className="bg-slate-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {fullName(user)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                    </div>

                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        user.isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(
                        user.roleName,
                      )}`}
                    >
                      {user.roleName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <InfoRow label="Contact" value={user.contactNo || "Not set"} />
                    <InfoRow label="Address" value={user.address || "Not set"} />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setPermissionUserId(user.id);
                        setPermissionOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                      title="Manage Permissions"
                      aria-label="Manage Permissions"
                    >
                      <Shield size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(user.id);
                        setModalOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                      title="Edit User"
                      aria-label="Edit User"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setAlertUserId(user.id);
                        setAlertOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-red-600 transition hover:bg-red-50"
                      title="Remove User"
                      aria-label="Remove User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1, true)}
              className="rounded-xl bg-slate-100 px-4 py-2 transition hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1, true)}
              className="rounded-xl bg-slate-100 px-4 py-2 transition hover:bg-slate-200 disabled:opacity-40"
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
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
