import type {
  Appointment,
  AppointmentStatus,
  AuditLogEntry,
  DashboardStats,
  DataStore,
  DoctorAvailability,
  DuplicatePatientWarning,
  HealthIntake,
  Patient,
  ReminderChannel,
  ReminderLog,
  ReminderType,
  UserProfile,
  UserRole,
} from "./types";
import { DAY_NAMES } from "./constants";
import { loadStore, saveStore, resetStore, migrateStore } from "./storage";

export { resetStore, migrateStore };

async function readStore(): Promise<DataStore> {
  return loadStore();
}

async function writeStore(store: DataStore): Promise<void> {
  await saveStore(store);
}

export async function logAudit(
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): Promise<AuditLogEntry> {
  const store = await readStore();
  const record: AuditLogEntry = {
    ...entry,
    id: `AUD-${String(store.audit_logs.length + 1).padStart(4, "0")}`,
    timestamp: new Date().toISOString(),
  };
  store.audit_logs.unshift(record);
  if (store.audit_logs.length > 500) store.audit_logs = store.audit_logs.slice(0, 500);
  await writeStore(store);
  return record;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const store = await readStore();
  return store.audit_logs.slice(0, limit);
}

export async function getUserProfile(clerkUserId: string): Promise<UserProfile | undefined> {
  const store = await readStore();
  return store.user_profiles.find((u) => u.clerk_user_id === clerkUserId);
}

export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
  const store = await readStore();
  const idx = store.user_profiles.findIndex((u) => u.clerk_user_id === profile.clerk_user_id);
  if (idx === -1) store.user_profiles.push(profile);
  else store.user_profiles[idx] = profile;
  await writeStore(store);
  return profile;
}

export async function checkDuplicatePatient(
  email: string,
  phone: string,
  excludePatientId?: string
): Promise<DuplicatePatientWarning> {
  const store = await readStore();
  const matches = store.patients.filter(
    (p) =>
      p.patient_id !== excludePatientId &&
      (p.email.toLowerCase() === email.toLowerCase() || p.phone_number === phone)
  );
  return {
    duplicate: matches.length > 0,
    matches: matches.map((p) => ({
      patient_id: p.patient_id,
      full_name: p.full_name,
      email: p.email,
      phone_number: p.phone_number,
    })),
  };
}

export async function listAvailability(department?: string): Promise<DoctorAvailability[]> {
  const store = await readStore();
  let list = store.availability;
  if (department) list = list.filter((a) => a.doctor_or_department === department);
  return list;
}

export async function getAvailabilityForDay(
  department: string,
  dateStr: string
): Promise<string[]> {
  const store = await readStore();
  const day = new Date(dateStr + "T12:00:00").getDay();
  const slots = store.availability
    .filter((a) => a.doctor_or_department === department && a.day_of_week === day)
    .flatMap((a) => a.time_slots);
  return [...new Set(slots)].sort();
}

export async function isSlotInAvailability(
  department: string,
  dateStr: string,
  time: string
): Promise<boolean> {
  const available = await getAvailabilityForDay(department, dateStr);
  if (available.length === 0) return true;
  return available.includes(time);
}

export async function createAvailability(
  data: Omit<DoctorAvailability, "id">
): Promise<DoctorAvailability> {
  const store = await readStore();
  const record: DoctorAvailability = {
    ...data,
    id: `AVL-${String(store.availability.length + 1).padStart(3, "0")}`,
  };
  store.availability.push(record);
  await writeStore(store);
  return record;
}

export async function deleteAvailability(id: string): Promise<void> {
  const store = await readStore();
  store.availability = store.availability.filter((a) => a.id !== id);
  await writeStore(store);
}

export async function listPatients(): Promise<Patient[]> {
  return (await readStore()).patients;
}

export async function getPatient(patientId: string): Promise<Patient | undefined> {
  return (await readStore()).patients.find((p) => p.patient_id === patientId);
}

export async function getPatientByEmail(email: string): Promise<Patient | undefined> {
  return (await readStore()).patients.find(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  );
}

export async function createPatient(
  data: Omit<Patient, "created_at" | "updated_at">,
  options?: { allowDuplicate?: boolean }
): Promise<Patient> {
  const dup = await checkDuplicatePatient(data.email, data.phone_number);
  if (dup.duplicate && !options?.allowDuplicate) {
    throw new Error(
      `Duplicate patient detected: ${dup.matches.map((m) => m.full_name).join(", ")}`
    );
  }
  const store = await readStore();
  if (store.patients.some((p) => p.patient_id === data.patient_id)) {
    throw new Error("Patient ID already exists");
  }
  const now = new Date().toISOString();
  const patient: Patient = { ...data, created_at: now, updated_at: now };
  store.patients.push(patient);
  await writeStore(store);
  return patient;
}

export async function updatePatient(
  patientId: string,
  data: Partial<Omit<Patient, "patient_id" | "created_at">>
): Promise<Patient> {
  const store = await readStore();
  const index = store.patients.findIndex((p) => p.patient_id === patientId);
  if (index === -1) throw new Error("Patient not found");
  if (data.email || data.phone_number) {
    const dup = await checkDuplicatePatient(
      data.email ?? store.patients[index].email,
      data.phone_number ?? store.patients[index].phone_number,
      patientId
    );
    if (dup.duplicate) {
      throw new Error(`Duplicate: ${dup.matches.map((m) => m.full_name).join(", ")}`);
    }
  }
  const updated: Patient = {
    ...store.patients[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  store.patients[index] = updated;
  await writeStore(store);
  return updated;
}

export async function getHealthIntake(patientId: string): Promise<HealthIntake | undefined> {
  return (await readStore()).health_intakes.find((h) => h.patient_id === patientId);
}

export async function upsertHealthIntake(
  data: Omit<HealthIntake, "updated_at">
): Promise<HealthIntake> {
  const store = await readStore();
  if (!store.patients.some((p) => p.patient_id === data.patient_id)) {
    throw new Error("Patient not found");
  }
  const index = store.health_intakes.findIndex((h) => h.patient_id === data.patient_id);
  const record: HealthIntake = { ...data, updated_at: new Date().toISOString() };
  if (index === -1) store.health_intakes.push(record);
  else store.health_intakes[index] = record;
  await writeStore(store);
  return record;
}

export async function listAppointments(filters?: {
  q?: string;
  status?: string;
  department?: string;
  date?: string;
  patientId?: string;
  patientEmail?: string;
  doctorDepartment?: string;
}): Promise<Appointment[]> {
  const store = await readStore();
  let results = [...store.appointments];

  if (filters?.patientId) {
    results = results.filter((a) => a.patient_id === filters.patientId);
  }
  if (filters?.patientEmail) {
    const patient = await getPatientByEmail(filters.patientEmail);
    results = patient
      ? results.filter((a) => a.patient_id === patient.patient_id)
      : [];
  }
  if (filters?.doctorDepartment) {
    results = results.filter(
      (a) => a.doctor_or_department === filters.doctorDepartment
    );
  }
  if (filters?.status) results = results.filter((a) => a.status === filters.status);
  if (filters?.department)
    results = results.filter((a) => a.doctor_or_department === filters.department);
  if (filters?.date)
    results = results.filter((a) => a.appointment_date === filters.date);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    const patientMap = new Map(store.patients.map((p) => [p.patient_id, p.full_name]));
    results = results.filter((a) => {
      const name = patientMap.get(a.patient_id)?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        a.appointment_id.toLowerCase().includes(q) ||
        a.doctor_or_department.toLowerCase().includes(q)
      );
    });
  }

  return results.sort((a, b) =>
    `${a.appointment_date} ${a.appointment_time}`.localeCompare(
      `${b.appointment_date} ${b.appointment_time}`
    )
  );
}

export async function getAppointment(appointmentId: string): Promise<Appointment | undefined> {
  return (await readStore()).appointments.find((a) => a.appointment_id === appointmentId);
}

export async function isSlotTaken(
  doctorOrDepartment: string,
  appointmentDate: string,
  appointmentTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  return (await readStore()).appointments.some(
    (a) =>
      a.doctor_or_department === doctorOrDepartment &&
      a.appointment_date === appointmentDate &&
      a.appointment_time === appointmentTime &&
      a.status !== "Cancelled" &&
      a.appointment_id !== excludeAppointmentId
  );
}

async function generateAppointmentId(): Promise<string> {
  const store = await readStore();
  const nums = store.appointments
    .map((a) => parseInt(a.appointment_id.replace(/^APT-/i, ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `APT-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

export async function createAppointment(
  data: Omit<Appointment, "appointment_id" | "status" | "created_at" | "updated_at"> & {
    appointment_id?: string;
  }
): Promise<Appointment> {
  if (!(await isSlotInAvailability(data.doctor_or_department, data.appointment_date, data.appointment_time))) {
    const day = DAY_NAMES[new Date(data.appointment_date + "T12:00:00").getDay()];
    throw new Error(
      `Selected time is not available for ${data.doctor_or_department} on ${day}`
    );
  }
  if (await isSlotTaken(data.doctor_or_department, data.appointment_date, data.appointment_time)) {
    throw new Error(
      "This time slot is already booked for the selected doctor or department"
    );
  }
  const store = await readStore();
  if (!store.patients.some((p) => p.patient_id === data.patient_id)) {
    throw new Error("Patient not found");
  }
  const now = new Date().toISOString();
  const appointment: Appointment = {
    appointment_id: data.appointment_id ?? (await generateAppointmentId()),
    patient_id: data.patient_id,
    doctor_or_department: data.doctor_or_department,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    appointment_type: data.appointment_type,
    status: "Booked",
    notes: data.notes ?? "",
    created_at: now,
    updated_at: now,
  };
  store.appointments.push(appointment);
  await writeStore(store);
  return appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const store = await readStore();
  const index = store.appointments.findIndex((a) => a.appointment_id === appointmentId);
  if (index === -1) throw new Error("Appointment not found");
  store.appointments[index] = {
    ...store.appointments[index],
    status,
    updated_at: new Date().toISOString(),
  };
  await writeStore(store);
  return store.appointments[index];
}

export async function hasReminderBeenSent(
  appointmentId: string,
  reminderType: ReminderType,
  channel: ReminderChannel = "email"
): Promise<boolean> {
  return (await readStore()).reminders.some(
    (r) =>
      r.appointment_id === appointmentId &&
      (r.reminder_type ?? "manual") === reminderType &&
      r.channel === channel
  );
}

export async function logReminder(
  data: Omit<ReminderLog, "id" | "sent_at">
): Promise<ReminderLog> {
  const store = await readStore();
  const log: ReminderLog = {
    ...data,
    id: `REM-${String(store.reminders.length + 1).padStart(4, "0")}`,
    sent_at: new Date().toISOString(),
  };
  store.reminders.unshift(log);
  await writeStore(store);
  return log;
}

export async function listReminders(limit = 50): Promise<ReminderLog[]> {
  return (await readStore()).reminders.slice(0, limit);
}

export async function getDashboardStats(
  role?: UserRole,
  userEmail?: string,
  department?: string
): Promise<DashboardStats> {
  const store = await readStore();
  const today = new Date().toISOString().slice(0, 10);
  const patientMap = new Map(store.patients.map((p) => [p.patient_id, p.full_name]));

  let appointments = store.appointments;
  if (role === "Patient" && userEmail) {
    const p = store.patients.find(
      (x) => x.email.toLowerCase() === userEmail.toLowerCase()
    );
    appointments = p ? appointments.filter((a) => a.patient_id === p.patient_id) : [];
  } else if (role === "Doctor" && department) {
    appointments = appointments.filter((a) => a.doctor_or_department === department);
  }

  const byStatus: DashboardStats["byStatus"] = { Booked: 0, Completed: 0, Cancelled: 0 };
  const byDepartment: Record<string, number> = {};

  for (const apt of appointments) {
    byStatus[apt.status]++;
    byDepartment[apt.doctor_or_department] =
      (byDepartment[apt.doctor_or_department] ?? 0) + 1;
  }

  const upcoming = appointments
    .filter((a) => a.status === "Booked" && a.appointment_date >= today)
    .sort((a, b) =>
      `${a.appointment_date} ${a.appointment_time}`.localeCompare(
        `${b.appointment_date} ${b.appointment_time}`
      )
    )
    .slice(0, 5)
    .map((a) => ({
      appointment_id: a.appointment_id,
      patient_name: patientMap.get(a.patient_id) ?? "Unknown",
      doctor_or_department: a.doctor_or_department,
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      status: a.status,
    }));

  return {
    totalAppointments: appointments.length,
    todaysAppointments: appointments.filter(
      (a) => a.appointment_date === today && a.status !== "Cancelled"
    ).length,
    byStatus,
    byDepartment,
    upcoming,
  };
}

export { DAY_NAMES };
