export type Confidence = {
  medicine: number;
  dosage: number;
  frequency: number;
  duration: number;
};

export type MedicineEntity = {
  raw_text: string;
  medicine: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  confidence: Confidence;
};

export type InteractionWarning = {
  drugs: string[];
  severity: "low" | "moderate" | "high" | string;
  message: string;
};

export type PrescriptionResult = {
  id: number | null;
  doctor_name: string | null;
  date: string | null;
  language: string;
  extracted_text: string;
  medicines: MedicineEntity[];
  warnings: InteractionWarning[];
  signature_detected: boolean;
  overall_confidence: number;
};

export type HistoryItem = {
  id: number;
  original_filename: string;
  status: string;
  created_at: string;
  structured_data: PrescriptionResult;
};

