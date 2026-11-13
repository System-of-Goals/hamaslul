import type { UserData } from './types';

export interface FitStage { title: string; kind: 'home' | 'run'; min?: number; km?: number }

/** Adaptation path: home workout 15 → 20 → 30 min (×2/week), then a running day 2 → 3 → … → 10 km. */
export const FIT_STAGES: FitStage[] = [
  { title: 'כושר ביתי 15 דק׳ × 2 בשבוע', kind: 'home', min: 15 },
  { title: 'כושר ביתי 20 דק׳ × 2 בשבוע', kind: 'home', min: 20 },
  { title: 'כושר ביתי 30 דק׳ × 2 בשבוע', kind: 'home', min: 30 },
  { title: '+ יום ריצה: 2 ק״מ', kind: 'run', km: 2 },
  { title: 'ריצה: 3 ק״מ', kind: 'run', km: 3 },
  { title: 'ריצה: 5 ק״מ', kind: 'run', km: 5 },
  { title: 'ריצה: 7 ק״מ', kind: 'run', km: 7 },
  { title: 'ריצה: 10 ק״מ 🏅', kind: 'run', km: 10 },
];

export const EASY_TO_LEVEL_UP = 4;

export function easyCount(data: UserData, stage: number) {
  return (data.workouts ?? []).filter((w) => w.stage === stage && w.rating === 'easy').length;
}

/** Moving to a stage also updates the weekly templates (home-workout length, running day on/off). */
export function applyFitStage(d: UserData, stage: number): UserData {
  const st = FIT_STAGES[stage];
  const homeMin = FIT_STAGES.slice(0, stage + 1).filter((s) => s.kind === 'home').at(-1)?.min ?? 15;
  const lastKm = st.kind === 'run' ? st.km : undefined;
  return {
    ...d,
    fitnessStage: stage,
    templates: d.templates.map((t) => {
      if (t.id === 'fitness') return { ...t, title: `כושר ביתי – ${homeMin} דק׳` };
      if (t.id === 'run') return { ...t, active: !!lastKm, title: lastKm ? `ריצה – ${lastKm} ק״מ` : t.title };
      return t;
    }),
  };
}

/** Bedtime as minutes on a 18:00→18:00 axis, so 23:30 < 00:30. */
export const bedAxis = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const v = h * 60 + m;
  return v < 18 * 60 ? v + 1440 : v;
};
