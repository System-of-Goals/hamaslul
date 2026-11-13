import { useEffect, useRef, useState } from 'react';
import { iso, nowMin, toMin } from './dates';
import { tasksFor } from './schedule';
import { useStore } from './store';

/**
 * In-app reminders: while the app is open, fire a notification at the start of each task
 * (and at the end of the study block). No server – nothing is sent anywhere.
 */
export function useReminders() {
  const { data, logFor } = useStore();
  const fired = useRef(new Set<string>());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const tick = async () => {
      const now = new Date();
      const day = iso(now);
      const log = logFor(day);
      const m = nowMin(now);
      for (const t of tasksFor(now, data, log, log.mode)) {
        const events: [string, string][] = [];
        if (t.start && toMin(t.start) === m) events.push([`${day}:${t.id}:s`, t.category === 'study' ? `📚 מתחילים ללמוד – ${t.title}` : `⏰ ${t.start} · ${t.title}`]);
        if (t.category === 'study' && t.end && toMin(t.end) === m) events.push([`${day}:${t.id}:e`, '✅ סוף זמן הלימוד – סמן כמה למדת']);
        for (const [key, text] of events) {
          if (fired.current.has(key)) continue;
          fired.current.add(key);
          setToast(text);
          setTimeout(() => setToast((cur) => (cur === text ? null : cur)), 8000);
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const reg = await navigator.serviceWorker?.ready;
              if (reg) await reg.showNotification('המסלול שלי', { body: text, icon: `${import.meta.env.BASE_URL}icons/icon-192.png`, tag: key });
              else new Notification('המסלול שלי', { body: text });
            } catch { /* ignore */ }
          }
        }
      }
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, [data, logFor]);

  return { toast, dismiss: () => setToast(null) };
}
