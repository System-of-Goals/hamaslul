import { useMemo } from 'react';

/** Gold confetti burst – used when a stage is completed. */
export default function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 1.6 + Math.random() * 1.2,
    rot: Math.random() * 360,
    color: ['#E8B85C', '#D4A13A', '#2EC4A0', '#F3D58E', '#FFFFFF'][i % 5],
  })), []);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}
