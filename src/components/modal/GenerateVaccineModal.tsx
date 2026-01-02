'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import AlertModal from '@/components/modal/AlertModal';
import api from '@/lib/api';

/* ================= TYPES ================= */
type Vaccine = {
  id: number;
  name: string;
  recommendedAge: string;
};

type Props = {
  open: boolean;
  childId: number | null;
  onClose: () => void;
  onGenerated: () => void;
};

/* ================= STYLES ================= */
const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm ' +
  'text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ' +
  'outline-none transition';

export default function GenerateVaccineModal({
  open,
  childId,
  onClose,
  onGenerated,
}: Props) {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [vaccineIds, setVaccineIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [alert, setAlert] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  });

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ================= LOAD VACCINES ================= */
  useEffect(() => {
    if (!open || !childId) return;

    api
      .get('/vaccine/getAllVaccines', {
        params: {
          childId,
          limit: 20,
          search: query,
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
  }, [open, query, childId]);

  /* ================= RESET ================= */
  useEffect(() => {
    if (!open) {
      setVaccines([]);
      setVaccineIds([]);
      setQuery('');
      setDropdownOpen(false);
    }
  }, [open]);

  /* ================= SUBMIT ================= */
  const handleGenerate = async () => {
    if (!childId) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Child ID is required',
      });
      return;
    }

    if (vaccineIds.length === 0) {
      setAlert({
        open: true,
        type: 'error',
        message: 'Please select at least one vaccine',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/records/generate/by-vaccines', {
        childId,
        vaccineIds,
      });

      setAlert({
        open: true,
        type: 'success',
        message: 'Vaccine records added successfully',
      });

      onGenerated();
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          'Failed to add vaccine records',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ ALERT MODAL — ALWAYS MOUNTED */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert(a => ({ ...a, open: false }));
          if (alert.type === 'success') onClose();
        }}
      />

      {/* ⛔ UI ONLY WHEN OPEN */}
      {!open || !childId ? null : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* HEADER */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                Add Vaccine Records
              </h2>
              <p className="text-sm text-slate-500">
                Select vaccines to generate missing immunization records
              </p>
            </div>

            {/* BODY */}
            <div className="px-6 py-5">
              <div ref={dropdownRef} className="relative">
                <label className="text-sm font-medium">
                  Select Vaccines *
                </label>

                <input
                  value={query}
                  placeholder="Search vaccines..."
                  onChange={e => {
                    setQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className={`${inputClass} mt-1`}
                />

                {dropdownOpen && vaccines.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow">
                    {vaccines.map(v => {
                      const selected = vaccineIds.includes(v.id);

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setVaccineIds(ids =>
                              selected
                                ? ids.filter(x => x !== v.id)
                                : [...ids, v.id]
                            )
                          }
                          className={`w-full px-4 py-2 text-left ${
                            selected
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="font-medium flex justify-between">
                            {v.name}
                            {selected && <span>✓</span>}
                          </div>
                          <div className="text-xs text-slate-500">
                            {v.recommendedAge}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
              >
                {loading ? 'Processing…' : 'Add Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
