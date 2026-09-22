// The patient record: the one data shape the whole app is built around,
// plus the translation between it and the snake_case `patients` table.
import type { Database } from '@/integrations/supabase/types';

type PatientRow = Database['public']['Tables']['patients']['Row'];
type PatientWrite = Database['public']['Tables']['patients']['Insert'];

// Central data model used throughout the app for a patient's record
export interface PatientData {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  symptoms: string;
  medicalHistory: string;
  diagnosis: string;
  treatmentPlan: string;
  transcript: string;
  formattedTranscript?: string;
  createdAt: string;
  // Vitals
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

// The fields the AI extractor can fill in. Every one is optional because the
// model returns "N/A" or omits a field when the transcript does not mention it.
export type ExtractedPatientInfo = Partial<Record<keyof PatientData, string>>;

// A blank record for a new entry. `createdAt` is stamped per call, so callers
// get the moment they asked for a fresh form.
export const createEmptyPatient = (): PatientData => ({
  id: '',
  patientName: '',
  age: '',
  gender: '',
  symptoms: '',
  medicalHistory: '',
  diagnosis: '',
  treatmentPlan: '',
  transcript: '',
  createdAt: new Date().toISOString(),
  // Vitals
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  respiratoryRate: '',
  oxygenSaturation: '',
  weight: '',
  height: '',
});

// Database row -> UI model. Nullable columns become empty strings so the
// form inputs stay controlled.
export const rowToPatient = (row: PatientRow): PatientData => ({
  id: row.id,
  patientName: row.patient_name,
  age: row.age || '',
  gender: row.gender || '',
  symptoms: row.symptoms || '',
  medicalHistory: row.medical_history || '',
  diagnosis: row.diagnosis || '',
  treatmentPlan: row.treatment_plan || '',
  transcript: row.transcript || '',
  formattedTranscript: row.formatted_transcript || '',
  createdAt: row.created_at,
  bloodPressure: row.blood_pressure || '',
  heartRate: row.heart_rate || '',
  temperature: row.temperature || '',
  respiratoryRate: row.respiratory_rate || '',
  oxygenSaturation: row.oxygen_saturation || '',
  weight: row.weight || '',
  height: row.height || '',
});

// UI model -> database columns. `id` and `created_at` are omitted: the row is
// addressed by id on update, and the database stamps creation time on insert.
export const patientToRow = (patient: PatientData): PatientWrite => ({
  patient_name: patient.patientName,
  age: patient.age,
  gender: patient.gender,
  symptoms: patient.symptoms,
  medical_history: patient.medicalHistory,
  diagnosis: patient.diagnosis,
  treatment_plan: patient.treatmentPlan,
  transcript: patient.transcript,
  formatted_transcript: patient.formattedTranscript || '',
  blood_pressure: patient.bloodPressure,
  heart_rate: patient.heartRate,
  temperature: patient.temperature,
  respiratory_rate: patient.respiratoryRate,
  oxygen_saturation: patient.oxygenSaturation,
  weight: patient.weight,
  height: patient.height,
});

// The vitals, in the order they appear in both the form and the read-only view.
export const VITAL_FIELDS = [
  { field: 'bloodPressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg' },
  { field: 'heartRate', label: 'Heart Rate', placeholder: 'e.g., 72 bpm' },
  { field: 'temperature', label: 'Temperature', placeholder: 'e.g., 98.6°F' },
  { field: 'respiratoryRate', label: 'Respiratory Rate', placeholder: 'e.g., 16 breaths/min' },
  { field: 'oxygenSaturation', label: 'Oxygen Saturation', placeholder: 'e.g., 98%' },
  { field: 'weight', label: 'Weight', placeholder: 'e.g., 70 kg' },
  { field: 'height', label: 'Height', placeholder: 'e.g., 175 cm' },
] as const satisfies ReadonlyArray<{ field: keyof PatientData; label: string; placeholder: string }>;
