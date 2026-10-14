export type ConsultationChannel = 'chat' | 'video' | 'async';
export type ConsultationStatus = 'requested' | 'active' | 'completed' | 'cancelled';

export type Consultation = {
  id: string;
  patientId: string;
  consultantId: string | null;
  pharmacyId: string | null;
  channel: ConsultationChannel;
  status: ConsultationStatus;
  chiefComplaint: string;
  prescriptionIssued: boolean;
  relatedOrderId: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ConsultationMessage = {
  id: string;
  consultationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
};
