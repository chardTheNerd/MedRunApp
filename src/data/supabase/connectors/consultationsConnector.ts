import { Consultation, ConsultationMessage } from '../../../domain/entities/Consultation';
import { RequestConsultationInput } from '../../../domain/repositories/ConsultationRepository';
import { getSupabase } from '../SupabaseClient';
import { throwIfError } from '../errors';
import { consultationFromRow, messageFromRow } from '../mappers';
import { ConsultationMessageRow, ConsultationRow } from '../rows';
import { TABLES } from '../tables';

export async function requestConsultation(input: RequestConsultationInput): Promise<Consultation> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLES.consultations)
    .insert({
      patient_id: input.patientId,
      consultant_id: input.consultantId,
      pharmacy_id: input.pharmacyId,
      channel: input.channel,
      status: 'requested',
      chief_complaint: input.chiefComplaint,
      prescription_issued: false,
      related_order_id: input.relatedOrderId,
      started_at: null,
      ended_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  throwIfError(error);
  return getConsultationById((data as { id: string }).id);
}

export async function getConsultationById(consultationId: string): Promise<Consultation> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.consultations)
    .select('*')
    .eq('id', consultationId)
    .single();
  throwIfError(error, 'Consultation was not found.');
  return consultationFromRow(data as ConsultationRow);
}

export async function listConsultationsForPatient(patientId: string): Promise<Consultation[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.consultations)
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return ((data ?? []) as ConsultationRow[]).map(consultationFromRow);
}

export async function sendConsultationMessage(
  consultationId: string,
  senderId: string,
  body: string,
): Promise<ConsultationMessage> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLES.consultationMessages)
    .insert({
      consultation_id: consultationId,
      sender_id: senderId,
      body,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  throwIfError(error);
  return messageFromRow(data as ConsultationMessageRow);
}
