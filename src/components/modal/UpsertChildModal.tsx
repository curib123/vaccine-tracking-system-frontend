'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    : fallback;

type Parent = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  address?: string;
};

type ChildForm = {
  parentId: number | '';
  ranking: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | '';
  birthDate: string;
  birthPlace: string;
  address: string;
  motherName: string;
  fatherName: string;
  birthHeightCm: string;
  birthWeightKg: string;
  healthCenter: string;
  barangay: string;
  familyNumber: string;
};

type Props = {
  open: boolean;
  childId?: number | null;
  preselectedParent?: Parent | null;
  onClose: () => void;
  onSaved: () => void;
};

const initialForm: ChildForm = {
  parentId: '',
  ranking: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  birthPlace: '',
  address: '',
  motherName: '',
  fatherName: '',
  birthHeightCm: '',
  birthWeightKg: '',
  healthCenter: '',
  barangay: '',
  familyNumber: '',
};

const inputClass =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm ' +
  'text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

export default function UpsertChildModal({
  open,
  childId,
  preselectedParent = null,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(childId);

  const [form, setForm] = useState<ChildForm>(initialForm);
  const [parents, setParents] = useState<Parent[]>([]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!open) return;

    api
      .get('/parent/getAllParents', { params: { limit: 1000 } })
      .then(res => setParents(res.data.data || []))
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Failed',
          message: 'Failed to load parents',
        })
      );
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm({
        ...initialForm,
        parentId: preselectedParent?.id ?? '',
        address: preselectedParent?.address || '',
      });
      setQuery(
        preselectedParent
          ? `${preselectedParent.firstName} ${preselectedParent.lastName} (${preselectedParent.email})`
          : ''
      );
      return;
    }

    api
      .get(`/child/getChildById/${childId}`)
      .then(res => {
        const child = res.data.data;

        setForm({
          parentId: child.parent?.id || '',
          ranking: child.ranking?.toString() || '',
          firstName: child.firstName || '',
          middleName: child.middleName || '',
          lastName: child.lastName || '',
          gender: child.gender || '',
          birthDate: child.birthDate?.split('T')[0] || '',
          birthPlace: child.birthPlace || '',
          address: child.address || '',
          motherName: child.motherName || '',
          fatherName: child.fatherName || '',
          birthHeightCm: child.birthHeightCm?.toString() || '',
          birthWeightKg: child.birthWeightKg?.toString() || '',
          healthCenter: child.healthCenter || '',
          barangay: child.barangay || '',
          familyNumber: child.familyNumber || '',
        });

        if (child.parent) {
          setQuery(`${child.parent.firstName} ${child.parent.lastName} (${child.parent.email})`);
        }
      })
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Failed',
          message: 'Failed to load child information',
        })
      );
  }, [open, childId, isEdit, preselectedParent]);

  const filteredParents = useMemo(() => {
    const lowered = query.toLowerCase();
    return parents.filter(parent =>
      `${parent.firstName} ${parent.middleName ?? ''} ${parent.lastName} ${parent.email}`
        .toLowerCase()
        .includes(lowered)
    );
  }, [parents, query]);

  const updateField = (field: keyof ChildForm, value: string | number) =>
    setForm(current => ({ ...current, [field]: value as never }));

  const selectParent = (parent: Parent) => {
    setForm(current => ({
      ...current,
      parentId: parent.id,
      address: current.address || parent.address || '',
    }));
    setQuery(`${parent.firstName} ${parent.lastName} (${parent.email})`);
  };

  const handleSubmit = async () => {
    if (
      !form.parentId ||
      !form.ranking ||
      !form.firstName ||
      !form.lastName ||
      !form.gender ||
      !form.birthDate ||
      !form.birthPlace ||
      !form.address ||
      !form.motherName ||
      !form.fatherName ||
      !form.birthHeightCm ||
      !form.birthWeightKg ||
      !form.healthCenter ||
      !form.barangay ||
      !form.familyNumber
    ) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Missing Information',
        message: 'Please complete all required child immunization card fields.',
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        birthHeightCm: form.birthHeightCm || null,
        birthWeightKg: form.birthWeightKg || null,
      };

      if (isEdit) {
        await api.put(`/child/update/${childId}`, payload);
      } else {
        await api.post('/child/create', payload);
      }

      await Promise.resolve(onSaved());
      onClose();

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Child Updated' : 'Child Registered',
        message: isEdit
          ? 'Child information updated successfully.'
          : 'Child registered and vaccine schedule generated automatically.',
      });
    } catch (error: unknown) {
      setAlert({
        open: true,
        type: 'error',
        title: isEdit ? 'Update Failed' : 'Registration Failed',
        message: getErrorMessage(error, 'Failed to save child'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open && !alert.open) return null;

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? 'Update Child Record' : 'Register Child'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The vaccine schedule follows the physical child immunization card and is generated automatically after registration.
              </p>
            </div>

            <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6">
              <section className="rounded-[24px] border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Parent / Guardian
                </h3>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Search parent</label>
                    <input
                      value={query}
                      onChange={e => {
                        setQuery(e.target.value);
                        setForm(current => ({ ...current, parentId: '' }));
                      }}
                      placeholder="Type parent name or email"
                      className={inputClass}
                      disabled={Boolean(preselectedParent) && !isEdit}
                    />
                  </div>

                  <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
                    {filteredParents.slice(0, 6).map(parent => (
                      <button
                        key={parent.id}
                        type="button"
                        onClick={() => selectParent(parent)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          form.parentId === parent.id
                            ? 'border-sky-300 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-sky-200'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">
                          {parent.firstName} {parent.lastName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{parent.email}</div>
                      </button>
                    ))}
                  </div>

                  {preselectedParent && !isEdit ? (
                    <p className="text-xs text-slate-500">
                      New child will be registered under this parent card.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Child Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Birth order *">
                    <input
                      type="number"
                      min="1"
                      value={form.ranking}
                      onChange={e => updateField('ranking', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="First name *">
                    <input
                      value={form.firstName}
                      onChange={e => updateField('firstName', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Middle name">
                    <input
                      value={form.middleName}
                      onChange={e => updateField('middleName', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Last name *">
                    <input
                      value={form.lastName}
                      onChange={e => updateField('lastName', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Gender *">
                    <select
                      value={form.gender}
                      onChange={e => updateField('gender', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </Field>
                  <Field label="Date of birth *">
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={e => updateField('birthDate', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Place of birth *">
                    <input
                      value={form.birthPlace}
                      onChange={e => updateField('birthPlace', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Address *">
                    <input
                      value={form.address}
                      onChange={e => updateField('address', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Mother's name *">
                    <input
                      value={form.motherName}
                      onChange={e => updateField('motherName', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Father's name *">
                    <input
                      value={form.fatherName}
                      onChange={e => updateField('fatherName', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Card Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Birth height (cm) *">
                    <input
                      type="number"
                      step="0.1"
                      value={form.birthHeightCm}
                      onChange={e => updateField('birthHeightCm', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Birth weight (kg) *">
                    <input
                      type="number"
                      step="0.1"
                      value={form.birthWeightKg}
                      onChange={e => updateField('birthWeightKg', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Health center *">
                    <input
                      value={form.healthCenter}
                      onChange={e => updateField('healthCenter', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Barangay *">
                    <input
                      value={form.barangay}
                      onChange={e => updateField('barangay', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Family number *">
                    <input
                      value={form.familyNumber}
                      onChange={e => updateField('familyNumber', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEdit ? 'Update Child' : 'Register Child'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert(current => ({ ...current, open: false }));
        }}
      />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
