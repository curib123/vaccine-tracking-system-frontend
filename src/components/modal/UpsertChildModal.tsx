'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Parent = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
};

type ChildForm = {
  parentId: number | '';
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | '';
  birthDate: string;
  birthPlace: string;
};

type Props = {
  open: boolean;
  childId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

/* ================= INITIAL ================= */
const initialForm: ChildForm = {
  parentId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  birthPlace: '',
};

/* ================= COMPONENT ================= */
export default function UpsertChildModal({
  open,
  childId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(childId);

  const [form, setForm] = useState<ChildForm>(initialForm);
  const [parents, setParents] = useState<Parent[]>([]);
  const [query, setQuery] = useState('');
  const [openList, setOpenList] = useState(false);
  const [saving, setSaving] = useState(false);

  /* 🔑 REFS (AUTOFILL FIX) */
  const firstNameRef = useRef<HTMLInputElement>(null);
  const middleNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const birthPlaceRef = useRef<HTMLInputElement>(null);

  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  });

  /* ================= LOAD PARENTS ================= */
  useEffect(() => {
    if (!open) return;

    api
      .get('/parent/getAllParents', { params: { limit: 1000 } })
      .then(res => setParents(res.data.data || []))
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load parents',
        })
      );
  }, [open]);

  /* ================= LOAD CHILD (EDIT) ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm(initialForm);
      setQuery('');
      return;
    }

    api
      .get(`/child/getChildById/${childId}`)
      .then(res => {
        const c = res.data.data;
        setForm({
          parentId: c.parent?.id || '',
          firstName: c.firstName || '',
          middleName: c.middleName || '',
          lastName: c.lastName || '',
          gender: c.gender || '',
          birthDate: c.birthDate?.split('T')[0] || '',
          birthPlace: c.birthPlace || '',
        });

        if (c.parent) {
          setQuery(
            `${c.parent.firstName} ${c.parent.lastName} (${c.parent.email})`
          );
        }
      })
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load child data',
        })
      );
  }, [open, childId, isEdit]);

  /* ================= FILTER PARENTS ================= */
  const filteredParents = parents.filter(p =>
    `${p.firstName} ${p.middleName ?? ''} ${p.lastName} ${p.email}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  /* ================= SUBMIT (AUTOFILL SAFE) ================= */
  const handleSubmit = async () => {
    /* 🔥 SYNC AUTOFILLED VALUES */
    const syncedForm: ChildForm = {
      ...form,
      firstName:
        form.firstName || firstNameRef.current?.value || '',
      middleName:
        form.middleName || middleNameRef.current?.value || '',
      lastName:
        form.lastName || lastNameRef.current?.value || '',
      birthDate:
        form.birthDate || birthDateRef.current?.value || '',
      birthPlace:
        form.birthPlace || birthPlaceRef.current?.value || '',
    };

    setForm(syncedForm);

    /* ✅ VALIDATION */
    if (
      !syncedForm.parentId ||
      !syncedForm.firstName ||
      !syncedForm.lastName ||
      !syncedForm.gender ||
      !syncedForm.birthDate ||
      !syncedForm.birthPlace
    ) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Please complete all required fields',
      });
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/child/update/${childId}`, syncedForm);
      } else {
        await api.post('/child/create', syncedForm);
      }

      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Child updated successfully'
          : 'Child created successfully',
      });

      onSaved();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save child',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  /* ================= RENDER ================= */
  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">

          {/* HEADER */}
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Update Child' : 'Register Child'}
            </h2>
            <p className="text-sm text-slate-500">
              Child personal information
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4">

            {/* PARENT SEARCH */}
            <div className="relative">
              <label className="text-sm font-medium text-slate-700">
                Parent / Guardian <span className="text-red-500">*</span>
              </label>

              <input
                autoComplete="off"
                placeholder="Search parent name or email"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setOpenList(true);
                  setForm({ ...form, parentId: '' });
                }}
                onFocus={() => setOpenList(true)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border"
              />

              {openList && filteredParents.length > 0 && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white shadow-lg">
                  {filteredParents.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, parentId: p.id });
                        setQuery(
                          `${p.firstName} ${p.lastName} (${p.email})`
                        );
                        setOpenList(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50"
                    >
                      <div className="font-medium">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                ref={firstNameRef}
                name="child-first-name"
                autoComplete="given-name"
                placeholder="First name *"
                className="px-4 py-2.5 rounded-xl border"
              />

              <input
                ref={middleNameRef}
                name="child-middle-name"
                autoComplete="additional-name"
                placeholder="Middle name"
                className="px-4 py-2.5 rounded-xl border"
              />

              <input
                ref={lastNameRef}
                name="child-last-name"
                autoComplete="family-name"
                placeholder="Last name *"
                className="px-4 py-2.5 rounded-xl border"
              />
            </div>

            {/* GENDER + BIRTH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={form.gender}
                onChange={e =>
                  setForm({
                    ...form,
                    gender: e.target.value as any,
                  })
                }
                className="px-4 py-2.5 rounded-xl border"
              >
                <option value="">Select gender *</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>

              <input
                ref={birthDateRef}
                type="date"
                autoComplete="bday"
                className="px-4 py-2.5 rounded-xl border"
              />
            </div>

            {/* BIRTH PLACE */}
            <input
              ref={birthPlaceRef}
              autoComplete="birthplace"
              placeholder="Birth place *"
              className="px-4 py-2.5 rounded-xl border"
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : isEdit
                ? 'Update Child'
                : 'Create Child'}
            </button>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert(p => ({ ...p, open: false }));
          if (alert.type === 'success') onClose();
        }}
      />
    </>
  );
}
