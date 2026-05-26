/** Map internal/API errors to patient-friendly copy (never expose env/code details). */
export function friendlyError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("unauthorized") || m.includes("forbidden")) {
    return "You do not have permission to perform this action.";
  }
  if (m.includes("duplicate patient")) {
    return "A patient with this email or phone number already exists.";
  }
  if (m.includes("duplicate:")) {
    return "This email or phone is already registered to another patient.";
  }
  if (m.includes("already booked")) {
    return "This time slot is no longer available. Please choose another time.";
  }
  if (m.includes("not available")) {
    return "The selected time is not available for this department. Please pick another slot.";
  }
  if (m.includes("patient not found")) {
    return "Patient record could not be found.";
  }
  if (m.includes("appointment not found")) {
    return "Appointment could not be found.";
  }
  if (m.includes("validation failed")) {
    return "Please check the form and try again.";
  }
  if (m.includes("role_required")) {
    return "Please complete your profile setup.";
  }
  if (m.includes("smtp") || m.includes(".env") || m.includes("configure")) {
    return "We could not send the email right now. Your booking was saved successfully.";
  }

  return message.length > 120
    ? "Something went wrong. Please try again or contact the clinic."
    : message;
}

export const UI = {
  bookingSuccess: "Your appointment has been booked successfully.",
  bookingEmailSent: "A confirmation email has been sent to the patient.",
  reminderEmailSent: "Reminder email sent successfully.",
  reminderSmsSent: "SMS reminder has been queued for delivery.",
  noSlots: "No appointments available on this day. Please choose another date.",
  emptyPatients: "No patients yet. Register your first patient to get started.",
  onboardingSubtitle: "Select how you use MediBook Clinic",
  landingTagline: "Trusted clinic appointment management",
} as const;
