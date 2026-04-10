'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import NotificationInbox from '@/components/notifications/NotificationInbox';

function AdminNotificationsContent() {
  return (
    <div className="space-y-6 bg-[#f6f8fb] px-4 py-6 md:px-6">
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
