import { z } from "zod";
import { APPOINTMENT_TYPES, DEPARTMENTS, GENDERS } from "./constants";

export const patientSchema = z.object({
  patient_id: z
    .string()
    .min(1, "Patient ID is required")
    .regex(/^PAT-\d{3,}$/i, "Patient ID must match PAT-001 format"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  age: z.coerce.number().int().min(0).max(150, "Age must be between 0 and 150"),
  gender: z.enum(GENDERS as unknown as [string, ...string[]]),
  phone_number: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(2, "Country is required"),
  country_code: z
    .string()
    .length(2, "Country code must be ISO-2")
    .transform((v) => v.toUpperCase()),
  city: z.string().min(2, "City is required"),
});

export const healthIntakeSchema = z.object({
  patient_id: z.string().min(1),
  symptoms: z.string().min(1, "Symptoms are required"),
  existing_conditions: z.string().min(1, "Existing conditions are required"),
  allergies: z.string().min(1, "Allergies are required"),
  current_medications: z.string().min(1, "Current medications are required"),
  visit_reason: z.string().min(2, "Visit reason is required"),
  emergency_contact: z
    .string()
    .min(5, "Emergency contact must include name and phone"),
  consent_acknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the consent notice" }),
  }),
});

export const appointmentSchema = z.object({
  appointment_id: z
    .string()
    .regex(/^APT-\d{3,}$/i, "Appointment ID must match APT-001 format")
    .optional(),
  patient_id: z.string().min(1, "Patient is required"),
  doctor_or_department: z.string().min(2, "Doctor or department is required"),
  appointment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  appointment_time: z.string().min(1, "Time slot is required"),
  appointment_type: z.enum(APPOINTMENT_TYPES as unknown as [string, ...string[]]),
  notes: z.string().optional().default(""),
});

export const appointmentStatusSchema = z.enum(["Booked", "Completed", "Cancelled"]);

export const appointmentSearchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  date: z.string().optional(),
});

export const roleAssignmentSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["Admin", "Receptionist", "Doctor"]),
    department: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "Doctor") {
      if (!data.department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Department is required for Doctor role",
          path: ["department"],
        });
        return;
      }
      if (!DEPARTMENTS.includes(data.department as (typeof DEPARTMENTS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid department",
          path: ["department"],
        });
      }
    }
  });

export type PatientInput = z.infer<typeof patientSchema>;
export type HealthIntakeInput = z.infer<typeof healthIntakeSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
