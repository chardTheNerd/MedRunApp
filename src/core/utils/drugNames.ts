/**
 * Normalize free-text drug input for comparison: lowercase, trim, and
 * collapse punctuation/whitespace so " Panadol-Extra " matches "panadol extra".
 */
export function normalizeDrugName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9/+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = prev[j];
      prev[j] = next;
    }
  }
  return prev[b.length];
}

function isPlausibleMisspelling(needle: string, candidate: string): boolean {
  if (needle.length < 5 || candidate.length < 5) {
    return false;
  }
  if (Math.abs(needle.length - candidate.length) > 2) {
    return false;
  }
  return levenshtein(needle, candidate) <= 2;
}

/**
 * Return the candidates that are plausible misspellings of the needle
 * (e.g. "paracetmol" matches "paracetamol"). Inputs are normalized here,
 * so callers may pass raw strings.
 */
export function closeMatches(needle: string, candidates: Iterable<string>): string[] {
  const normalized = normalizeDrugName(needle);
  if (!normalized) {
    return [];
  }
  const matches: string[] = [];
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeDrugName(candidate);
    if (normalizedCandidate && normalizedCandidate !== normalized && isPlausibleMisspelling(normalized, normalizedCandidate)) {
      matches.push(normalizedCandidate);
    }
  }
  return matches;
}
