'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Check,
  ChevronDown,
  X,
} from 'lucide-react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */

type Props = {
  open: boolean;
  visitId?: number | null;
  initialChild?: Child | null;
  onClose: () => void;
  onSaved: () => void;
};

type Child = {
  id: number;
  firstName: string;
  lastName: string;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

/* ================= COMPONENT ================= */

export default function UpsertVisitModal({
  open,
  visitId,
  initialChild = null,
  onClose,
  onSaved,
}: Props) {
  if (!open) return null;

  const isEdit = Boolean(visitId);

  const [selectedChildren, setSelectedChildren] =
    useState<Child[]>([]);

  const [selectedNurse, setSelectedNurse] =
    useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  const [form, setForm] = useState({
    visitDate: '',
    location: '',
  });

  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'success' | 'error',
    message: '',
  });

  /* ================= LOAD USERS ================= */

  useEffect(() => {
    if (!open) return;

    api.get('/user/getAllUsers').then(res =>
      setUsers(res.data.data || [])
    );
  }, [open]);

  /* ================= LOAD VISIT (EDIT MODE) ================= */

  useEffect(() => {
    if (!open || !isEdit || !visitId) return;

    api.get(`/visits/getVisitById/${visitId}`).then(res => {
      const v = res.data.data;

      setForm({
        visitDate: v.visitDate.slice(0, 10),
        location: v.location || '',
      });

      if (v.nurseName) {
        setSelectedNurse({
          id: 0,
          firstName: v.nurseName,
          lastName: '',
        });
      }
    });
  }, [open, isEdit, visitId]);

  useEffect(() => {
    if (!open || isEdit) return;

    setSelectedChildren(initialChild ? [initialChild] : []);
  }, [open, isEdit, initialChild]);

  /* ================= SAVE ================= */

  const save = async () => {
    if (!form.visitDate) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Visit date is required',
      });
      return;
    }

    if (!isEdit && selectedChildren.length === 0) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Select at least one child',
      });
      return;
    }

    try {
      setSaving(true);

      // ✏️ EDIT MODE → UPDATE VISIT
      if (isEdit && visitId) {
        const payload = {
          visitDate: form.visitDate,
          location: form.location || null,
          nurseName: selectedNurse
            ? `${selectedNurse.firstName} ${selectedNurse.lastName}`.trim()
            : null,
        };

        await api.put(
          `/visits/updateVisitById/${visitId}`,
          payload
        );
      }
      // 🆕 CREATE MODE → CREATE VISITS
      else {
        const payload = {
          childIds: selectedChildren.map(c => c.id),
          visitDate: form.visitDate,
          location: form.location || null,
          nurseName: selectedNurse
            ? `${selectedNurse.firstName} ${selectedNurse.lastName}`.trim()
            : null,
        };

        await api.post('/visits/createVisit', payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save visit',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <AlertModal
        {...alert}
        onClose={() =>
          setAlert(a => ({ ...a, open: false }))
        }
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
          {/* HEADER */}
          <header className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEdit ? 'Edit Visit' : initialChild ? 'Create Visit' : 'Create Visits'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEdit
                  ? 'Update visit details'
                  : initialChild
                    ? 'Create an actual clinic visit for this child'
                    : 'One visit per selected child'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <X />
            </button>
          </header>

          {/* BODY */}
          <div className="space-y-6 px-6 py-4">
            {!isEdit && (
              <SearchableMultiSelectChildren
                value={selectedChildren}
                onChange={setSelectedChildren}
                disabled={Boolean(initialChild)}
              />
            )}

            <Field label="Visit Date">
              <input
                type="date"
                value={form.visitDate}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    visitDate: e.target.value,
                  }))
                }
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <Field label="Location">
              <input
                placeholder="Barangay Health Center"
                value={form.location}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    location: e.target.value,
                  }))
                }
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <SearchableSelect<User>
              label="Nurse / Health Worker"
              items={users}
              value={selectedNurse}
              getLabel={u =>
                `${u.firstName} ${u.lastName}`
              }
              onChange={setSelectedNurse}
              placeholder="Search nurse..."
              allowCustom
            />
          </div>

          {/* FOOTER */}
          <footer className="flex justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white
                         hover:bg-blue-700 disabled:opacity-50"
            >
              {isEdit
                ? 'Update Visit'
                : `Create ${selectedChildren.length || ''} Visit(s)`}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

/* ================= CHILD SELECTOR ================= */

function SearchableMultiSelectChildren({
  value,
  onChange,
  disabled = false,
}: {
  value: Child[];
  onChange: (v: Child[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Child[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (reset = false) => {
    const nextPage = reset ? 1 : page;

    const res = await api.get('/child/getAllChildren', {
      params: {
        page: nextPage,
        limit: 10,
        search,
      },
    });

    const data = res.data.data || [];
    const pagination = res.data.pagination || {};

    setItems(reset ? data : [...items, ...data]);
    setTotalPages(pagination.totalPages || 1);
    setPage(nextPage + 1);
  };

  useEffect(() => {
    if (open) load(true);
  }, [open]);

  const toggle = (child: Child) => {
    if (value.some(c => c.id === child.id)) {
      onChange(value.filter(c => c.id !== child.id));
    } else {
      onChange([...value, child]);
    }
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Select Children
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed"
      >
        {value.length
          ? `${value.length} child selected`
          : 'Search children'}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl bg-white shadow-xl">
          <div className="p-3">
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
                load(true);
              }}
              placeholder="Search child name..."
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {items.map(child => (
              <button
                key={child.id}
                onClick={() => toggle(child)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                {child.firstName} {child.lastName}
                {value.some(c => c.id === child.id) && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}

            {page <= totalPages && (
              <button
                onClick={() => load()}
                className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SEARCHABLE SELECT ================= */

function SearchableSelect<T>({
  label,
  items,
  value,
  getLabel,
  onChange,
  placeholder,
  allowCustom = false,
}: {
  label: string;
  items: T[];
  value: T | null;
  getLabel: (item: T) => string;
  onChange: (item: T | null) => void;
  placeholder: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = items.filter(i =>
    getLabel(i).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm hover:bg-slate-100"
      >
        <span className="truncate">
          {value ? getLabel(value) : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl bg-white shadow-xl">
          <div className="p-3">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-52 overflow-auto">
            {filtered.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                {getLabel(item)}
                {value === item && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}

            {allowCustom && query && (
              <button
                onClick={() => {
                  onChange({
                    firstName: query,
                    lastName: '',
                  } as T);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
              >
                Use “{query}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= FIELD ================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
