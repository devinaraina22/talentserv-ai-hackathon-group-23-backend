import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
}

function getSmtpConfig() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  // Port 465 = SSL from start. Port 587 = STARTTLS (secure must be false).
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  return { port, secure };
}

function createTransport() {
  const { port, secure } = getSmtpConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(port === 587 && !secure
      ? { requireTLS: true }
      : {}),
  });
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ messageId: string; devMode: boolean }> {
  if (!isEmailConfigured()) {
    console.log("\n📧 [EMAIL DEV MODE — SMTP not configured]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("---\n");
    return { messageId: `dev-${Date.now()}`, devMode: true };
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return { messageId: info.messageId, devMode: false };
}
