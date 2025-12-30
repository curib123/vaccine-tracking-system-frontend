'use client';

import useSessionGuard from '@/hooks/useSessionGuard';

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export default function AuthGuard({
  children,
  redirectTo = '/login',
}: Props) {
  const { loading } = useSessionGuard({
    mode: 'protected',
    redirectTo,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
