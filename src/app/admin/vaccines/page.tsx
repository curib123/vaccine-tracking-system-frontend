"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

import AuthGuard from "@/components/guards/AuthGuard";
import AlertModal from "@/components/modal/AlertModal";
import UpsertVaccineModal from "@/components/modal/UpsertVaccineModal";
import { TablePageSkeleton } from "@/components/ui/Shimmer";
import api from "@/lib/api";

/* ================= TYPES ================= */
type Schedule = {
  doseLabel: string;
  doseNumber: number;
  recommendedAgeInMonths: number;
  intervalDays?: number;
};

type Vaccine = {
  id: number;
  name: string;
  description?: string;
  recommendedAge: string;
  totalDoses?: number;
  requiresBooster?: boolean;
  boosterAfterMonths?: number;
  schedules?: Schedule[];
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ================= PAGE ================= */
function VaccinePageContent() {
  /* ================= STATE ================= */
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchVaccines(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder]);

  const fetchVaccines = async (page: number) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;

      const { data } = await api.get("/vaccine/getAllVaccines", { params });

      setVaccines(data.data || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => fetchVaccines(pagination.page);

  /* ================= ACTIONS ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    await api.patch(`/vaccine/toggleIsDeleted/${deleteId}`);
    setAlertOpen(false);
    reload();
  };

  /* ================= MEMO ================= */
  const hasData = useMemo(() => vaccines.length > 0, [vaccines]);

  if (loading) {
    return <TablePageSkeleton columns={6} rows={6} />;
  }

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8">
      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Vaccine Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage vaccines and their immunization schedules
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedId(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Create Vaccine
        </button>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white rounded-xl shadow px-6 py-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vaccine name"
          className="px-4 py-2 rounded-lg border text-sm w-64"
        />

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split(":");
            setSortBy(sb);
            setSortOrder(so as "asc" | "desc");
          }}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="name:asc">Name A–Z</option>
          <option value="recommendedAge:asc">Recommended Age</option>
          <option value="totalDoses:asc">Total Doses</option>
        </select>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Vaccine</th>
              <th className="px-6 py-3 text-left font-medium">
                Recommended Age
              </th>
              <th className="px-6 py-3 text-left font-medium">Doses</th>
              <th className="px-6 py-3 text-left font-medium">Booster</th>
              <th className="px-6 py-3 text-left font-medium">Created</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400">
                  No vaccines found
                </td>
              </tr>
            )}

            {vaccines.map((v) => (
              <Fragment key={v.id}>
                {/* MAIN ROW */}
                <tr className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {v.name}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {v.recommendedAge}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {v.totalDoses ?? "—"}
                  </td>

                  <td className="px-6 py-4">
                    {v.requiresBooster ? (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                        Yes
                        {v.boosterAfterMonths
                          ? ` (${v.boosterAfterMonths}m)`
                          : ""}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === v.id ? null : v.id)
                        }
                        className="rounded-lg border p-2 text-slate-600 transition hover:bg-slate-50"
                        title={
                          expandedId === v.id
                            ? "Hide Schedule"
                            : "View Schedule"
                        }
                        aria-label={
                          expandedId === v.id
                            ? "Hide Schedule"
                            : "View Schedule"
                        }
                      >
                        {expandedId === v.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedId(v.id);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border p-2 text-blue-600 transition hover:bg-blue-50"
                        title="Edit Vaccine"
                        aria-label="Edit Vaccine"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => {
                          setDeleteId(v.id);
                          setAlertOpen(true);
                        }}
                        className="rounded-lg border p-2 text-red-600 transition hover:bg-red-50"
                        title="Remove Vaccine"
                        aria-label="Remove Vaccine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* COLLAPSIBLE SCHEDULE ROW */}
                {expandedId === v.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-8 py-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">
                        Immunization Schedule
                      </h4>

                      {!v.schedules?.length ? (
                        <p className="text-sm text-slate-400">
                          No schedules defined
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {v.schedules.map((s) => (
                            <div
                              key={`${v.id}-${s.doseNumber}`}
                              className="rounded-lg border bg-white p-3 text-sm"
                            >
                              <div className="font-medium text-slate-800">
                                {s.doseLabel || `Dose ${s.doseNumber}`}
                              </div>

                              <div className="text-xs text-slate-500">
                                Age: {s.recommendedAgeInMonths} month(s)
                                {s.intervalDays
                                  ? ` • Interval: ${s.intervalDays} days`
                                  : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 text-sm text-slate-500">
          <span>
            Page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchVaccines(pagination.page - 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchVaccines(pagination.page + 1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <UpsertVaccineModal
        open={modalOpen}
        vaccineId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />

      <AlertModal
        open={alertOpen}
        type="warning"
        title="Remove Vaccine"
        message="Are you sure you want to remove this vaccine?"
        actionLabel="Remove"
        onClose={() => setAlertOpen(false)}
        onAction={confirmDelete}
      />
    </div>
  );
}

/* ================= EXPORT ================= */
export default function VaccinePage() {
  return (
    <AuthGuard>
      <VaccinePageContent />
    </AuthGuard>
  );
}
