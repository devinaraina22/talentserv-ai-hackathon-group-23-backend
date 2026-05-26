/**
 * Test SMTP: npx tsx scripts/test-email.ts your-test@gmail.com
 */
import { sendEmail, isEmailConfigured } from "../src/lib/email";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npx tsx scripts/test-email.ts recipient@email.com");
  process.exit(1);
}

console.log("Configured:", isEmailConfigured());
console.log("Host:", process.env.SMTP_HOST);
console.log("Port:", process.env.SMTP_PORT ?? "587");
console.log("Secure:", process.env.SMTP_SECURE ?? "false");

sendEmail({
  to,
  subject: "MediBook SMTP test",
  text: "If you see this, SMTP is working.",
  html: "<p>If you see this, <strong>SMTP is working</strong>.</p>",
})
  .then((r) => {
    console.log("OK:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("FAILED:", e.message);
    console.error("\nGmail fix: SMTP_PORT=587 and SMTP_SECURE=false");
    console.error("Or: SMTP_PORT=465 and SMTP_SECURE=true");
    process.exit(1);
  });
