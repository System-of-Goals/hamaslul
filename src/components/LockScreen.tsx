import { useEffect, useState } from 'react';
import { Delete, Fingerprint } from 'lucide-react';
import {
  checkPin, enrollFingerprint, fingerprintAvailable, hasFingerprint, setPin, unlockWithFingerprint,
} from '../lib/lock';

type Mode = 'unlock' | 'setup' | 'confirm' | 'offer-fp';

export default function LockScreen({ firstRun, onUnlock }: { firstRun: boolean; onUnlock: () => void }) {
  const [mode, setMode] = useState<Mode>(firstRun ? 'setup' : 'unlock');
  const [pin, setPinValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [fp, setFp] = useState(false);

  useEffect(() => {
    if (mode !== 'unlock') return;
    hasFingerprint().then((has) => {
      setFp(has);
      if (has) tryFingerprint();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function tryFingerprint() {
    if (await unlockWithFingerprint()) onUnlock();
  }

  function fail(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => { setShake(false); setPinValue(''); }, 450);
  }

  async function complete(value: string) {
    if (mode === 'unlock') {
      if (await checkPin(value)) onUnlock();
      else fail('קוד שגוי, נסה שוב');
    } else if (mode === 'setup') {
      setFirstPin(value); setPinValue(''); setError(''); setMode('confirm');
    } else if (mode === 'confirm') {
      if (value !== firstPin) { setMode('setup'); fail('הקודים לא תואמים – בחר קוד מחדש'); return; }
      await setPin(value);
      if (await fingerprintAvailable()) setMode('offer-fp');
      else onUnlock();
    }
  }

  function press(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPinValue(next);
    setError('');
    if (next.length === 4) setTimeout(() => complete(next), 120);
  }

  async function enableFp() {
    try { await enrollFingerprint(); } catch { /* user cancelled */ }
    onUnlock();
  }

  const title = {
    unlock: 'הקלד את הקוד שלך',
    setup: 'בחר קוד של 4 ספרות',
    confirm: 'הקלד את הקוד שוב',
    'offer-fp': 'להשתמש גם בטביעת אצבע?',
  }[mode];

  return (
    <div className="lock">
      <img src={`${import.meta.env.BASE_URL}icons/logo.svg`} alt="" className="lock-logo" />
      <h1>המסלול שלי</h1>
      <p className="muted">{title}</p>

      {mode === 'offer-fp' ? (
        <div className="stack" style={{ width: '100%', maxWidth: 300, marginTop: 24 }}>
          <button className="btn btn-gold" onClick={enableFp}><Fingerprint size={20} /> כן, הפעל טביעת אצבע</button>
          <button className="btn" onClick={onUnlock}>לא עכשיו</button>
        </div>
      ) : (
        <>
          <div className={`pin-dots ${shake ? 'shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}
          </div>
          <p className="lock-error" role="alert">{error}</p>
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} onClick={() => press(d)}>{d}</button>
            ))}
            {mode === 'unlock' && fp
              ? <button aria-label="טביעת אצבע" onClick={tryFingerprint}><Fingerprint /></button>
              : <span />}
            <button onClick={() => press('0')}>0</button>
            <button aria-label="מחק" onClick={() => setPinValue(pin.slice(0, -1))}><Delete /></button>
          </div>
        </>
      )}
    </div>
  );
}
