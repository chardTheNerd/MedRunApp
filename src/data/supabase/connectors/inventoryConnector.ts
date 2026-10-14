import { InventoryListing } from '../../../domain/entities/InventoryListing';
import { Medicine } from '../../../domain/entities/Medicine';
import { NearbyListingQuery } from '../../../domain/repositories/InventoryRepository';
import { getSupabase } from '../SupabaseClient';
import { throwIfError } from '../errors';
import { listingFromRow, medicineFromRow } from '../mappers';
import { ListingRow, MedicineRow } from '../rows';
import { TABLES } from '../tables';
import { distanceKm, toGeoIndexed } from '../../firebase/geo';

export async function searchNearbyListings(input: NearbyListingQuery): Promise<InventoryListing[]> {
  const supabase = getSupabase();
  // Client-side radius filter. For large datasets replace with a PostGIS
  // rpc (e.g. nearby_listings(lat, lng, radius_m)) and drop this scan.
  const { data, error } = await supabase
    .from(TABLES.listings)
    .select('*')
    .eq('is_available', true);
  throwIfError(error);

  const needle = input.genericName?.trim().toLowerCase();
  return ((data ?? []) as ListingRow[])
    .map(listingFromRow)
    .filter((listing) => {
      if (distanceKm(input.center, listing.location) > input.radiusKm) {
        return false;
      }
      if (input.state && listing.state !== input.state) {
        return false;
      }
      if (
        needle &&
        !listing.genericName.toLowerCase().includes(needle) &&
        !listing.brandName.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    })
    .map((listing) => ({
      ...listing,
      distanceKm: distanceKm(input.center, listing.location),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.priceKobo - b.priceKobo);
}

export async function listPharmacyInventory(pharmacyId: string): Promise<InventoryListing[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.listings)
    .select('*')
    .eq('pharmacy_id', pharmacyId);
  throwIfError(error);
  return ((data ?? []) as ListingRow[]).map(listingFromRow);
}

export async function upsertListing(
  listing: Omit<InventoryListing, 'id' | 'updatedAt' | 'distanceKm'> & { id?: string },
): Promise<InventoryListing> {
  const supabase = getSupabase();
  const location = toGeoIndexed(listing.location);
  const payload = {
    pharmacy_id: listing.pharmacyId,
    medicine_id: listing.medicineId,
    brand_name: listing.brandName,
    generic_name: listing.genericName,
    form: listing.form,
    strength: listing.strength,
    nafdac_number: listing.nafdacNumber,
    pack_size: listing.packSize,
    quantity: listing.quantity,
    price_kobo: listing.priceKobo,
    currency: 'NGN',
    prescription_required: listing.prescriptionRequired,
    expiry_date: listing.expiryDate ? listing.expiryDate.toISOString() : null,
    latitude: location.latitude,
    longitude: location.longitude,
    geohash: location.geohash,
    state: listing.state,
    lga: listing.lga,
    city: listing.city,
    is_available: listing.isAvailable && listing.quantity > 0,
    updated_at: new Date().toISOString(),
  };

  if (listing.id) {
    const { data, error } = await supabase
      .from(TABLES.listings)
      .update(payload)
      .eq('id', listing.id)
      .select('*')
      .single();
    throwIfError(error, 'Listing was not found.');
    return listingFromRow(data as ListingRow);
  }

  const { data, error } = await supabase
    .from(TABLES.listings)
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return listingFromRow(data as ListingRow);
}

export async function getMedicineById(medicineId: string): Promise<Medicine> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.medicines)
    .select('*')
    .eq('id', medicineId)
    .single();
  throwIfError(error, 'Medicine was not found.');
  return medicineFromRow(data as MedicineRow);
}

export async function upsertMedicine(
  medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Medicine> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLES.medicines)
    .insert({
      generic_name: medicine.genericName,
      brand_names: medicine.brandNames,
      form: medicine.form,
      strength: medicine.strength,
      prescription_required: medicine.prescriptionRequired,
      nafdac_numbers: medicine.nafdacNumbers,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  throwIfError(error);
  return medicineFromRow(data as MedicineRow);
}
