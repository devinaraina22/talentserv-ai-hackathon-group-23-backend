export type AppointmentStatus = "Booked" | "Completed" | "Cancelled";
export type UserRole = "Admin" | "Receptionist" | "Doctor" | "Patient";
export type ReminderChannel = "email" | "sms";
export type ReminderType = "booking_confirmation" | "day_before" | "manual";

export interface Patient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone_number: string;
  email: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface HealthIntake {
  patient_id: string;
  symptoms: string;
  existing_conditions: string;
  allergies: string;
  current_medications: string;
  visit_reason: string;
  emergency_contact: string;
  consent_acknowledged: boolean;
  updated_at: string;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_or_department: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: "In-person" | "Online";
  status: AppointmentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_or_department: string;
  day_of_week: number;
  time_slots: string[];
}

export interface UserProfile {
  clerk_user_id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  user_role: UserRole;
  action: string;
  entity_type: "patient" | "appointment" | "health" | "availability" | "reminder";
  entity_id: string;
  details: string;
}

export interface ReminderLog {
  id: string;
  appointment_id: string;
  channel: ReminderChannel;
  reminder_type: ReminderType;
  recipient: string;
  message: string;
  sent_at: string;
  simulated: boolean;
}

export interface DataStore {
  patients: Patient[];
  health_intakes: HealthIntake[];
  appointments: Appointment[];
  availability: DoctorAvailability[];
  user_profiles: UserProfile[];
  audit_logs: AuditLogEntry[];
  reminders: ReminderLog[];
}

export interface DashboardStats {
  totalAppointments: number;
  todaysAppointments: number;
  byStatus: Record<AppointmentStatus, number>;
  byDepartment: Record<string, number>;
  upcoming: Array<{
    appointment_id: string;
    patient_name: string;
    doctor_or_department: string;
    appointment_date: string;
    appointment_time: string;
    status: AppointmentStatus;
  }>;
}

export interface DuplicatePatientWarning {
  duplicate: boolean;
  matches: Array<{ patient_id: string; full_name: string; email: string; phone_number: string }>;
}
