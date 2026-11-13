import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; listeners.forEach((l) => l()); });
window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()); });

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

/** "Add to home screen" – available on Android Chrome when the app isn't installed yet. */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((x) => x + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  return {
    canInstall: !!deferred && !isStandalone(),
    install: async () => { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; deferred = null; force((x) => x + 1); },
  };
}
