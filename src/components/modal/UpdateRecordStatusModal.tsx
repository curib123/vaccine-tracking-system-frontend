'use client';

import { useEffect, useState } from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

type RecordItem = {
  id: number;
  status?: string;
  dateGiven?: string | null;
  remarks?: string | null;
  child?: {
    firstName: string;
    lastName: string;
  };
  vaccine: {
    name: string;
  };
  dose: string;
  nextDueDate?: string | null;
};

type Props = {
  open: boolean;
  record: RecordItem | null;
  defaultStatus?: 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  onClose: () => void;
  onSaved: () => void;
};

const statusOptions = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SKIPPED', label: 'Skipped' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const inputClass =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm ' +
  'text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

const formatDateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    : fallback;

export default function UpdateRecordStatusModal({
  open,
  record,
  defaultStatus = 'COMPLETED',
  onClose,
  onSaved,
}: Props) {
  const [status, setStatus] = useState(defaultStatus);
  const [dateGiven, setDateGiven] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [didSave, setDidSave] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!open || !record) return;

    const currentStatus = statusOptions.some(option => option.value === record.status)
      ? (record.status as (typeof statusOptions)[number]['value'])
      : defaultStatus;

    setStatus(currentStatus);
    setDateGiven(formatDateInput(record.dateGiven));
    setRemarks(record.remarks || '');
    setSaving(false);
    setDidSave(false);
    setAlert({
      open: false,
      type: 'success',
      title: '',
      message: '',
    });
  }, [defaultStatus, open, record]);

  if (!open || !record) return null;

  const handleSave = async () => {
    setSaving(true);

    try {
      await api.patch(`/records/${record.id}/status`, {
        status,
        dateGiven: status === 'COMPLETED' ? dateGiven || undefined : undefined,
        remarks: remarks || undefined,
      });

      setAlert({
        open: true,
        type: 'success',
        title: 'Record Updated',
        message: `${record.vaccine.name} ${record.dose} updated successfully.`,
      });
      setDidSave(true);
    } catch (error: unknown) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message: getErrorMessage(error, 'Failed to update the immunization record.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-[28px] bg-white shadow-2xl">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Update Immunization Record</h2>
            <p className="mt-1 text-sm text-slate-500">
              Record the dose directly without creating a separate visit.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                {record.child ? `${record.child.firstName} ${record.child.lastName}` : 'Child record'}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {record.vaccine.name} • {record.dose}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Due: {record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : 'TBD'}
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                value={status}
                onChange={e => setStatus(e.target.value as typeof defaultStatus)}
                className={inputClass}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Date given
              <input
                type="date"
                value={dateGiven}
                onChange={e => setDateGiven(e.target.value)}
                className={inputClass}
                disabled={status !== 'COMPLETED'}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Remarks
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className={inputClass}
              />
            </label>
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
              {saving ? 'Saving...' : 'Save Update'}
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
          const wasSuccessful = didSave;

          setAlert(current => ({ ...current, open: false }));

          if (wasSuccessful) {
            setDidSave(false);
            onSaved();
            onClose();
          }
        }}
      />
    </>
  );
}
