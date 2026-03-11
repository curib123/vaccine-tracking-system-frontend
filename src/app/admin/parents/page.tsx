"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import AuthGuard from "@/components/guards/AuthGuard";
import AlertModal from "@/components/modal/AlertModal";
import { TablePageSkeleton } from "@/components/ui/Shimmer";
import api from "@/lib/api";

/* ================= TYPES ================= */
type Parent = {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNo?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
};

type Child = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate?: string;
};

type ImmunizationRecord = {
  id: number;
  vaccine: { name: string };
  status: { code: string };
};

type ImmunizationSummary = {
  total: number;
  completed: number;
  pending: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ================= PAGE ================= */
export default function ParentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ================= URL STATE ================= */
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const queryKey = useMemo(
    () => `${page}|${limit}|${search}|${isActive}|${sortBy}|${sortOrder}`,
    [page, limit, search, isActive, sortBy, sortOrder],
  );

  /* ================= STATE ================= */
  const [parents, setParents] = useState<Parent[]>([]);
  const [children, setChildren] = useState<Record<number, Child[]>>({});
  const [childRecords, setChildRecords] = useState<
    Record<
      number,
      { records: ImmunizationRecord[]; summary: ImmunizationSummary | null }
    >
  >({});

  const [expandedParentId, setExpandedParentId] = useState<number | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  });

  const [alert, setAlert] = useState({
    open: false,
    type: "success" as "success" | "error",
    message: "",
  });

  /* ================= URL HELPERS ================= */
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) =>
      v ? params.set(k, v) : params.delete(k),
    );
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    params.set("limit", String(limit));
    router.push(`?${params.toString()}`);
  };

  /* ================= LOADERS ================= */
  const loadParents = async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (isActive !== "") params.isActive = isActive;

      const res = await api.get("/parent/getAllParents", { params });
      setParents(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: "error",
        message: "Failed to load parents",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (parentId: number) => {
    const res = await api.get(`/parent/${parentId}/children`);
    setChildren((p) => ({
      ...p,
      [parentId]: res.data.data || [],
    }));
  };

  const loadChildRecords = async (childId: number) => {
    if (!childId || childRecords[childId]) return;

    const res = await api.get(`/records/child/${childId}`);
    setChildRecords((p) => ({
      ...p,
      [childId]: {
        records: res.data.data || [],
        summary: res.data.summary ?? null,
      },
    }));
  };

  /* ================= TOGGLES ================= */
  const toggleChildren = async (parentId: number) => {
    setExpandedParentId((prev) => (prev === parentId ? null : parentId));
    if (!children[parentId]) await loadChildren(parentId);
  };

  const toggleChildRecords = async (childId: number) => {
    setExpandedChildId((prev) => (prev === childId ? null : childId));
    await loadChildRecords(childId);
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    loadParents();
  }, [queryKey]);

  /* ================= RENDER ================= */
  if (loading) {
    return <TablePageSkeleton columns={4} rows={6} showHeaderAction={false} />;
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Parent Management
        </h1>

        {/* FILTER */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <input
            value={search}
            onChange={(e) => updateParams({ search: e.target.value })}
            placeholder="Search parent name or email"
            className="px-4 py-2 rounded-xl border text-sm w-64"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left">Parent</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Address</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {parents.map((parent) => (
                <Fragment key={`parent-${parent.id}`}>
                  <tr>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {parent.firstName} {parent.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {parent.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">{parent.contactNo || "—"}</td>
                    <td className="px-6 py-4 truncate">
                      {parent.address || "—"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleChildren(parent.id)}
                        className="rounded-lg border p-2 text-blue-600 transition hover:bg-blue-50"
                        title={
                          expandedParentId === parent.id
                            ? "Hide Children"
                            : "View Children"
                        }
                        aria-label={
                          expandedParentId === parent.id
                            ? "Hide Children"
                            : "View Children"
                        }
                      >
                        {expandedParentId === parent.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                  </tr>

                  {expandedParentId === parent.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="px-6 py-4 space-y-3">
                        {children[parent.id]?.map((child) => (
                          <div
                            key={`child-${child.id}`}
                            className="bg-white border rounded-xl"
                          >
                            <button
                              onClick={() => toggleChildRecords(child.id)}
                              className="w-full px-4 py-3 flex justify-between"
                            >
                              <div>
                                <div className="font-medium">
                                  {child.firstName} {child.lastName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {child.birthDate
                                    ? new Date(
                                        child.birthDate,
                                      ).toLocaleDateString()
                                    : ""}
                                </div>
                              </div>

                              <span className="rounded-lg border p-2 text-blue-600">
                                {expandedChildId === child.id ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </span>
                            </button>

                            {expandedChildId === child.id && (
                              <div className="px-4 pb-4 space-y-2">
                                {childRecords[child.id]?.records.length ===
                                0 ? (
                                  <div className="text-xs text-slate-400">
                                    No immunization records yet
                                  </div>
                                ) : (
                                  childRecords[child.id]?.records.map(
                                    (record) => (
                                      <div
                                        key={`record-${record.id}`}
                                        className="flex justify-between text-xs border-b py-1"
                                      >
                                        <span>{record.vaccine.name}</span>
                                        <span
                                          className={
                                            record.status.code === "COMPLETED"
                                              ? "text-green-600"
                                              : "text-yellow-600"
                                          }
                                        >
                                          {record.status.code}
                                        </span>
                                      </div>
                                    ),
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-end gap-3">
          <button
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-sm"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-sm"
          >
            Next
          </button>
        </div>

        <AlertModal
          open={alert.open}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert((a) => ({ ...a, open: false }))}
        />
      </div>
    </AuthGuard>
  );
}
