'use client';

import ParentGuard from '@/components/guards/ParentGuard';
import NotificationInbox from '@/components/notifications/NotificationInbox';

function ParentNotificationsContent() {
  return (
    <div className="space-y-6">
      <NotificationInbox
        title="My Notifications"
        subtitle="This inbox is private to the signed-in parent account and includes only that account's reminders and updates."
      />
    </div>
  );
}

export default function ParentNotificationsPage() {
  return (
    <ParentGuard>
      <ParentNotificationsContent />
    </ParentGuard>
  );
}
