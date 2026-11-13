import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dock from './components/Dock';
import LockScreen from './components/LockScreen';
import { hasPin } from './lib/lock';
import { useTheme, type ThemeMode } from './lib/theme';
import Today from './pages/Today';

// every page except "Today" loads on demand → faster start
const Week = lazy(() => import('./pages/Week'));
const Study = lazy(() => import('./pages/Study'));
const Goals = lazy(() => import('./pages/Goals'));
const More = lazy(() => import('./pages/More'));
const Habits = lazy(() => import('./pages/Habits'));
const Money = lazy(() => import('./pages/Money'));
const Summary = lazy(() => import('./pages/Summary'));
const BackOnTrack = lazy(() => import('./pages/BackOnTrack'));
const Settings = lazy(() => import('./pages/Settings'));
import { StoreProvider, useStore } from './lib/store';
import { useReminders } from './lib/reminders';

const AUTO_LOCK_MS = 5 * 60_000; // lock again after 5 minutes in the background

type LockState = 'loading' | 'setup' | 'locked' | 'open';

export default function App() {
  const { mode, setMode } = useTheme();
  const [lock, setLock] = useState<LockState>('loading');
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    hasPin().then((has) => setLock(has ? 'locked' : 'setup'));
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > AUTO_LOCK_MS) setLock((s) => (s === 'open' ? 'locked' : s));
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const orbs = <div className="orbs" aria-hidden><span className="a" /><span className="b" /><span className="c" /></div>;

  if (lock === 'loading') return orbs;
  if (lock !== 'open') {
    return <>{orbs}<LockScreen key={lock} firstRun={lock === 'setup'} onUnlock={() => setLock('open')} /></>;
  }

  return (
    <StoreProvider>
      <Shell orbs={orbs} mode={mode} setMode={setMode} onLock={() => setLock('locked')} onChangePin={() => setLock('setup')} />
    </StoreProvider>
  );
}

function Shell({ orbs, mode, setMode, onLock, onChangePin }: {
  orbs: JSX.Element; mode: ThemeMode; setMode: (m: ThemeMode) => void; onLock: () => void; onChangePin: () => void;
}) {
  const { ready } = useStore();
  const { toast, dismiss } = useReminders();
  if (!ready) return orbs;
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      {orbs}
      <Suspense fallback={<main className="page" />}>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/week" element={<Week />} />
        <Route path="/study" element={<Study />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/more" element={<More />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/money" element={<Money />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/back-on-track" element={<BackOnTrack />} />
        <Route path="/settings" element={
          <Settings mode={mode} setMode={setMode} onLock={onLock} onChangePin={onChangePin} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <Dock />
      {toast && <button className="toast glass" onClick={dismiss}>{toast}</button>}
    </BrowserRouter>
  );
}
