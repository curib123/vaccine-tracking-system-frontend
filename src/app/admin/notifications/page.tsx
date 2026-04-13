'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import NotificationInbox from '@/components/notifications/NotificationInbox';

function AdminNotificationsContent() {
  return (
    <div className="space-y-6 bg-[#f6f8fb] px-4 py-6 md:px-6">
      <header className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#7dd3fc_100%)] px-6 py-7 text-white shadow-sm">
        <p className="text-sm uppercase tracking-[0.28em] text-white/70">Message Center</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Account Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Review notifications assigned to the signed-in admin or staff account.
        </p>
      </header>
      <NotificationInbox
        title="Account Notifications"
        subtitle="This inbox shows only notifications assigned to the currently signed-in admin or staff account."
      />
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AuthGuard>
      <AdminNotificationsContent />
    </AuthGuard>
  );
}
