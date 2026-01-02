'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Check,
  X,
} from 'lucide-react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */

type Props = {
  open: boolean;
  visitId: number;
  childId: number;
  onClose: () => void;
  onSaved: () => void;
};

type RecordItem = {
  id: number;
  dose: string;
  vaccine: {
    name: string;
  };
};

type ImmunizationStatus = {
  value: string;
  label: string;
};

/* ================= COMPONENT ================= */

export default function AttachRecordsToVisitModal({
  open,
  visitId,
  childId,
  onClose,
  onSaved,
}: Props) {
  if (!open) return null;

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [statuses, setStatuses] = useState<
    ImmunizationStatus[]
  >([]);
  const [status, setStatus] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    type: 'error' as 'success' | 'error',
    message: '',
  });

  /* ================= LOAD STATUSES ================= */

  useEffect(() => {
    if (!open) return;

    api
      .get('records/statuses')
      .then(res => {
        const all = res.data.data || [];

        // ❌ Do NOT allow PENDING to be attached
        const allowed = all.filter(
          (s: ImmunizationStatus) =>
            s.value !== 'PENDING'
        );

        setStatuses(allowed);

        // Default to first allowed status
        if (allowed.length > 0) {
          setStatus(allowed[0].value);
        }
      })
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load statuses',
        })
      );
  }, [open]);

  /* ================= LOAD RECORDS ================= */

  useEffect(() => {
    if (!open) return;

    api
      .get(`/records/child/${childId}`, {
        params: { status: 'PENDING' },
      })
      .then(res => {
        setRecords(res.data.data || []);
      })
      .catch(() =>
        setAlert({
          open: true,
          type: 'error',
          message: 'Failed to load immunization records',
        })
      );
  }, [open, childId]);

  /* ================= TOGGLE RECORD ================= */

  const toggleRecord = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  /* ================= SAVE ================= */

  const attach = async () => {
    if (!status) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Please select a status',
      });
      return;
    }

    if (selectedIds.length === 0) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Please select at least one record',
      });
      return;
    }

    try {
      setLoading(true);

      await api.post('/visits/attachRecordsToVisit', {
        visitId,
        childId,
        recordIds: selectedIds,
        status,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to attach records',
      });
    } finally {
      setLoading(false);
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
        <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl">
          {/* HEADER */}
          <header className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Attach Immunization Records
              </h2>
              <p className="text-sm text-slate-500">
                Select records administered during this visit
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-slate-100"
            >
              <X />
            </button>
          </header>

          {/* BODY */}
          <div className="space-y-5 px-6 py-6">
            {/* STATUS */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={e =>
                  setStatus(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5
                           text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(s => (
                  <option
                    key={s.value}
                    value={s.value}
                  >
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RECORD LIST */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Immunization Records
              </label>

              <div className="max-h-64 overflow-auto rounded-xl border">
                {records.length === 0 && (
                  <div className="p-4 text-sm text-slate-500">
                    No pending records found
                  </div>
                )}

                {records.map(r => (
                  <button
                    key={r.id}
                    onClick={() =>
                      toggleRecord(r.id)
                    }
                    className="flex w-full items-center justify-between px-4 py-3
                               text-sm hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {r.vaccine.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.dose}
                      </p>
                    </div>

                    {selectedIds.includes(r.id) && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="flex justify-end gap-3 border-t px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              onClick={attach}
              className="rounded-xl bg-blue-600 px-5 py-2
                         text-sm font-medium text-white
                         hover:bg-blue-700 disabled:opacity-50"
            >
              Attach Records
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
