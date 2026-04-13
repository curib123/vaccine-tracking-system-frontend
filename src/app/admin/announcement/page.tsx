"use client";

import { useEffect, useState } from "react";

import { Pencil, Trash2 } from "lucide-react";

import AlertModal from "@/components/modal/AlertModal";
import UpsertAnnouncementModal from "@/components/modal/UpsertAnnouncementModal";
import { TablePageSkeleton } from "@/components/ui/Shimmer";
import api from "@/lib/api";

/* ================= TYPES ================= */
type Announcement = {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

/* ================= COMPONENT ================= */
export default function AnnouncementPage() {
  /* ================= STATE ================= */
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  /* MODALS */
  const [openUpsert, setOpenUpsert] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  /* DELETE CONFIRM */
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ALERT */
  const [alert, setAlert] = useState({
    open: false,
    type: "success" as "success" | "error" | "warning",
    message: "",
  });

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  /* ================= LOAD ================= */
  const loadAnnouncements = async (page = 1) => {
    try {
      setLoading(true);

      const res = await api.get("/announcements/getAll", {
        params: { page, limit: PAGE_SIZE },
      });

      setAnnouncements(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: "error",
        message: "Failed to load announcements",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(1);
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/remove/${id}`);

      setAlert({
        open: true,
        type: "success",
        message: "Announcement removed successfully",
      });

      loadAnnouncements(pagination.page);
    } catch {
      setAlert({
        open: true,
        type: "error",
        message: "Failed to remove announcement",
      });
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <TablePageSkeleton columns={5} rows={6} />;
  }

  return (
    <>
      <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
        {/* HEADER */}
        <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">
                Public Updates
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Announcements
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">Manage system announcements</p>
            </div>

            <button
              onClick={() => {
                setSelectedId(null);
                setOpenUpsert(true);
              }}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#1d4ed8] shadow-sm"
            >
              + Create Announcement
            </button>
          </div>
        </header>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Title</th>
                <th className="px-5 py-3 text-left font-medium">Message</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">
                  Created At
                </th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No announcements found
                  </td>
                </tr>
              ) : (
                announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    {/* TITLE */}
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {a.title}
                    </td>

                    {/* MESSAGE */}
                    <td className="px-5 py-3 text-gray-600 max-w-md">
                      <p className="line-clamp-2">{a.message}</p>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          a.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* CREATED AT */}
                    <td className="px-5 py-3 text-center text-gray-500">
                      {fmtDate(a.createdAt)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedId(a.id);
                            setOpenUpsert(true);
                          }}
                          className="rounded-lg border p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit Announcement"
                          aria-label="Edit Announcement"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(a.id);
                            setAlert({
                              open: true,
                              type: "warning",
                              message:
                                "Are you sure you want to remove this announcement?",
                            });
                          }}
                          className="rounded-lg border p-2 text-red-600 transition hover:bg-red-50"
                          title="Remove Announcement"
                          aria-label="Remove Announcement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex items-center justify-between px-5 py-4 border-t text-sm">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadAnnouncements(pagination.page - 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadAnnouncements(pagination.page + 1)}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UPSERT MODAL */}
      <UpsertAnnouncementModal
        open={openUpsert}
        announcementId={selectedId}
        onClose={() => setOpenUpsert(false)}
        onSaved={() => loadAnnouncements(pagination.page)}
      />

      {/* ALERT / CONFIRM MODAL */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        actionLabel={deleteId ? "Yes, Remove" : undefined}
        onAction={
          deleteId
            ? async () => {
                await handleDelete(deleteId);
                setDeleteId(null);
              }
            : undefined
        }
        onClose={() => {
          setAlert((prev) => ({ ...prev, open: false }));
          setDeleteId(null);
        }}
      />
    </>
  );
}
