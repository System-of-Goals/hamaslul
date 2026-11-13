import { Dumbbell, Sprout } from 'lucide-react';
import type { Mode } from '../../lib/types';

export default function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="mode-toggle glass" role="radiogroup" aria-label="איך אני היום?">
      <button role="radio" aria-checked={mode === 'full'} className={mode === 'full' ? 'on' : ''} onClick={() => onChange('full')}>
        <Dumbbell size={18} /> עם כוח
      </button>
      <button role="radio" aria-checked={mode === 'min'} className={mode === 'min' ? 'on min' : ''} onClick={() => onChange('min')}>
        <Sprout size={18} className={mode === 'min' ? 'sprout' : ''} /> מינימום
      </button>
    </div>
  );
}
