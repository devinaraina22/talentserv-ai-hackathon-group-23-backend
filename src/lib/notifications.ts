import {
  bookingConfirmationEmail,
  dayBeforeReminderEmail,
  manualReminderEmail,
} from "./email-templates";
import { sendEmail, isEmailConfigured } from "./email";
import {
  getAppointment,
  getPatient,
  hasReminderBeenSent,
  listAppointments,
  logReminder,
} from "./db";
import type { ReminderChannel } from "./types";

function tomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function notifyBookingConfirmation(appointmentId: string) {
  const apt = await getAppointment(appointmentId);
  if (!apt || apt.status === "Cancelled") return null;
  const patient = await getPatient(apt.patient_id);
  if (!patient) return null;

  if (await hasReminderBeenSent(appointmentId, "booking_confirmation", "email")) {
    return null;
  }

  const { subject, text, html } = bookingConfirmationEmail(patient, apt);
  const result = await sendEmail({ to: patient.email, subject, text, html });

  return logReminder({
    appointment_id: appointmentId,
    channel: "email",
    recipient: patient.email,
    message: subject,
    reminder_type: "booking_confirmation",
    simulated: result.devMode,
  });
}

export async function notifyDayBeforeReminder(appointmentId: string) {
  const apt = await getAppointment(appointmentId);
  if (!apt || apt.status !== "Booked") return null;
  const patient = await getPatient(apt.patient_id);
  if (!patient) return null;

  if (await hasReminderBeenSent(appointmentId, "day_before", "email")) {
    return null;
  }

  const { subject, text, html } = dayBeforeReminderEmail(patient, apt);
  const result = await sendEmail({ to: patient.email, subject, text, html });

  return logReminder({
    appointment_id: appointmentId,
    channel: "email",
    recipient: patient.email,
    message: subject,
    reminder_type: "day_before",
    simulated: result.devMode,
  });
}

export async function notifyManualReminder(
  appointmentId: string,
  channel: ReminderChannel
) {
  const apt = await getAppointment(appointmentId);
  if (!apt) throw new Error("Appointment not found");
  const patient = await getPatient(apt.patient_id);
  if (!patient) throw new Error("Patient not found");

  if (channel === "sms") {
    const message = `Reminder: ${patient.full_name}, your appointment ${apt.appointment_id} is on ${apt.appointment_date} at ${apt.appointment_time}. — MediBook Clinic`;
    return logReminder({
      appointment_id: appointmentId,
      channel: "sms",
      recipient: patient.phone_number,
      message,
      reminder_type: "manual",
      simulated: false,
    });
  }

  const { subject, text, html } = manualReminderEmail(patient, apt);
  const result = await sendEmail({ to: patient.email, subject, text, html });

  return logReminder({
    appointment_id: appointmentId,
    channel: "email",
    recipient: patient.email,
    message: subject,
    reminder_type: "manual",
    simulated: result.devMode,
  });
}

export async function processDueDayBeforeReminders(): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const tomorrow = tomorrowDateString();
  const due = await listAppointments({ date: tomorrow, status: "Booked" });
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const apt of due) {
    try {
      if (await hasReminderBeenSent(apt.appointment_id, "day_before", "email")) {
        skipped++;
        continue;
      }
      const log = await notifyDayBeforeReminder(apt.appointment_id);
      if (log) sent++;
      else skipped++;
    } catch (e) {
      errors.push(
        `${apt.appointment_id}: ${e instanceof Error ? e.message : "error"}`
      );
    }
  }

  return { sent, skipped, errors };
}

export { isEmailConfigured };
