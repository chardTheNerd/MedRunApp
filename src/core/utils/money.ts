import { NG_CURRENCY, NG_LOCALE } from '../config/nigeria';

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat(NG_LOCALE, {
    style: 'currency',
    currency: NG_CURRENCY,
    maximumFractionDigits: 2,
  }).format(koboToNaira(kobo));
}
