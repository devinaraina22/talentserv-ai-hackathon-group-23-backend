import fs from "fs";
import path from "path";
import type { Appointment, Patient } from "./types";
import { CLINIC } from "./constants";

const { brand } = CLINIC;

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getLogoDataUri(): string {
  try {
    const svgPath = path.join(process.cwd(), "public", "medibook-clinic-logo.svg");
    const svg = fs.readFileSync(svgPath, "utf-8");
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch {
    return "";
  }
}

function footerWithLogo(): string {
  const logo = getLogoDataUri();
  const logoBlock = logo
    ? `<img src="${logo}" alt="${CLINIC.name}" width="220" height="64" style="display:block;margin:0 auto 10px" />`
    : `<p style="margin:0;font-size:20px;font-weight:700;color:${brand.navy};text-align:center">${CLINIC.name}</p>`;

  return `
    <div style="margin-top:0;padding:28px 20px;background:#ecfdf5;border-top:2px solid ${brand.primary};text-align:center;border-radius:0 0 16px 16px">
      ${logoBlock}
      <p style="margin:0;font-size:13px;color:#475569">${CLINIC.tagline}</p>
      <p style="margin:10px 0 0;font-size:11px;color:#64748b">${CLINIC.name} · Not medical advice</p>
    </div>`;
}

function emailShell({
  headerTitle,
  headerSubtitle,
  bodyHtml,
}: {
  headerTitle: string;
  headerSubtitle: string;
  bodyHtml: string;
}) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:${brand.navy};background:#f1f5f9;padding:16px">
      <div style="background:#ffffff;padding:20px 24px;border-radius:16px 16px 0 0;border:1px solid #e2e8f0;border-bottom:3px solid ${brand.primary}">
        <table cellpadding="0" cellspacing="0" style="margin-bottom:12px">
          <tr>
            <td style="width:44px;height:44px;background:${brand.primary};border-radius:10px;text-align:center;vertical-align:middle">
              <span style="color:#ffffff;font-size:16px;font-weight:800;font-family:Arial,sans-serif">${CLINIC.initials}</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle">
              <p style="margin:0;font-size:16px;font-weight:700;color:${brand.navy}">${CLINIC.name}</p>
              <p style="margin:2px 0 0;font-size:12px;color:${brand.primaryDark}">${CLINIC.tagline}</p>
            </td>
          </tr>
        </table>
        <h1 style="margin:0;font-size:21px;font-weight:700;color:${brand.navy}">${headerTitle}</h1>
        <p style="margin:6px 0 0;font-size:14px;color:#475569">${headerSubtitle}</p>
      </div>
      <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-top:0">
        ${bodyHtml}
        ${rsvpBlockHtml()}
      </div>
      ${footerWithLogo()}
    </div>`;
}

function rsvpBlockHtml(): string {
  return `
    <div style="margin-top:28px;padding:20px;background:#f0fdfa;border-radius:12px;border:1px solid #99f6e4">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${brand.primaryDark}">Need to make a change?</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.5">
        If you would like to <strong>reschedule</strong> or <strong>cancel</strong> your visit,
        please <strong>reply to this email</strong> or contact us below.
      </p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;color:#64748b;width:100px">Clinic</td>
          <td style="padding:6px 0;font-weight:700;color:${brand.navy}">${CLINIC.name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b">Phone</td>
          <td style="padding:6px 0">
            <a href="tel:${CLINIC.phone.replace(/\s/g, "")}" style="color:${brand.primary};font-weight:600;text-decoration:none">${CLINIC.phoneDisplay}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b">Email</td>
          <td style="padding:6px 0">
            <a href="mailto:${CLINIC.email}?subject=Reschedule%20or%20cancel%20appointment" style="color:${brand.primary};font-weight:600;text-decoration:none">${CLINIC.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;vertical-align:top">Address</td>
          <td style="padding:6px 0;color:#1e293b">${CLINIC.address}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b">Hours</td>
          <td style="padding:6px 0;color:#1e293b">${CLINIC.hours}</td>
        </tr>
      </table>
    </div>`;
}

function rsvpBlockText(): string {
  return `
---
Need to reschedule or cancel?
Reply to this email or contact ${CLINIC.name}:

Phone: ${CLINIC.phoneDisplay}
Email: ${CLINIC.email}
Address: ${CLINIC.address}
Hours: ${CLINIC.hours}
---`;
}

function appointmentDetailsTable(patient: Patient, apt: Appointment) {
  return `
    <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#64748b">Patient</td><td style="padding:8px 0;font-weight:600;color:${brand.navy}">${patient.full_name}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Patient ID</td><td style="padding:8px 0;font-weight:600;font-family:monospace;color:${brand.navy}">${patient.patient_id}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Appointment ID</td><td style="padding:8px 0;font-weight:600;font-family:monospace;color:${brand.primary}">${apt.appointment_id}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Department</td><td style="padding:8px 0;color:#1e293b">${apt.doctor_or_department}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0;color:#1e293b">${formatDate(apt.appointment_date)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Time</td><td style="padding:8px 0;color:#1e293b">${apt.appointment_time}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Type</td><td style="padding:8px 0;color:#1e293b">${apt.appointment_type}</td></tr>
    </table>`;
}

export function bookingConfirmationEmail(patient: Patient, apt: Appointment) {
  const subject = `Appointment booked — ${apt.appointment_id} | ${CLINIC.name}`;
  const text = `Hi ${patient.full_name},

Your appointment has been booked at ${CLINIC.name}.

Patient ID: ${patient.patient_id}
Appointment ID: ${apt.appointment_id}
Department: ${apt.doctor_or_department}
Date: ${formatDate(apt.appointment_date)}
Time: ${apt.appointment_time}
Type: ${apt.appointment_type}

Please arrive 10 minutes early for in-person visits. You will receive a friendly reminder one day before your visit.
${rsvpBlockText()}`;

  const html = emailShell({
    headerTitle: "Your appointment is booked",
    headerSubtitle: "We look forward to caring for you",
    bodyHtml: `
      <p style="margin:0 0 12px;color:${brand.navy}">Hi <strong>${patient.full_name}</strong>,</p>
      <p style="margin:0 0 16px;color:#334155">Your appointment at <strong style="color:${brand.primary}">${CLINIC.name}</strong> has been scheduled.</p>
      ${appointmentDetailsTable(patient, apt)}
      <p style="font-size:13px;color:#64748b;margin:0">We will send a friendly reminder <strong>one day before</strong> your visit.</p>`,
  });

  return { subject, text, html };
}

export function dayBeforeReminderEmail(patient: Patient, apt: Appointment) {
  const subject = `Reminder — tomorrow at ${CLINIC.name} | ${apt.appointment_id}`;
  const text = `Hi ${patient.full_name},

A friendly reminder that your appointment at ${CLINIC.name} is tomorrow.

Patient ID: ${patient.patient_id}
Appointment ID: ${apt.appointment_id}
Department: ${apt.doctor_or_department}
Date: ${formatDate(apt.appointment_date)}
Time: ${apt.appointment_time}

We look forward to seeing you!
${rsvpBlockText()}`;

  const html = emailShell({
    headerTitle: "Friendly reminder",
    headerSubtitle: "Your appointment is tomorrow",
    bodyHtml: `
      <p style="margin:0 0 12px;color:${brand.navy}">Hi <strong>${patient.full_name}</strong>,</p>
      <p style="margin:0 0 16px;color:#334155">Your visit at <strong style="color:${brand.primary}">${CLINIC.name}</strong> is <strong>tomorrow</strong>.</p>
      ${appointmentDetailsTable(patient, apt)}
      <p style="margin:0;color:#334155">See you soon!</p>`,
  });

  return { subject, text, html };
}

export function manualReminderEmail(patient: Patient, apt: Appointment) {
  const subject = `Appointment reminder — ${apt.appointment_id} | ${CLINIC.name}`;
  const text = `Hi ${patient.full_name},

Reminder for your upcoming appointment at ${CLINIC.name}:

Patient ID: ${patient.patient_id}
Appointment ID: ${apt.appointment_id}
Department: ${apt.doctor_or_department}
Date: ${formatDate(apt.appointment_date)}
Time: ${apt.appointment_time}
${rsvpBlockText()}`;

  const html = emailShell({
    headerTitle: "Appointment reminder",
    headerSubtitle: CLINIC.name,
    bodyHtml: `
      <p style="margin:0 0 12px;color:${brand.navy}">Hi <strong>${patient.full_name}</strong>,</p>
      <p style="margin:0 0 16px;color:#334155">This is a reminder for your upcoming visit at <strong style="color:${brand.primary}">${CLINIC.name}</strong>.</p>
      ${appointmentDetailsTable(patient, apt)}`,
  });

  return { subject, text, html };
}
