/**
 * Coerce wire values from PostgREST into numbers.
 *
 * Postgres `numeric` and `bigint` columns arrive as STRINGS. The row types in
 * ./rows declare those columns as `number | string` so the compiler forces
 * every mapper through these helpers — never trust the wire type, never call
 * Number() inline and silently accept NaN.
 */

/** Coerce to a finite number, falling back when the wire value is garbage. */
export function toNumber(value: number | string | null | undefined, fallback = 0): number {
  const coerced = typeof value === 'string' ? Number(value) : (value ?? fallback);
  return Number.isFinite(coerced) ? coerced : fallback;
}

/** Coerce a kobo amount; always rounds to whole kobo, never NaN. */
export function toKobo(value: number | string | null | undefined): number {
  return Math.round(toNumber(value));
}
