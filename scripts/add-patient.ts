import { readFileSync, existsSync } from "fs";
import path from "path";
import { createPatient, getPatientByEmail, upsertHealthIntake, createAppointment } from "../src/lib/db";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const email = "devinaraina99@gmail.com";
  let patient = await getPatientByEmail(email);

  if (!patient) {
    patient = await createPatient({
      patient_id: "PAT-004",
      full_name: "Devina Raina",
      age: 28,
      gender: "Female",
      phone_number: "9876543299",
      email,
      country: "India",
      country_code: "IN",
      city: "Pune",
    });
    console.log(`Added patient: ${patient.patient_id} (${patient.email})`);
  } else {
    console.log(`Patient already exists: ${patient.patient_id} (${patient.email})`);
  }

  await upsertHealthIntake({
    patient_id: patient.patient_id,
    symptoms: "Routine check-up",
    existing_conditions: "None",
    allergies: "None",
    current_medications: "None",
    visit_reason: "General consultation",
    emergency_contact: "Family - 9876543298",
    consent_acknowledged: true,
  });
  console.log(`Health intake saved for ${patient.patient_id}`);

  try {
    await createAppointment({
      appointment_id: "APT-004",
      patient_id: patient.patient_id,
      doctor_or_department: "General Physician",
      appointment_date: "2026-06-02",
      appointment_time: "11:00 AM",
      appointment_type: "In-person",
      status: "Booked",
      notes: "Demo patient visit",
    });
    console.log("Added appointment APT-004");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already") || message.includes("taken") || message.includes("exists")) {
      console.log("Appointment APT-004 already exists — skipped");
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
