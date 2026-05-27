import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  createRoleAssignment,
  deleteRoleAssignment,
  getRoleAssignmentForEmail,
  resetStore,
  resolveRoleForEmail,
} from "@/lib/db";

const SEED = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/seed.json"), "utf-8")
);

describe("resolveRoleForEmail", () => {
  beforeEach(async () => {
    await resetStore(SEED);
  });

  it("assigns roles from database staff records", async () => {
    expect((await resolveRoleForEmail("devina.raina@talentserv.co.in")).role).toBe("Admin");
    expect((await resolveRoleForEmail("reception@clinic.demo")).role).toBe("Receptionist");
    expect((await resolveRoleForEmail("doctor@clinic.demo")).role).toBe("Doctor");
    expect((await resolveRoleForEmail("doctor@clinic.demo")).department).toBe(
      "General Physician"
    );
  });

  it("defaults unknown emails to Patient", async () => {
    expect((await resolveRoleForEmail("random@example.com")).role).toBe("Patient");
    expect((await resolveRoleForEmail("  Random@Example.com  ")).role).toBe("Patient");
  });

  it("supports adding and removing staff records", async () => {
    await createRoleAssignment({
      email: "new.admin@clinic.com",
      name: "New Admin",
      role: "Admin",
    });
    expect((await resolveRoleForEmail("new.admin@clinic.com")).role).toBe("Admin");

    const record = await getRoleAssignmentForEmail("new.admin@clinic.com");
    expect(record?.id).toBeTruthy();
    if (record) await deleteRoleAssignment(record.id);
    expect((await resolveRoleForEmail("new.admin@clinic.com")).role).toBe("Patient");
  });
});
