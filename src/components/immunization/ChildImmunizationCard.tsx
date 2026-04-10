'use client';

export type ChildDetails = {
  id: number;
  ranking: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace: string;
  address?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  birthHeightCm?: number | null;
  birthWeightKg?: number | null;
  healthCenter?: string | null;
  barangay?: string | null;
  familyNumber?: string | null;
  parent?: {
    firstName?: string;
    lastName?: string;
    address?: string | null;
  };
};

export type ImmunizationSummary = {
  totalRequired: number;
  totalCompleted: number;
  totalMissed: number;
  completionRate: number;
} | null;

export type CardDose = {
  id: number;
  dose: string;
  doseNumber?: number | null;
  scheduleLabel?: string | null;
  status: string;
  nextDueDate?: string | null;
  dateGiven?: string | null;
  remarks?: string | null;
  isLate: boolean;
  isMissed: boolean;
};

export type CardRow = {
  vaccineId: number;
  vaccineCode: string;
  vaccineName: string;
  totalDoses?: number | null;
  recommendedAge: string;
  stockQuantity?: number | null;
  unit?: string | null;
  reorderLevel?: number | null;
  doses: CardDose[];
};

type Props = {
  child: ChildDetails | null;
  summary: ImmunizationSummary;
  cardRows: CardRow[];
  compact?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const fullName = (child: ChildDetails | null) =>
  child
    ? [child.firstName, child.middleName, child.lastName].filter(Boolean).join(' ')
    : '';

const displayDate = (value?: string | null) =>
  value ? dateFormatter.format(new Date(value)) : '';

const formatBirthOrder = (value?: number | null) => {
  if (!value) return '';

  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return `${value}st child`;
  if (mod10 === 2 && mod100 !== 12) return `${value}nd child`;
  if (mod10 === 3 && mod100 !== 13) return `${value}rd child`;
  return `${value}th child`;
};

const valueOrLine = (value?: string | number | null) =>
  value !== undefined && value !== null && value !== '' ? String(value) : '____________';

const formatStockLabel = (row: CardRow) => {
  const quantity = row.stockQuantity ?? 0;
  const unit = row.unit?.trim() || 'dose(s)';

  return `${quantity} ${unit}`;
};

export default function ChildImmunizationCard({
  child,
  summary,
  cardRows,
  compact = false,
}: Props) {
  if (!child) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Select a child to open the immunization card.
      </div>
    );
  }

  const infoItemClass = compact
    ? 'space-y-1 text-[11px]'
    : 'space-y-1 text-xs';

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
      <div className="bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-4 border-b-4 border-[#0f5b63] pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0f5b63]">
                Child Immunization Record
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">
                {fullName(child)}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
              <Metric label="Required" value={summary?.totalRequired ?? 0} />
              <Metric label="Completed" value={summary?.totalCompleted ?? 0} />
              <Metric label="Missed" value={summary?.totalMissed ?? 0} />
              <Metric label="Rate" value={`${summary?.completionRate ?? 0}%`} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={infoItemClass}>
              <Field label="Child's name" value={fullName(child)} />
              <Field label="Date of birth" value={displayDate(child.birthDate)} />
              <Field label="Place of birth" value={child.birthPlace} />
              <Field label="Address" value={child.address || child.parent?.address} />
            </div>

            <div className={infoItemClass}>
              <Field label="Mother's name" value={child.motherName} />
              <Field label="Father's name" value={child.fatherName} />
              <Field
                label="Birth height"
                value={child.birthHeightCm ? `${child.birthHeightCm} cm` : null}
              />
              <Field
                label="Birth weight"
                value={child.birthWeightKg ? `${child.birthWeightKg} kg` : null}
              />
              <Field label="Sex" value={child.gender === 'MALE' ? 'Male' : 'Female'} />
            </div>

            <div className={infoItemClass}>
              <Field label="Health Center" value={child.healthCenter} />
              <Field label="Barangay" value={child.barangay} />
              <Field label="Family no." value={child.familyNumber} />
              <Field label="Birth order" value={formatBirthOrder(child.ranking)} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f5b63] px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="overflow-x-auto rounded-[24px] bg-[#0f5b63] pt-3">
          <table className="min-w-full overflow-hidden rounded-[22px] bg-white text-sm">
            <thead>
              <tr className="bg-[#f6c94c] text-slate-900">
                <th className="w-[28%] px-4 py-3 text-left font-semibold">Bakuna</th>
                <th className="w-[22%] px-4 py-3 text-left font-semibold">Doses</th>
                <th className="w-[28%] px-4 py-3 text-left font-semibold">
                  Petsa ng bakuna
                  <span className="block text-[11px] font-medium text-slate-700">MM/DD/YY</span>
                </th>
                <th className="w-[22%] px-4 py-3 text-left font-semibold">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {cardRows.map(row => (
                <tr key={row.vaccineId} className="border-b border-[#0f5b63]/15 align-top">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <p>{row.vaccineName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                        Stock: {formatStockLabel(row)}
                      </span>
                      {(row.reorderLevel ?? -1) >= 0 &&
                      (row.stockQuantity ?? 0) <= (row.reorderLevel ?? 0) ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                          Low stock
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {row.doses.map(dose => (
                        <div
                          key={dose.id}
                          className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
                        >
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f6c94c] px-1 text-xs font-bold text-slate-900">
                            {dose.doseNumber ?? '-'}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{dose.dose}</div>
                            <div className="text-[11px] text-slate-500">{dose.scheduleLabel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {row.doses.map(dose => (
                        <div
                          key={dose.id}
                          className="rounded-2xl border border-slate-200 px-3 py-2"
                        >
                          <div className="text-xs font-semibold text-slate-900">
                            {displayDate(dose.dateGiven) || 'Pending'}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Due: {displayDate(dose.nextDueDate) || 'TBD'}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge
                              label={dose.status}
                              tone={
                                dose.status === 'COMPLETED'
                                  ? 'green'
                                  : dose.status === 'PENDING'
                                    ? 'amber'
                                    : 'slate'
                              }
                            />
                            {dose.isLate ? <Badge label="Late" tone="red" /> : null}
                            {dose.isMissed ? <Badge label="Missed" tone="red" /> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {row.doses.map(dose => (
                        <div
                          key={dose.id}
                          className="min-h-[62px] rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-600"
                        >
                          {dose.remarks || 'No remarks'}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <span className="font-semibold text-slate-700">{label}:</span>
      <span className="border-b border-dashed border-slate-300 pb-1 text-slate-900">
        {valueOrLine(value)}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'slate';
}) {
  const tones: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}
