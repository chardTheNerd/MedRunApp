import { Result } from '../../core/types/result';
import { NewPharmacyReview, PharmacyReview } from '../../domain/entities/PharmacyReview';
import { PharmacyReviewRepository } from '../../domain/repositories/PharmacyReviewRepository';
import { listReviewsForPharmacy, submitReview } from '../supabase/connectors/reviewsConnector';
import { wrap } from '../supabase/wrap';

export class PharmacyReviewRepositoryImpl implements PharmacyReviewRepository {
  listForPharmacy(pharmacyId: string): Promise<Result<PharmacyReview[]>> {
    return wrap(() => listReviewsForPharmacy(pharmacyId));
  }

  submit(input: NewPharmacyReview): Promise<Result<PharmacyReview>> {
    return wrap(() => submitReview(input));
  }
}
