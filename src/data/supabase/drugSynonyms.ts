import { closeMatches, normalizeDrugName } from '../../core/utils/drugNames';
import { MedicineRow } from './rows';

/**
 * Curated seed of Nigerian-market brand names to generic names.
 * The medicines table is the source of truth — this only covers search
 * before the catalogue is populated. Extend with local trade names as found.
 */
export const NG_BRAND_TO_GENERIC: Record<string, string> = {
  panadol: 'paracetamol',
  emzor: 'paracetamol',
  tylenol: 'paracetamol',
  amoxil: 'amoxicillin',
  fidson: 'amoxicillin',
  augmentin: 'co-amoxiclav',
  amoxiclav: 'co-amoxiclav',
  flagyl: 'metronidazole',
  septrin: 'co-trimoxazole',
  ciprotab: 'ciprofloxacin',
  nivaquine: 'chloroquine',
  coartem: 'artemether/lumefantrine',
  lonart: 'artemether/lumefantrine',
  ventolin: 'salbutamol',
  brufen: 'ibuprofen',
  electral: 'oral rehydration salts',
  feldene: 'piroxicam',
  buscopan: 'hyoscine',
};

type MedicineRef = Pick<MedicineRow, 'generic_name' | 'brand_names'>;

/**
 * Expand a raw drug query into normalized generic/brand terms, both
 * directions: "panadol" resolves to paracetamol + its brands, and
 * "paracetamol" resolves back to Panadol + other brands. Misspellings
 * resolve through fuzzy matching. Returns the normalized query itself
 * when nothing resolves, so callers keep substring behavior as fallback.
 */
export function resolveDrugTerms(rawQuery: string, medicines: MedicineRef[]): string[] {
  const needle = normalizeDrugName(rawQuery);
  if (!needle) {
    return [];
  }

  const genericOfBrand = new Map<string, string>();
  const brandsOfGeneric = new Map<string, Set<string>>();
  const index = (brand: string, generic: string) => {
    genericOfBrand.set(brand, generic);
    let brands = brandsOfGeneric.get(generic);
    if (!brands) {
      brands = new Set<string>();
      brandsOfGeneric.set(generic, brands);
    }
    brands.add(brand);
  };

  for (const [brand, generic] of Object.entries(NG_BRAND_TO_GENERIC)) {
    index(normalizeDrugName(brand), normalizeDrugName(generic));
  }
  for (const medicine of medicines) {
    const generic = normalizeDrugName(medicine.generic_name);
    if (!brandsOfGeneric.has(generic)) {
      brandsOfGeneric.set(generic, new Set<string>());
    }
    for (const brand of medicine.brand_names ?? []) {
      index(normalizeDrugName(brand), generic);
    }
  }

  const terms = new Set<string>();
  const addWithFamily = (term: string) => {
    terms.add(term);
    for (const word of term.split(' ').filter((part) => part.length >= 4)) {
      terms.add(word);
    }
    const generic = genericOfBrand.get(term) ?? (brandsOfGeneric.has(term) ? term : undefined);
    if (generic) {
      terms.add(generic);
      for (const word of generic.split(' ').filter((part) => part.length >= 4)) {
        terms.add(word);
      }
      brandsOfGeneric.get(generic)?.forEach((brand) => {
        terms.add(brand);
        for (const word of brand.split(' ').filter((part) => part.length >= 4)) {
          terms.add(word);
        }
      });
    }
  };

  addWithFamily(needle);
  const vocabulary = new Set([...genericOfBrand.keys(), ...brandsOfGeneric.keys()]);
  for (const match of closeMatches(needle, vocabulary)) {
    addWithFamily(match);
  }
  return [...terms];
}
