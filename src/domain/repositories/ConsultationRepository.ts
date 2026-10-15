import { Result } from '../../core/types/result';
import { Consultation, ConsultationMessage } from '../entities/Consultation';

export type RequestConsultationInput = Omit<
  Consultation,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'prescriptionIssued' | 'startedAt' | 'endedAt'
>;

export interface ConsultationRepository {
  request(input: RequestConsultationInput): Promise<Result<Consultation>>;
  getById(consultationId: string): Promise<Result<Consultation>>;
  listForPatient(patientId: string): Promise<Result<Consultation[]>>;
  listMessages(consultationId: string): Promise<Result<ConsultationMessage[]>>;
  sendMessage(
    consultationId: string,
    senderId: string,
    body: string,
  ): Promise<Result<ConsultationMessage>>;
}
