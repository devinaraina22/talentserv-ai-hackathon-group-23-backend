import { readFileSync, existsSync } from "fs";
import path from "path";
import { createRoleAssignment, getRoleAssignmentForEmail } from "../src/lib/db";

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
  const email = "atul.maurya062025@gmail.com";
  const existing = await getRoleAssignmentForEmail(email);
  if (existing) {
    console.log(`Staff record already exists: ${existing.email} → ${existing.role}`);
    return;
  }

  const record = await createRoleAssignment({
    email,
    name: "Atul Maurya",
    role: "Admin",
  });
  console.log(`Added staff: ${record.email} → ${record.role} (${record.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
