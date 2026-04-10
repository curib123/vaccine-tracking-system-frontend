'use client';

import { useEffect, useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    : fallback;

type ScheduleForm = {
  doseLabel: string;
  doseNumber: string;
  recommendedAgeLabel: string;
  dueDaysFromBirth: string;
  intervalDays: string;
};

type VaccinePayload = {
  id: number;
  code: string;
  name: string;
  description?: string;
  recommendedAge: string;
  totalDoses?: number | null;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  displayOrder?: number | null;
  schedules: Array<{
    doseLabel: string;
    doseNumber: number;
    recommendedAgeLabel: string;
    dueDaysFromBirth: number;
    intervalDays?: number | null;
  }>;
};

type Props = {
  open: boolean;
  vaccineId?: number | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type VaccineForm = {
  code: string;
  name: string;
  description: string;
  recommendedAge: string;
  totalDoses: string;
  stockQuantity: string;
  reorderLevel: string;
  unit: string;
  displayOrder: string;
  schedules: ScheduleForm[];
};

const inputClass =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm ' +
  'text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

const emptySchedule = (doseNumber = 1): ScheduleForm => ({
  doseLabel: `Dose ${doseNumber}`,
  doseNumber: String(doseNumber),
  recommendedAgeLabel: '',
  dueDaysFromBirth: '',
  intervalDays: '',
});

const initialForm: VaccineForm = {
  code: '',
  name: '',
  description: '',
  recommendedAge: '',
  totalDoses: '',
  stockQuantity: '0',
  reorderLevel: '10',
  unit: 'dose',
  displayOrder: '',
  schedules: [emptySchedule(1)],
};

export default function UpsertVaccineModal({
  open,
  vaccineId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(vaccineId);

  const [form, setForm] = useState<VaccineForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setAlert({
      open: false,
      type: 'success',
      title: '',
      message: '',
    });

    if (!isEdit) {
      setForm(initialForm);
      return;
    }

    api
      .get(`/vaccine/getVaccineById/${vaccineId}`)
      .then(res => {
        const vaccine: VaccinePayload = res.data.data;

        setForm({
          code: vaccine.code || '',
          name: vaccine.name || '',
          description: vaccine.description || '',
          recommendedAge: vaccine.recommendedAge || '',
          totalDoses: vaccine.totalDoses?.toString() || '',
          stockQuantity: vaccine.stockQuantity?.toString() || '0',
          reorderLevel: vaccine.reorderLevel?.toString() || '10',
          unit: vaccine.unit || 'dose',
          displayOrder: vaccine.displayOrder?.toString() || '',
          schedules:
            vaccine.schedules?.map(schedule => ({
              doseLabel: schedule.doseLabel || '',
              doseNumber: schedule.doseNumber?.toString() || '',
              recommendedAgeLabel: schedule.recommendedAgeLabel || '',
              dueDaysFromBirth: schedule.dueDaysFromBirth?.toString() || '',
              intervalDays: schedule.intervalDays?.toString() || '',
            })) || [emptySchedule(1)],
        });
      })
      .catch(error =>
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Failed',
          message: getErrorMessage(error, 'Failed to load vaccine details.'),
        })
      );
  }, [isEdit, open, vaccineId]);

  const updateField = (field: keyof Omit<VaccineForm, 'schedules'>, value: string) =>
    setForm(current => ({ ...current, [field]: value }));

  const updateSchedule = (index: number, field: keyof ScheduleForm, value: string) =>
    setForm(current => ({
      ...current,
      schedules: current.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule
      ),
    }));

  const addSchedule = () =>
    setForm(current => ({
      ...current,
      schedules: [...current.schedules, emptySchedule(current.schedules.length + 1)],
    }));

  const removeSchedule = (index: number) =>
    setForm(current => {
      const nextSchedules = current.schedules.filter((_, scheduleIndex) => scheduleIndex !== index);

      return {
        ...current,
        schedules:
          nextSchedules.length > 0
            ? nextSchedules.map((schedule, scheduleIndex) => ({
                ...schedule,
                doseNumber: String(scheduleIndex + 1),
              }))
            : [emptySchedule(1)],
      };
    });

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        code: form.code || undefined,
        name: form.name,
        description: form.description || undefined,
        recommendedAge: form.recommendedAge,
        totalDoses: form.totalDoses || undefined,
        stockQuantity: Number(form.stockQuantity || 0),
        reorderLevel: Number(form.reorderLevel || 0),
        unit: form.unit || 'dose',
        displayOrder: form.displayOrder || undefined,
        schedules: form.schedules.map(schedule => ({
          doseLabel: schedule.doseLabel,
          doseNumber: Number(schedule.doseNumber),
          recommendedAgeLabel: schedule.recommendedAgeLabel,
          dueDaysFromBirth: Number(schedule.dueDaysFromBirth),
          intervalDays: schedule.intervalDays === '' ? null : Number(schedule.intervalDays),
        })),
      };

      if (isEdit) {
        await api.put(`/vaccine/update/${vaccineId}`, payload);
      } else {
        await api.post('/vaccine/create', payload);
      }

      await Promise.resolve(onSaved());

      setAlert({
        open: true,
        type: 'success',
        title: isEdit ? 'Vaccine Updated' : 'Vaccine Added',
        message: isEdit
          ? 'The vaccine details were updated successfully.'
          : 'The new vaccine was added successfully.',
      });
    } catch (error: unknown) {
      setAlert({
        open: true,
        type: 'error',
        title: isEdit ? 'Update Failed' : 'Add Failed',
        message: getErrorMessage(
          error,
          isEdit ? 'Failed to update vaccine.' : 'Failed to add vaccine.'
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              {isEdit ? 'Edit Vaccine' : 'Add New Vaccine'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create custom vaccines with their own stock settings and dose schedule.
            </p>
          </div>

          <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6">
            <section className="rounded-[24px] border border-slate-200 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Vaccine Details
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Vaccine name *
                  <input
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Vaccine code
                  <input
                    value={form.code}
                    onChange={e => updateField('code', e.target.value)}
                    placeholder="Optional, auto-generated if blank"
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Recommended age *
                  <input
                    value={form.recommendedAge}
                    onChange={e => updateField('recommendedAge', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Total doses
                  <input
                    type="number"
                    min={1}
                    value={form.totalDoses}
                    onChange={e => updateField('totalDoses', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Stock quantity *
                  <input
                    type="number"
                    min={0}
                    value={form.stockQuantity}
                    onChange={e => updateField('stockQuantity', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Reorder level *
                  <input
                    type="number"
                    min={0}
                    value={form.reorderLevel}
                    onChange={e => updateField('reorderLevel', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Unit
                  <input
                    value={form.unit}
                    onChange={e => updateField('unit', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Display order
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={e => updateField('displayOrder', e.target.value)}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Dose Schedule
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add each dose with its timing so child records can be generated correctly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSchedule}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  Add dose
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {form.schedules.map((schedule, index) => (
                  <div key={`schedule-${index}`} className="rounded-[24px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Schedule #{index + 1}
                      </h4>
                      {form.schedules.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="rounded-xl border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Dose label *
                        <input
                          value={schedule.doseLabel}
                          onChange={e => updateSchedule(index, 'doseLabel', e.target.value)}
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Dose number *
                        <input
                          type="number"
                          min={1}
                          value={schedule.doseNumber}
                          onChange={e => updateSchedule(index, 'doseNumber', e.target.value)}
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                        Recommended age label *
                        <input
                          value={schedule.recommendedAgeLabel}
                          onChange={e =>
                            updateSchedule(index, 'recommendedAgeLabel', e.target.value)
                          }
                          placeholder="Example: 6 months"
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Due after birth (days) *
                        <input
                          type="number"
                          min={0}
                          value={schedule.dueDaysFromBirth}
                          onChange={e =>
                            updateSchedule(index, 'dueDaysFromBirth', e.target.value)
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Interval days
                        <input
                          type="number"
                          min={0}
                          value={schedule.intervalDays}
                          onChange={e => updateSchedule(index, 'intervalDays', e.target.value)}
                          placeholder="Optional"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
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
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Vaccine' : 'Add Vaccine'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          const wasSuccessful = alert.type === 'success';
          setAlert(current => ({ ...current, open: false }));
          if (wasSuccessful) onClose();
        }}
      />
    </>
  );
}
