'use client';

import { useMemo } from 'react';

import { useParams, useSearchParams } from 'next/navigation';

import PrintableChildImmunizationRecord from '@/components/immunization/PrintableChildImmunizationRecord';

export default function PrintableChildRecordPage() {
  const params = useParams<{ childId: string }>();
  const searchParams = useSearchParams();

  const childId = Number(params.childId);
  const autoPrint = searchParams.get('autoprint') === '1';

  const isValidChildId = useMemo(() => Number.isFinite(childId) && childId > 0, [childId]);

  if (!isValidChildId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-[28px] border border-rose-200 bg-white px-6 py-10 text-center text-sm text-rose-700 shadow-sm">
          Invalid child record link.
        </div>
      </div>
    );
  }

  return (
    <PrintableChildImmunizationRecord
      childId={childId}
      autoPrint={autoPrint}
    />
  );
}
