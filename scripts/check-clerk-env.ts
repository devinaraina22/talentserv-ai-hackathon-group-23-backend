import fs from "fs";
import path from "path";

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

const bad =
  !pk ||
  !sk ||
  (pk.includes("...") && pk.length < 40) ||
  pk.includes("YOUR_KEY") ||
  (sk.includes("...") && sk.length < 40) ||
  sk.includes("YOUR_KEY") ||
  pk.length < 30 ||
  sk.length < 30;

if (bad) {
  console.error("\n❌ Clerk keys in .env.local are still placeholders.\n");
  console.error("Fix:");
  console.error("  1. Go to https://dashboard.clerk.com");
  console.error("  2. Create or open an application");
  console.error("  3. Click API Keys → copy Publishable key and Secret key");
  console.error("  4. Paste FULL keys into .env.local (no quotes, no spaces)");
  console.error("  5. Restart: npm run dev\n");
  process.exit(1);
}

console.log("✓ Clerk environment keys look valid");
