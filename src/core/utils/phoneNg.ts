import { NG_DIAL_CODE } from '../config/nigeria';

export function toE164Ng(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `${NG_DIAL_CODE}${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `${NG_DIAL_CODE}${digits}`;
  }
  return null;
}

export function isValidNgPhone(input: string): boolean {
  return toE164Ng(input) !== null;
}
