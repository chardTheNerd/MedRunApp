export type PharmacyReview = {
  id: string;
  pharmacyId: string;
  patientId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewPharmacyReview = {
  pharmacyId: string;
  patientId: string;
  authorName: string;
  rating: number;
  comment: string;
};
