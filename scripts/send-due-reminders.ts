/**
 * Run daily: npm run reminders:due
 * Sends friendly email to patients with Booked appointments tomorrow.
 */
import { processDueDayBeforeReminders, isEmailConfigured } from "../src/lib/notifications";

async function main() {
  console.log("Email configured:", isEmailConfigured());
  const result = await processDueDayBeforeReminders();
  console.log("Day-before reminders:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
