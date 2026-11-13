import { HDate, Location, Zmanim } from '@hebcal/core';

export const JERUSALEM = Location.lookup('Jerusalem')!;

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function dayName(d: Date) {
  return DAYS[d.getDay()];
}

/** e.g. "15/11" */
export function shortDate(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Hebrew date without year, e.g. "ד׳ כסלו" */
export function hebrewDate(d: Date) {
  const full = new HDate(d).renderGematriya(true);
  return full.split(' ').slice(0, -1).join(' ');
}

export function sunTimes(d: Date) {
  const z = new Zmanim(JERUSALEM, d, false);
  return { sunrise: z.sunrise(), sunset: z.sunset() };
}

export function greeting(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
