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

type Vaccine = {
  id: number;
  name: string;
  recommendedAge?: string;
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
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [query, setQuery] = useState('');
  const [openList, setOpenList] = useState(false);
  const [selectedVaccineIds, setSelectedVaccineIds] = useState<number[]>([]);
  const [autoGenerateRecords, setAutoGenerateRecords] = useState(true);
  const [saving, setSaving] = useState(false);

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

    api
      .get('/vaccine/getAllVaccines', {
        params: {
          limit: 500,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      })
      .then(res => setVaccines(res.data.data || []))
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load vaccines',
        })
      );
  }, [open]);

  /* ================= LOAD CHILD (EDIT MODE) ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm(initialForm);
      setQuery('');
      setSelectedVaccineIds([]);
      setAutoGenerateRecords(true);
      return;
    }

    api
      .get(`/child/getChildById/${childId}`)
      .then(res => {
        const c = res.data.data;

        const filled: ChildForm = {
          parentId: c.parent?.id || '',
          firstName: c.firstName || '',
          middleName: c.middleName || '',
          lastName: c.lastName || '',
          gender: c.gender || '',
          birthDate: c.birthDate?.split('T')[0] || '',
          birthPlace: c.birthPlace || '',
        };

        setForm(filled);

        // 🔑 Sync inputs (fix browser autofill mismatch)
        requestAnimationFrame(() => {
          if (firstNameRef.current) firstNameRef.current.value = filled.firstName;
          if (middleNameRef.current) middleNameRef.current.value = filled.middleName;
          if (lastNameRef.current) lastNameRef.current.value = filled.lastName;
          if (birthDateRef.current) birthDateRef.current.value = filled.birthDate;
          if (birthPlaceRef.current) birthPlaceRef.current.value = filled.birthPlace;
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

  const toggleVaccine = (vaccineId: number) => {
    setSelectedVaccineIds(ids =>
      ids.includes(vaccineId)
        ? ids.filter(id => id !== vaccineId)
        : [...ids, vaccineId]
    );
  };

  /* ================= FILTER PARENTS ================= */
  const filteredParents = parents.filter(p =>
    `${p.firstName} ${p.middleName ?? ''} ${p.lastName} ${p.email}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const syncedForm: ChildForm = {
      parentId: form.parentId,
      firstName: firstNameRef.current?.value.trim() || '',
      middleName: middleNameRef.current?.value.trim() || '',
      lastName: lastNameRef.current?.value.trim() || '',
      gender: form.gender,
      birthDate: birthDateRef.current?.value || '',
      birthPlace: birthPlaceRef.current?.value.trim() || '',
    };

    setForm(syncedForm);

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
      let createdChildId = childId ?? null;

      if (isEdit) {
        await api.put(`/child/update/${childId}`, syncedForm);
      } else {
        const res = await api.post('/child/create', syncedForm);
        createdChildId =
          res?.data?.data?.id ??
          res?.data?.id ??
          null;

        if (
          autoGenerateRecords &&
          createdChildId &&
          selectedVaccineIds.length > 0
        ) {
          await api.post('/records/generate/by-vaccines', {
            childId: createdChildId,
            vaccineIds: selectedVaccineIds,
          });
        }
      }

      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Child updated successfully'
          : autoGenerateRecords && selectedVaccineIds.length > 0
            ? 'Child created and vaccine records generated successfully'
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
              <input ref={firstNameRef} placeholder="First name *" className="px-4 py-2.5 rounded-xl border" />
              <input ref={middleNameRef} placeholder="Middle name" className="px-4 py-2.5 rounded-xl border" />
              <input ref={lastNameRef} placeholder="Last name *" className="px-4 py-2.5 rounded-xl border" />
            </div>

            {/* GENDER + BIRTH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value as any })}
                className="px-4 py-2.5 rounded-xl border"
              >
                <option value="">Select gender *</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>

              <input ref={birthDateRef} type="date" className="px-4 py-2.5 rounded-xl border" />
            </div>

            {/* BIRTH PLACE */}
            <input ref={birthPlaceRef} placeholder="Birth place *" className="px-4 py-2.5 rounded-xl border" />

            {!isEdit && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Initial Immunization Schedule
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Generate the child&apos;s pending vaccine records immediately after registration.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoGenerateRecords}
                      onChange={e =>
                        setAutoGenerateRecords(e.target.checked)
                      }
                    />
                    Auto-generate
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedVaccineIds(vaccines.map(v => v.id))
                    }
                    className="rounded-lg border px-3 py-1.5 text-xs text-slate-700"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVaccineIds([])}
                    className="rounded-lg border px-3 py-1.5 text-xs text-slate-700"
                  >
                    Clear
                  </button>
                </div>

                <div className="max-h-52 space-y-2 overflow-auto rounded-xl border bg-white p-3">
                  {vaccines.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No vaccines available yet. Create vaccine templates first.
                    </p>
                  ) : (
                    vaccines.map(vaccine => {
                      const selected = selectedVaccineIds.includes(vaccine.id);

                      return (
                        <label
                          key={vaccine.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition ${
                            selected
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleVaccine(vaccine.id)}
                          />

                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {vaccine.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {vaccine.recommendedAge || 'No recommended age'}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border">
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Child' : 'Create Child'}
            </button>
          </div>
        </div>
      </div>

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
