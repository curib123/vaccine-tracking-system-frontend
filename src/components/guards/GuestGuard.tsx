'use client';

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
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
