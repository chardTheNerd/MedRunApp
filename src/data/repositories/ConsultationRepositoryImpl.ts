import { Result } from '../../core/types/result';
import { Consultation, ConsultationMessage } from '../../domain/entities/Consultation';
import {
  ConsultationRepository,
  RequestConsultationInput,
} from '../../domain/repositories/ConsultationRepository';
import {
  getConsultationById,
  listConsultationMessages,
  listConsultationsForPatient,
  requestConsultation,
  sendConsultationMessage,
} from '../supabase/connectors/consultationsConnector';
import { wrap } from '../supabase/wrap';

export class ConsultationRepositoryImpl implements ConsultationRepository {
  request(input: RequestConsultationInput): Promise<Result<Consultation>> {
    return wrap(() => requestConsultation(input));
  }

  getById(consultationId: string): Promise<Result<Consultation>> {
    return wrap(() => getConsultationById(consultationId));
  }

  listForPatient(patientId: string): Promise<Result<Consultation[]>> {
    return wrap(() => listConsultationsForPatient(patientId));
  }

  listMessages(consultationId: string): Promise<Result<ConsultationMessage[]>> {
    return wrap(() => listConsultationMessages(consultationId));
  }

  sendMessage(
    consultationId: string,
    senderId: string,
    body: string,
  ): Promise<Result<ConsultationMessage>> {
    return wrap(() => sendConsultationMessage(consultationId, senderId, body));
  }
}
