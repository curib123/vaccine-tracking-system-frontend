'use client';

type ShimmerProps = {
  className?: string;
};

export function Shimmer({ className = '' }: ShimmerProps) {
  return <div className={`shimmer rounded-xl ${className}`.trim()} />;
}

export function ScreenShellSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="mt-3 h-10 w-72" />
          <Shimmer className="mt-4 h-4 w-[28rem] max-w-full" />
        </div>
      </div>
    </div>
  );
}

type TablePageSkeletonProps = {
  columns?: number;
  rows?: number;
  showHeaderAction?: boolean;
  showFilters?: boolean;
};

export function TablePageSkeleton({
  columns = 5,
  rows = 5,
  showHeaderAction = true,
  showFilters = true,
}: TablePageSkeletonProps) {
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Shimmer className="h-9 w-56" />
          <Shimmer className="h-4 w-72 max-w-full" />
        </div>
        {showHeaderAction ? <Shimmer className="h-11 w-36" /> : null}
      </div>

      {showFilters ? (
        <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <Shimmer className="h-10 w-72 max-w-full" />
            <Shimmer className="h-10 w-40" />
            <Shimmer className="h-10 w-40" />
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-6 py-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Shimmer key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>

        <div className="divide-y px-6">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 py-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((__, cellIndex) => (
                <Shimmer
                  key={cellIndex}
                  className={cellIndex === columns - 1 ? 'h-4 w-24' : 'h-4 w-full'}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <Shimmer className="h-4 w-28" />
          <div className="flex gap-2">
            <Shimmer className="h-10 w-24" />
            <Shimmer className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

type CardListSkeletonProps = {
  count?: number;
};

export function CardListSkeleton({
  count = 4,
}: CardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Shimmer className="h-5 w-48" />
              <Shimmer className="h-4 w-72 max-w-full" />
              <Shimmer className="h-4 w-56 max-w-full" />
            </div>
            <Shimmer className="h-12 w-12 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

type DashboardSkeletonProps = {
  cards?: number;
};

export function DashboardSkeleton({
  cards = 4,
}: DashboardSkeletonProps) {
  return (
    <div className="bg-slate-50 px-6 py-8 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <Shimmer className="h-4 w-28" />
        <Shimmer className="mt-3 h-10 w-80 max-w-full" />
        <Shimmer className="mt-4 h-4 w-[30rem] max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white p-6 shadow-sm">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="mt-4 h-10 w-24" />
            <Shimmer className="mt-3 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white p-6 shadow-sm">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="mt-4 h-8 w-20" />
            <Shimmer className="mt-3 h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#eef3f8] px-4 pt-28 pb-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[36px] bg-white p-10 shadow-xl">
          <div className="flex flex-col items-center">
            <Shimmer className="h-28 w-28 rounded-full" />
            <Shimmer className="mt-6 h-8 w-56" />
            <Shimmer className="mt-3 h-4 w-72 max-w-full" />
            <Shimmer className="mt-4 h-8 w-24 rounded-full" />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2 text-center">
                <Shimmer className="mx-auto h-6 w-16" />
                <Shimmer className="mx-auto h-4 w-20" />
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
