import { flags, HDate, HebrewCalendar, Location, Zmanim } from '@hebcal/core';

export const JERUSALEM = Location.lookup('Jerusalem')!;

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const dayName = (d: Date) => DAYS[d.getDay()];
export const shortDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

/** Local ISO date "YYYY-MM-DD". */
export function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const fromIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const weekStart = (d: Date) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -d.getDay());

export function sunTimes(d: Date) {
  const z = new Zmanim(JERUSALEM, d, false);
  return { sunrise: z.sunrise(), sunset: z.sunset() };
}

/** Hebrew date without year; the Hebrew day starts at sunset. */
export function hebrewDate(d: Date) {
  const after = d >= sunTimes(d).sunset;
  const full = new HDate(after ? addDays(d, 1) : d).renderGematriya(true);
  return full.split(' ').slice(0, -1).join(' ');
}

/** Shabbat or Yom Tov (Israel) on this civil date. */
export function restDay(d: Date): string | null {
  if (d.getDay() === 6) return 'שבת';
  const evs = HebrewCalendar.getHolidaysOnDate(new HDate(d), true) ?? [];
  const chag = evs.find((e) => e.getFlags() & flags.CHAG);
  return chag ? chag.render('he-x-NoNikud') : null;
}

export function greeting(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const fmtDur = (min: number) => `${Math.floor(min / 60)}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
