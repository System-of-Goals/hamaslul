import type { LessonStep, UserData } from './types';

export const STEP_LABEL: Record<LessonStep, string> = {
  summary: 'סיכום',
  practice: 'תרגול',
  recording: 'הקלטה',
  recSummary: 'סיכום הקלטה',
};

const isDoneStep = (data: UserData, lesson: number, step: LessonStep) =>
  !!data.lessons.find((l) => l.n === lesson)?.done[step];

/** Behind = lessons with an item due before today that isn't done. Ahead = done items not due yet. */
export function coursePace(data: UserData | null, todayIso: string) {
  if (!data?.lessonPlan.length) return null;
  const overdue = data.lessonPlan.filter((p) => p.due < todayIso && !isDoneStep(data, p.lesson, p.step));
  const behind = new Set(overdue.map((p) => p.lesson)).size;
  if (behind) return { status: 'behind' as const, n: behind };
  const early = data.lessonPlan.filter((p) => p.due > todayIso && isDoneStep(data, p.lesson, p.step));
  const ahead = new Set(early.map((p) => p.lesson)).size;
  if (ahead) return { status: 'ahead' as const, n: ahead };
  return { status: 'on' as const, n: 0 };
}

/** Plan items due today (shown inside the study task). */
export const dueToday = (data: UserData | null, todayIso: string) =>
  data?.lessonPlan.filter((p) => p.due === todayIso) ?? [];

export { isDoneStep };
