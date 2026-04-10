'use client';

import { useEffect, useState } from 'react';

import api from '@/lib/api';

type NotificationItem = {
  id: number;
  readAt?: string | null;
};

export default function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get('/notifications/me', {
        params: { limit: 100 },
      })
      .then(res => {
        if (!active) return;

        const items: NotificationItem[] = res.data.data || [];
        setUnreadCount(items.filter(item => !item.readAt).length);
      })
      .catch(() => {
        if (!active) return;
        setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  return unreadCount;
}
