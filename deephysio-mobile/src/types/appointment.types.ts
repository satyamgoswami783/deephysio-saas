import { Patient } from './patient.types';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Service {
  id: number;
  name: string;
  category?: string | null;
  duration: number;
  price: number | string;
  is_active?: boolean;
}

export interface Appointment {
  id: number;
  patient_id: number;
  therapist_id: number;
  appointment_date: string;
  status: AppointmentStatus;
  notes?: string | null;
  checked_in_at?: string | null;
  service_id?: number | null;
  room?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  patient?: Patient;
  therapist?: { id: number; name: string; email: string };
  service?: Service;
  created_at?: string;
  updated_at?: string;
}

export interface Practitioner {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface WaitlistEntry {
  id: number;
  patient_id?: number | null;
  first_name: string;
  last_name: string;
  service: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  contact_number: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'WAITING' | 'CONFIRMED' | 'NO_SHOW';
  patient?: Patient | null;
  created_at?: string;
}
