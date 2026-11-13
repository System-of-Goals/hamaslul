import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dock from './components/Dock';
import LockScreen from './components/LockScreen';
import { hasPin } from './lib/lock';
import { useTheme } from './lib/theme';
import Today from './pages/Today';
import Week from './pages/Week';
import Study from './pages/Study';
import Goals from './pages/Goals';
import More from './pages/More';
import Habits from './pages/Habits';
import Money from './pages/Money';
import Summary from './pages/Summary';
import BackOnTrack from './pages/BackOnTrack';
import Settings from './pages/Settings';

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
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      {orbs}
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
          <Settings mode={mode} setMode={setMode} onLock={() => setLock('locked')} onChangePin={() => setLock('setup')} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Dock />
    </BrowserRouter>
  );
}
