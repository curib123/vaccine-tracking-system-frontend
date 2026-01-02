'use client';

import {
  useEffect,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Schedule = {
  doseLabel: string;
  doseNumber: number;
  recommendedAgeInMonths: number;
  intervalDays?: number | '';
};

type VaccineForm = {
  name: string;
  description: string;
  recommendedAge: string;
  totalDoses: number | '';
  requiresBooster: boolean;
  boosterAfterMonths: number | '';
  schedules: Schedule[];
};

type Props = {
  open: boolean;
  vaccineId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

/* ================= INITIAL ================= */
const initialForm: VaccineForm = {
  name: '',
  description: '',
  recommendedAge: '',
  totalDoses: '',
  requiresBooster: false,
  boosterAfterMonths: '',
  schedules: [],
};

/* ================= STYLES ================= */
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm ' +
  'focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none';

const label =
  'text-xs font-semibold text-slate-700 uppercase tracking-wide';

const guide =
  'mt-1 text-xs text-slate-500 leading-relaxed';

/* ================= COMPONENT ================= */
function UpsertVaccineModalContent({
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
    message: '',
  });

  /* ================= LOAD (EDIT MODE) ================= */
  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setForm(initialForm);
      return;
    }

    (async () => {
      try {
        const res = await api.get(
          `/vaccine/getVaccineById/${vaccineId}`
        );
        const v = res.data.data;

        setForm({
          name: v.name || '',
          description: v.description || '',
          recommendedAge: v.recommendedAge || '',
          totalDoses: v.totalDoses ?? '',
          requiresBooster: v.requiresBooster ?? false,
          boosterAfterMonths: v.boosterAfterMonths ?? '',
          schedules: v.schedules || [],
        });
      } catch {
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load vaccine data.',
        });
      }
    })();
  }, [open, vaccineId, isEdit]);

  /* ================= DOSE SCHEDULE HELPERS ================= */
  const addSchedule = () =>
    setForm({
      ...form,
      schedules: [
        ...form.schedules,
        {
          doseLabel: '',
          doseNumber: form.schedules.length + 1,
          recommendedAgeInMonths: 0,
          intervalDays: '',
        },
      ],
    });

  const updateSchedule = (
    index: number,
    field: keyof Schedule,
    value: any
  ) => {
    const updated = [...form.schedules];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, schedules: updated });
  };

  const removeSchedule = (index: number) =>
    setForm({
      ...form,
      schedules: form.schedules.filter((_, i) => i !== index),
    });

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.recommendedAge) {
      setAlert({
        open: true,
        type: 'error',
        message:
          'Vaccine name and recommended age description are required.',
      });
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/vaccine/update/${vaccineId}`, form);
      } else {
        await api.post('/vaccine/create', form);
      }

      setAlert({
        open: true,
        type: 'success',
        message: isEdit
          ? 'Vaccine updated successfully.'
          : 'Vaccine created successfully.',
      });

      onSaved();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to save vaccine.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* MODAL */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

          {/* HEADER */}
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Update Vaccine' : 'Create Vaccine'}
            </h2>
            <p className="text-sm text-slate-500">
              Define vaccine information and dose schedules.
              These schedules are used to automatically generate
              child immunization records.
            </p>
          </div>

          {/* BODY */}
          <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">

            {/* BASIC INFO */}
            <section className="rounded-2xl border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Basic Vaccine Information
              </h3>

              <div>
                <label className={label}>Vaccine Name</label>
                <input
                  className={input}
                  value={form.name}
                  onChange={e =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
                <p className={guide}>
                  Official or commonly used vaccine name.
                  <br />
                  Example: <b>BCG</b>, <b>Pentavalent</b>, <b>MMR</b>
                </p>
              </div>

              <div>
                <label className={label}>
                  Recommended Age (Text)
                </label>
                <input
                  className={input}
                  value={form.recommendedAge}
                  onChange={e =>
                    setForm({
                      ...form,
                      recommendedAge: e.target.value,
                    })
                  }
                />
                <p className={guide}>
                  Human-readable guidance shown to users.
                  <br />
                  Example: <b>At birth</b>, <b>6 weeks</b>, <b>9 months</b>
                </p>
              </div>

              <div>
                <label className={label}>
                  Total Required Doses
                </label>
                <input
                  type="number"
                  className={input}
                  value={form.totalDoses}
                  onChange={e =>
                    setForm({
                      ...form,
                      totalDoses: Number(e.target.value) || '',
                    })
                  }
                />
                <p className={guide}>
                  Total number of doses required to complete
                  this vaccine (excluding boosters).
                  <br />
                  Example: <b>1</b>, <b>2</b>, <b>3</b>
                </p>
              </div>

              <div>
                <label className={label}>Description</label>
                <textarea
                  rows={2}
                  className={input}
                  value={form.description}
                  onChange={e =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
                <p className={guide}>
                  Short description of the disease(s) this
                  vaccine prevents.
                </p>
              </div>
            </section>

            {/* BOOSTER */}
            <section className="rounded-2xl border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Booster Configuration
              </h3>

              <p className={guide}>
                Enable this only if the vaccine requires an
                additional booster dose after completing
                the primary doses.
              </p>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Requires Booster Dose
                </span>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      requiresBooster: !form.requiresBooster,
                    })
                  }
                  className={`h-6 w-11 rounded-full relative ${
                    form.requiresBooster
                      ? 'bg-blue-600'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      form.requiresBooster
                        ? 'right-1'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {form.requiresBooster && (
                <div>
                  <label className={label}>
                    Booster After (Months)
                  </label>
                  <input
                    type="number"
                    className={input}
                    value={form.boosterAfterMonths}
                    onChange={e =>
                      setForm({
                        ...form,
                        boosterAfterMonths:
                          Number(e.target.value) || '',
                      })
                    }
                  />
                  <p className={guide}>
                    Number of months after the final
                    primary dose before giving the booster.
                    <br />
                    Example: <b>12</b> (booster after 1 year)
                  </p>
                </div>
              )}
            </section>

            {/* DOSE SCHEDULE */}
            <section className="rounded-2xl border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Dose Schedule Rules
              </h3>

              <p className={guide}>
                Each schedule defines <b>one dose rule</b>.
                The system uses these rules to automatically
                generate immunization records for every child.
              </p>

              <button
                onClick={addSchedule}
                className="text-sm text-blue-600 font-medium"
              >
                + Add Dose Schedule
              </button>

              {form.schedules.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 space-y-3"
                >
                  <div>
                    <label className={label}>Dose Label</label>
                    <input
                      className={input}
                      value={s.doseLabel}
                      onChange={e =>
                        updateSchedule(i, 'doseLabel', e.target.value)
                      }
                    />
                    <p className={guide}>
                      Display label for this dose.
                      <br />
                      Example: <b>1st Dose</b>, <b>2nd Dose</b>, <b>Booster</b>
                    </p>
                  </div>

                  <div>
                    <label className={label}>Dose Number</label>
                    <input
                      type="number"
                      className={input}
                      value={s.doseNumber}
                      onChange={e =>
                        updateSchedule(
                          i,
                          'doseNumber',
                          Number(e.target.value)
                        )
                      }
                    />
                    <p className={guide}>
                      Order of the dose in the vaccine series.
                      <br />
                      Example: <b>1</b> = first dose, <b>2</b> = second
                    </p>
                  </div>

                  <div>
                    <label className={label}>
                      Recommended Age (Months)
                    </label>
                    <input
                      type="number"
                      className={input}
                      value={s.recommendedAgeInMonths}
                      onChange={e =>
                        updateSchedule(
                          i,
                          'recommendedAgeInMonths',
                          Number(e.target.value)
                        )
                      }
                    />
                    <p className={guide}>
                      Age in months when this dose is due.
                      <br />
                      Example: <b>0</b> (birth), <b>6</b>, <b>9</b>
                    </p>
                  </div>

                  <div>
                    <label className={label}>
                      Interval After Previous Dose (Days)
                    </label>
                    <input
                      type="number"
                      className={input}
                      value={s.intervalDays ?? ''}
                      onChange={e =>
                        updateSchedule(
                          i,
                          'intervalDays',
                          Number(e.target.value) || ''
                        )
                      }
                    />
                    <p className={guide}>
                      Number of days to wait after the previous dose.
                      <br />
                      Leave blank for the first dose.
                      <br />
                      Example: <b>28</b>, <b>30</b>, <b>60</b>
                    </p>
                  </div>

                  <button
                    onClick={() => removeSchedule(i)}
                    className="text-xs text-red-500"
                  >
                    Remove this dose
                  </button>
                </div>
              ))}
            </section>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white"
            >
              {saving
                ? 'Saving...'
                : isEdit
                ? 'Update Vaccine'
                : 'Create Vaccine'}
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

/* ================= EXPORT ================= */
export default function UpsertVaccineModal(props: Props) {
  return <UpsertVaccineModalContent {...props} />;
}
