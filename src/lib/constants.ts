export const DEPARTMENTS = [
  "General Physician",
  "Dental",
  "Pediatrics",
  "Cardiology",
  "Orthopedics",
] as const;

export const APPOINTMENT_TYPES = ["In-person", "Online"] as const;

export const APPOINTMENT_STATUSES = ["Booked", "Completed", "Cancelled"] as const;

export const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
] as const;

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DISCLAIMER =
  "MediBook Clinic helps you schedule appointments and share basic health information with your care team. This service does not provide medical advice, diagnosis, or treatment.";

/** Clinic branding for emails & receipts */
export const CLINIC = {
  name: "MediBook Clinic",
  initials: "MB",
  tagline: "Care you can book with confidence",
  phone: "+91 1800-456-7890",
  phoneDisplay: "1800-456-7890 (toll-free)",
  email: "care@medibookclinic.com",
  address: "42 Wellness Avenue, Koregaon Park, Pune 411001",
  hours: "Mon–Sat 9:00 AM – 6:00 PM",
  brand: {
    primary: "#0d9488",
    primaryDark: "#0f766e",
    navy: "#0f172a",
    teal: "#14b8a6",
  },
} as const;
