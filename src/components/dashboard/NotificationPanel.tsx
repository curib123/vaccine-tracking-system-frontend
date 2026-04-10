'use client';

import NotificationInbox, { NotificationPanelLink } from '@/components/notifications/NotificationInbox';

export default function NotificationPanel({
  title = 'Notifications',
  href,
}: {
  title?: string;
  href: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NotificationPanelLink href={href} />
      </div>
      <NotificationInbox
        title={title}
        subtitle="Role-based updates and reminder notices for the signed-in account."
        limit={8}
        compact
      />
    </div>
  );
}
