export type WeekType = 'home' | 'reserve';
export type Mode = 'full' | 'min';
export type Category =
  | 'wake' | 'study' | 'zoom' | 'fitness' | 'run' | 'cook' | 'clean' | 'robot'
  | 'social' | 'sleep' | 'review' | 'other';

/** A recurring task in the weekly template. */
export interface TaskTemplate {
  id: string;
  title: string;
  category: Category;
  start?: string;            // "HH:MM"; omitted = no fixed time
  end?: string;              // "HH:MM"
  days: number[];            // 0 = Sunday … 6 = Saturday
  weekType: WeekType | 'both';
  minTitle?: string;         // what the task becomes in 🌱 minimum mode
  targetMin?: number;        // study: target minutes in 💪 mode
  minTargetMin?: number;     // study: target minutes in 🌱 mode
  optional?: boolean;        // not counted in the daily %
  rule?: 'firstFridayOfMonth';
  validFrom?: string;        // ISO date
  validTo?: string;          // ISO date
  active?: boolean;          // false = not yet (e.g. running before 30-min fitness)
  sleepFromTargets?: boolean;// start time comes from sleepTargets by month
}

export type LessonStep = 'summary' | 'practice' | 'recording' | 'recSummary';

export interface Lesson {
  n: number;
  group: string;
  done: Partial<Record<LessonStep, boolean>>;
  steps: LessonStep[];
}

export interface PlanItem { lesson: number; step: LessonStep; due: string }

export interface UserData {
  version: 1;
  name?: string;
  templates: TaskTemplate[];
  weekTypes: Record<string, WeekType>;      // key: Sunday ISO date
  vacations: string[];                      // ISO dates
  studyTopics: Record<string, string>;      // key: ISO date
  weekTopics: Record<string, string>;       // key: Sunday ISO date
  sleepTargets: Record<string, string>;     // key: "YYYY-MM" → "HH:MM"
  lessons: Lesson[];
  lessonPlan: PlanItem[];
}

export interface ExtraTask { id: string; title: string; start?: string; category: Category; fromDate?: string }

export interface DayLog {
  mode?: Mode;
  done: Record<string, boolean>;
  studyMin: number;
  timerStart?: number;
  extras: ExtraTask[];
  skipped: Record<string, boolean>;
}

export interface Meta {
  firstUse: string;
  reviewed: Record<string, boolean>;  // days whose unfinished tasks were handled
}

/** A task as shown on a given day (template or one-off). */
export interface DayTask {
  id: string;
  title: string;
  category: Category;
  start?: string;
  end?: string;
  optional?: boolean;
  targetMin?: number;
  extra?: boolean;
}
