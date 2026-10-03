import { Patient } from './patient.types';

export interface ClinicalNote {
  id: string;
  patient_id: number;
  therapist_id: number;
  type: string; // 'SOAP', 'Initial Assessment', 'Progress Note', 'Discharge Summary', etc.
  date: string;
  status: 'Draft' | 'Finalized' | 'Locked';
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  dynamic_content?: string | null;
  patient?: Patient;
  therapist?: { id: number; name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface NoteTemplate {
  id: number;
  title: string;
  category: string;
  content: string;
  isCustom?: boolean;
}
