'use client';

import { useEffect, useState } from 'react';

import { Plus, ShieldCheck, Syringe } from 'lucide-react';

import AuthGuard from '@/components/guards/AuthGuard';
import UpsertVaccineModal from '@/components/modal/UpsertVaccineModal';
import { TablePageSkeleton } from '@/components/ui/Shimmer';
import api from '@/lib/api';

type Schedule = {
  doseLabel: string;
  doseNumber: number;
  recommendedAgeLabel: string;
};

type Vaccine = {
  id: number;
  code: string;
  name: string;
  description?: string;
  recommendedAge: string;
  totalDoses?: number;
  stockQuantity: number;
  reorderLevel: number;
  unit: string;
  schedules: Schedule[];
};

function VaccinePageContent() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchVaccines = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vaccine/getAllVaccines', {
        params: {
          page: 1,
          limit: 20,
        },
      });

      setVaccines(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  if (loading) {
    return <TablePageSkeleton columns={4} rows={6} />;
  }

  return (
    <div className="space-y-8 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Vaccine Catalog</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Vaccine management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Add custom vaccines, manage stock, monitor low inventory, and review the full dose timing used for schedule generation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Add New Vaccine
          </button>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        {vaccines.map(vaccine => {
          const lowStock = vaccine.stockQuantity <= vaccine.reorderLevel;

          return (
            <article
              key={vaccine.id}
              className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {vaccine.totalDoses} doses
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{vaccine.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{vaccine.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(vaccine.id);
                    setModalOpen(true);
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Edit Vaccine
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Recommended" value={vaccine.recommendedAge} />
                <Stat label="Stock" value={`${vaccine.stockQuantity} ${vaccine.unit}${vaccine.stockQuantity === 1 ? '' : 's'}`} />
                <Stat
                  label="Alert Level"
                  value={lowStock ? `Low at ${vaccine.reorderLevel}` : `Reorder at ${vaccine.reorderLevel}`}
                  danger={lowStock}
                />
              </div>

              <div className="mt-6 rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Syringe className="h-4 w-4" />
                  Dose timing
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {vaccine.schedules.map(schedule => (
                    <div key={`${vaccine.id}-${schedule.doseNumber}`} className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{schedule.doseLabel}</div>
                      <div className="mt-1 text-sm text-slate-500">{schedule.recommendedAgeLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <UpsertVaccineModal
        open={modalOpen}
        vaccineId={selectedId}
        onClose={() => setModalOpen(false)}
        onSaved={fetchVaccines}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`mt-2 text-sm font-semibold ${danger ? 'text-rose-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

export default function VaccinePage() {
  return (
    <AuthGuard>
      <VaccinePageContent />
    </AuthGuard>
  );
}
