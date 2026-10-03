export type PatientBehaviour = 'green' | 'yellow' | 'red';
export type PatientGender = 'male' | 'female' | 'other';

export interface EmergencyContact {
  id?: number;
  patient_id?: number;
  name: string;
  phone: string;
  relation?: string;
}

export interface MedicalHistory {
  id?: number;
  patient_id?: number;
  existing_conditions?: string | null;
  allergies?: string | null;
  chronic_diseases?: string | null;
  surgeries?: string | null;
  long_term_notes?: string | null;
  existingConditions?: string | null;
  chronicDiseases?: string | null;
  longTermNotes?: string | null;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string | null;
  gender?: PatientGender | null;
  date_of_birth?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  address?: string | null;
  patient_type?: string;
  patientType?: string;
  behaviour?: PatientBehaviour;
  is_active?: boolean;
  isActive?: boolean;
  allow_sms?: boolean;
  allow_email?: boolean;
  allow_notifications?: boolean;
  therapist_id?: number | null;
  therapistId?: number | null;
  assigned_therapist?: { id: number; name: string; email: string } | null;
  emergency_contacts?: EmergencyContact[];
  emergencyContact?: { name: string; phone: string; relation?: string } | null;
  medical_history?: MedicalHistory | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientTask {
  id: number;
  patient_id: number;
  title: string;
  description?: string | null;
  status: 'pending' | 'completed';
  due_date?: string | null;
  created_at?: string;
}

export interface PatientFile {
  id: number;
  patient_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at?: string;
}

export interface PatientEpisode {
  id: number;
  patient_id: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  created_at?: string;
}
