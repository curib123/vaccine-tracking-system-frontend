'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import AuthGuard from '@/components/guards/AuthGuard';
import { TablePageSkeleton } from '@/components/ui/Shimmer';

function LegacyImmunizationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/admin/children?${query}` : '/admin/children');
  }, [router, searchParams]);

  return <TablePageSkeleton columns={4} rows={4} showHeaderAction={false} />;
}

export default function RecordsPage() {
  return (
    <AuthGuard>
      <LegacyImmunizationRedirect />
    </AuthGuard>
  );
}
