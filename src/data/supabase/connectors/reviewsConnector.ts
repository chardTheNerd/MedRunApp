import { AppError } from '../../../core/errors/AppError';
import { NewPharmacyReview, PharmacyReview } from '../../../domain/entities/PharmacyReview';
import { getSupabase } from '../SupabaseClient';
import { throwIfError } from '../errors';
import { newReviewToRow, pharmacyReviewFromRow } from '../mappers';
import { PharmacyReviewRow } from '../rows';
import { TABLES } from '../tables';

/** Newest-first reviews for one pharmacy (public read). */
export async function listReviewsForPharmacy(pharmacyId: string): Promise<PharmacyReview[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.pharmacyReviews)
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return ((data ?? []) as PharmacyReviewRow[]).map(pharmacyReviewFromRow);
}

/** One review per patient per pharmacy (upsert on the pair). */
export async function submitReview(input: NewPharmacyReview): Promise<PharmacyReview> {
  const supabase = getSupabase();
  const payload = newReviewToRow(input);
  if (!payload.comment.trim()) {
    throw new AppError('validation', 'Write a few words about your visit.');
  }
  const { data, error } = await supabase
    .from(TABLES.pharmacyReviews)
    .upsert(
      { ...payload, comment: payload.comment.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'pharmacy_id,patient_id' },
    )
    .select('*')
    .single();
  throwIfError(error);
  return pharmacyReviewFromRow(data as PharmacyReviewRow);
}
