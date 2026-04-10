'use client';

import { useEffect, useMemo, useState } from 'react';

import { Download, ExternalLink, Printer } from 'lucide-react';

import ChildImmunizationCard, {
  CardRow,
  ChildDetails,
  ImmunizationSummary,
} from '@/components/immunization/ChildImmunizationCard';
import api from '@/lib/api';

type ChildRecordItem = {
  id: number;
  dose: string;
  scheduleLabel?: string | null;
  status: string;
  nextDueDate?: string | null;
  dateGiven?: string | null;
  remarks?: string | null;
  vaccine: {
    name: string;
  };
};

type CardPayload = {
  child: ChildDetails | null;
  summary: ImmunizationSummary;
  cardRows: CardRow[];
  records: ChildRecordItem[];
};

type Props = {
  childId: number;
  autoPrint?: boolean;
};

export default function PrintableChildImmunizationRecord({
  childId,
  autoPrint = false,
}: Props) {
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    api
      .get(`/records/child/${childId}`)
      .then(({ data }) => {
        if (!active) return;

        setPayload({
          child: data.child,
          summary: data.summary,
          cardRows: data.cardRows || [],
          records: data.data || [],
        });
      })
      .catch(error => {
        if (!active) return;

        const message =
          error?.response?.data?.message ||
          'Failed to load the child immunization record for printing.';

        setError(String(message));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [childId]);

  const childName = useMemo(() => {
    const child = payload?.child;

    if (!child) return 'Child Immunization Record';

    return [child.firstName, child.middleName, child.lastName].filter(Boolean).join(' ');
  }, [payload?.child]);

  useEffect(() => {
    document.title = `${childName} - Child Immunization Record`;
  }, [childName]);

  useEffect(() => {
    if (!autoPrint || loading || !payload) return;

    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [autoPrint, loading, payload]);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          @page {
            size: auto;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 rounded-[28px] bg-white px-5 py-4 shadow-sm ring-1 ring-black/5 print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f5b63]">
                Printable Form
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                Child Immunization Record
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Open this page for review or use your browser&apos;s print dialog to save it as a PDF.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0f5b63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b4d54]"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => window.close()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Close Tab
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white px-6 py-20 text-center text-sm text-slate-400 shadow-sm ring-1 ring-black/5">
            Loading printable child immunization record...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : (
          <ChildImmunizationCard
            child={payload?.child ?? null}
            summary={payload?.summary ?? null}
            cardRows={payload?.cardRows ?? []}
          />
        )}
      </div>
    </div>
  );
}
