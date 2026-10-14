export type DosageForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'suspension'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'drops'
  | 'inhaler'
  | 'other';

export type Medicine = {
  id: string;
  genericName: string;
  brandNames: string[];
  form: DosageForm;
  strength: string;
  prescriptionRequired: boolean;
  nafdacNumbers: string[];
  createdAt: Date;
  updatedAt: Date;
};
