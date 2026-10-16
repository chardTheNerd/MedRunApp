import { Result } from '../../core/types/result';
import { NewPharmacyReview, PharmacyReview } from '../entities/PharmacyReview';

export interface PharmacyReviewRepository {
  listForPharmacy(pharmacyId: string): Promise<Result<PharmacyReview[]>>;
  submit(input: NewPharmacyReview): Promise<Result<PharmacyReview>>;
}
