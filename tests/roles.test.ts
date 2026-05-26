import { afterEach, describe, expect, it } from "vitest";
import { roleForEmail } from "@/lib/roles";

describe("roleForEmail", () => {
  const prev = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });

  it("assigns Admin to configured admin email", () => {
    expect(roleForEmail("devina.raina@talentserv.co.in")).toBe("Admin");
    expect(roleForEmail("  Devina.Raina@Talentserv.Co.In  ")).toBe("Admin");
  });

  it("assigns Patient to all other emails", () => {
    expect(roleForEmail("patient@example.com")).toBe("Patient");
    expect(roleForEmail("staff@talentserv.co.in")).toBe("Patient");
  });

  it("respects ADMIN_EMAILS env override", () => {
    process.env.ADMIN_EMAILS = "admin@clinic.com, other@clinic.com";
    expect(roleForEmail("admin@clinic.com")).toBe("Admin");
    expect(roleForEmail("other@clinic.com")).toBe("Admin");
    expect(roleForEmail("devina.raina@talentserv.co.in")).toBe("Patient");
  });
});
