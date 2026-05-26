import { afterEach, describe, expect, it, vi } from "vitest";
import { getActiveStorageBackend, getDatabaseUrl, isProductionRuntime } from "@/lib/storage";

describe("storage backend selection", () => {
  it("uses file storage in dev when DATABASE_URL is not set", () => {
    expect(getActiveStorageBackend()).toBe("file");
  });

  it("detects postgres when DATABASE_URL is set", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@ep-test.neon.tech/neondb?sslmode=require");
    expect(getDatabaseUrl()).toContain("neon.tech");
    expect(getActiveStorageBackend()).toBe("postgres");
    vi.unstubAllEnvs();
  });
});

describe("production storage requirements", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires DATABASE_URL in production runtime", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "");

    const { loadStore } = await import("@/lib/storage");
    await expect(loadStore()).rejects.toThrow(/DATABASE_URL is required in production/);
  });

  it("identifies production on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(isProductionRuntime()).toBe(true);
    vi.unstubAllEnvs();
  });
});
