import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants/collections';
import { AppError } from '../../../core/errors/AppError';
import { Consultation, ConsultationMessage } from '../../../domain/entities/Consultation';
import { RequestConsultationInput } from '../../../domain/repositories/ConsultationRepository';
import { getFirebase } from '../FirebaseClient';
import { consultationFromDoc, messageFromDoc } from '../mappers';
import { ConsultationDoc, MessageDoc } from '../schema';

export async function requestConsultation(input: RequestConsultationInput): Promise<Consultation> {
  const { db } = getFirebase();
  const ref = await addDoc(collection(db, COLLECTIONS.consultations), {
    patientId: input.patientId,
    consultantId: input.consultantId,
    pharmacyId: input.pharmacyId,
    channel: input.channel,
    status: 'requested',
    chiefComplaint: input.chiefComplaint,
    prescriptionIssued: false,
    relatedOrderId: input.relatedOrderId,
    startedAt: null,
    endedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return getConsultationById(ref.id);
}

export async function getConsultationById(consultationId: string): Promise<Consultation> {
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, COLLECTIONS.consultations, consultationId));
  if (!snap.exists()) {
    throw new AppError('not-found', 'Consultation was not found.');
  }
  return consultationFromDoc(snap.id, snap.data() as ConsultationDoc);
}

export async function listConsultationsForPatient(patientId: string): Promise<Consultation[]> {
  const { db } = getFirebase();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.consultations),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((item) => consultationFromDoc(item.id, item.data() as ConsultationDoc));
}

export async function sendConsultationMessage(
  consultationId: string,
  senderId: string,
  body: string,
): Promise<ConsultationMessage> {
  const { db } = getFirebase();
  const ref = await addDoc(
    collection(db, COLLECTIONS.consultations, consultationId, COLLECTIONS.messages),
    {
      senderId,
      body,
      createdAt: serverTimestamp(),
    },
  );
  const snap = await getDoc(ref);
  return messageFromDoc(snap.id, consultationId, snap.data() as MessageDoc);
}
