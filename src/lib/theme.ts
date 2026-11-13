import { useEffect, useState } from 'react';
import { sunTimes } from './dates';

export type ThemeMode = 'auto' | 'light' | 'dark';
const KEY = 'theme-mode'; // small UI preference → localStorage is fine

export function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch { /* storage blocked */ }
  return 'auto';
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  const now = new Date();
  const { sunrise, sunset } = sunTimes(now);
  return now >= sunrise && now < sunset ? 'light' : 'dark';
}

function apply(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0B1530' : '#F6F7FB');
}

/** Light during the day, dark from sunset (Jerusalem times) — re-checked every minute. */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(readMode);

  useEffect(() => {
    apply(resolve(mode));
    const t = setInterval(() => apply(resolve(mode)), 60_000);
    return () => clearInterval(t);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
    setModeState(m);
  };
  return { mode, setMode };
}
