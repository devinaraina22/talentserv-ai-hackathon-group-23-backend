/**
 * Optional local dev guard — skipped in CI.
 * Run manually: npm run check:env
 */
import fs from "fs";
import path from "path";

if (process.env.CI) {
  process.exit(0);
}

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("\n❌ Missing .env.local\n");
  console.error("Run: cp .env.example .env.local");
  console.error("Then add your Clerk keys from https://dashboard.clerk.com\n");
  process.exit(1);
}

const env = fs.readFileSync(envPath, "utf-8");
const pk = env.match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim() ?? "";
const sk = env.match(/^CLERK_SECRET_KEY=(.+)$/m)?.[1]?.trim() ?? "";

if (!pk || !sk || pk.includes("YOUR_KEY") || sk.includes("YOUR_KEY")) {
  console.error("\n❌ Clerk keys in .env.local are still placeholders.\n");
  console.error("Get keys from https://dashboard.clerk.com → API Keys\n");
  process.exit(1);
}

console.log("✓ Clerk environment keys look valid");
