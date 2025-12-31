'use client';

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import AuthGuard from '@/components/guards/AuthGuard';
import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

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
  child_id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
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
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const search = searchParams.get('search') ?? '';
  const isActive = searchParams.get('isActive') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';

  /* ================= STABLE EFFECT KEY ================= */
  const queryKey = useMemo(
    () => `${page}|${limit}|${search}|${isActive}|${sortBy}|${sortOrder}`,
    [page, limit, search, isActive, sortBy, sortOrder]
  );

  /* ================= STATE ================= */
  const [parents, setParents] = useState<Parent[]>([]);
  const [children, setChildren] = useState<Record<number, Child[]>>({});
  const [expandedParentId, setExpandedParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  });

  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  });

  /* ================= URL HELPERS ================= */
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    params.set('limit', String(limit));
    router.push(`?${params.toString()}`);
  };

  /* ================= LOADERS ================= */
  const loadParents = async () => {
    try {
      setLoading(true);

      // ✅ SEND ONLY VALID PARAMS (fix default load)
      const params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (isActive !== '') params.isActive = isActive;

      const res = await api.get('/parent/getAllParents', { params });

      setParents(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      setAlert({
        open: true,
        type: 'error',
        message: 'Failed to load parents',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (parentId: number) => {
    const res = await api.get(`/parent/${parentId}/children`);
    setChildren(prev => ({
      ...prev,
      [parentId]: res.data.data || [],
    }));
  };

  const toggleChildren = async (parentId: number) => {
    setExpandedParentId(prev => (prev === parentId ? null : parentId));

    if (!children[parentId]) {
      await loadChildren(parentId);
    }
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    loadParents();
  }, [queryKey]);

  /* ================= RENDER ================= */
  return (
    <AuthGuard>
      <div className="space-y-6">

        <h1 className="text-2xl font-semibold text-slate-800">
          Parent Management
        </h1>

        {/* ================= FILTER BAR ================= */}
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl shadow-sm">
          <input
            value={search}
            onChange={e => updateParams({ search: e.target.value })}
            placeholder="Search name, email, contact..."
            className="px-4 py-2 rounded-xl border text-sm w-64"
          />

          <select
            value={isActive}
            onChange={e => updateParams({ isActive: e.target.value })}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split(':');
              updateParams({ sortBy: sb, sortOrder: so });
            }}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="lastName:asc">Last Name A–Z</option>
            <option value="email:asc">Email A–Z</option>
          </select>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left">Parent</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Address</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!loading && parents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No parents found
                  </td>
                </tr>
              )}

              {parents.map(parent => (
                <Fragment key={parent.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {parent.firstName} {parent.middleName} {parent.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {parent.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {parent.contactNo || '—'}
                    </td>

                    <td className="px-6 py-4 truncate">
                      {parent.address || '—'}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleChildren(parent.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                      >
                        {expandedParentId === parent.id
                          ? 'Hide Children'
                          : 'View Children'}
                      </button>
                    </td>
                  </tr>

                  {expandedParentId === parent.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="px-6 py-4">
                        {children[parent.id]?.length ? (
                          <div className="space-y-2">
                            {children[parent.id].map(child => (
                              <div
                                key={child.child_id}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {child.first_name} {child.last_name}
                                </span>
                                <span className="text-slate-400">
                                  {child.date_of_birth || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm">
                            No children found
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-end gap-3">
          <button
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <AlertModal
          open={alert.open}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(p => ({ ...p, open: false }))}
        />
      </div>
    </AuthGuard>
  );
}
