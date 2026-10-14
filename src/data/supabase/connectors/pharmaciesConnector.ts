import { GeoCoordinate } from '../../../core/types/geo';
import { Pharmacy, PharmacyStaff } from '../../../domain/entities/Pharmacy';
import { getSupabase } from '../SupabaseClient';
import { throwIfError } from '../errors';
import { pharmacyFromRow } from '../mappers';
import { PharmacyRow } from '../rows';
import { TABLES } from '../tables';
import { distanceKm, toGeoIndexed } from '../../firebase/geo';

export async function getPharmacyById(pharmacyId: string): Promise<Pharmacy> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.pharmacies)
    .select('*')
    .eq('id', pharmacyId)
    .single();
  throwIfError(error, 'Pharmacy was not found.');
  return pharmacyFromRow(data as PharmacyRow);
}

export async function createPharmacy(
  input: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Pharmacy> {
  const supabase = getSupabase();
  const location = toGeoIndexed(input.location);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLES.pharmacies)
    .insert({
      name: input.name,
      pcn_license_number: input.pcnLicenseNumber,
      owner_id: input.ownerId,
      phone_e164: input.phoneE164,
      email: input.email,
      address: { ...input.address, country: 'NG' },
      latitude: location.latitude,
      longitude: location.longitude,
      geohash: location.geohash,
      verification_status: input.verificationStatus,
      is_active: input.isActive,
      delivery_enabled: input.deliveryEnabled,
      pickup_enabled: input.pickupEnabled,
      delivery_radius_km: input.deliveryRadiusKm,
      rating_avg: input.ratingAvg,
      review_count: input.reviewCount,
      operating_hours: input.operatingHours,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  throwIfError(error);

  const pharmacyId = (data as { id: string }).id;
  const { error: staffError } = await supabase.from(TABLES.pharmacyStaff).insert({
    pharmacy_id: pharmacyId,
    user_id: input.ownerId,
    role: 'admin',
    invited_at: now,
  });
  throwIfError(staffError);

  return getPharmacyById(pharmacyId);
}

export async function searchNearbyPharmacies(
  center: GeoCoordinate,
  radiusKm: number,
): Promise<Pharmacy[]> {
  const supabase = getSupabase();
  // Client-side radius filter. For large datasets replace with a PostGIS
  // rpc (e.g. nearby_pharmacies(lat, lng, radius_m)) and drop this scan.
  const { data, error } = await supabase
    .from(TABLES.pharmacies)
    .select('*')
    .eq('is_active', true);
  throwIfError(error);

  return ((data ?? []) as PharmacyRow[])
    .map(pharmacyFromRow)
    .filter((pharmacy) => distanceKm(center, pharmacy.location) <= radiusKm);
}

export async function addPharmacyStaff(staff: PharmacyStaff): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLES.pharmacyStaff).upsert(
    {
      pharmacy_id: staff.pharmacyId,
      user_id: staff.userId,
      role: staff.role,
      invited_at: new Date().toISOString(),
    },
    { onConflict: 'pharmacy_id,user_id' },
  );
  throwIfError(error);
}
