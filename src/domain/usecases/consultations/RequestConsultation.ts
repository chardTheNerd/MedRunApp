import { AppError } from '../../../core/errors/AppError';
import { err, Result } from '../../../core/types/result';
import { Consultation } from '../../entities/Consultation';
import { ConsultationRepository, RequestConsultationInput } from '../../repositories/ConsultationRepository';

export class RequestConsultation {
  constructor(private readonly consultations: ConsultationRepository) {}

  execute(input: RequestConsultationInput): Promise<Result<Consultation>> {
    if (!input.chiefComplaint.trim()) {
      return Promise.resolve(err(new AppError('validation', 'Describe the reason for this consultation.')));
    }
    return this.consultations.request(input);
  }
}
