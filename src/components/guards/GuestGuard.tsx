'use client';

import { ScreenShellSkeleton } from '@/components/ui/Shimmer';
import useSessionGuard from '@/hooks/useSessionGuard';

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export default function GuestGuard({
  children,
  redirectTo = '/admin/dashboard',
}: Props) {
  const { loading } = useSessionGuard({
    mode: 'guest',
    redirectTo,
  });

  if (loading) {
    return <ScreenShellSkeleton />;
  }

  return <>{children}</>;
}
