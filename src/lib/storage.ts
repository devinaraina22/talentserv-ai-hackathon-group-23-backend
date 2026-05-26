import fs from "fs";
import path from "path";
import type { DataStore } from "./types";
import { getPool } from "./postgres";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
const POSTGRES_ROW_ID = "default";

export function migrateStore(raw: Partial<DataStore>): DataStore {
  return {
    patients: raw.patients ?? [],
    health_intakes: raw.health_intakes ?? [],
    appointments: raw.appointments ?? [],
    availability: raw.availability ?? [],
    user_profiles: raw.user_profiles ?? [],
    audit_logs: raw.audit_logs ?? [],
    reminders: raw.reminders ?? [],
  };
}

function emptyStore(): DataStore {
  return migrateStore({});
}

function loadSeedFromFile(): DataStore {
  if (fs.existsSync(SEED_PATH)) {
    return migrateStore(JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as Partial<DataStore>);
  }
  return emptyStore();
}

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("your-upstash") ||
    lower.includes("your_key") ||
    lower.includes("your-key") ||
    lower.includes("placeholder") ||
    lower.includes("your-neon") ||
    lower.includes("user:password@host") ||
    lower === "your-upstash-token"
  );
}

export function getDatabaseUrl(): string | undefined {
  const url = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)?.trim();
  if (!url || isPlaceholder(url)) return undefined;
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) return undefined;
  return url;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function isPostgresEnabled(): boolean {
  return !!getDatabaseUrl();
}

async function loadStoreFromPostgres(): Promise<DataStore | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ data: Partial<DataStore> }>(
    "SELECT data FROM medibook_store WHERE id = $1",
    [POSTGRES_ROW_ID]
  );
  if (!rows[0]?.data) return null;
  return migrateStore(rows[0].data);
}

async function saveStoreToPostgres(store: DataStore): Promise<void> {
  const pool = getPool();
  const payload = JSON.stringify(store);
  await pool.query(
    `INSERT INTO medibook_store (id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE
     SET data = EXCLUDED.data, updated_at = NOW()`,
    [POSTGRES_ROW_ID, payload]
  );
}

async function loadStoreFromFile(): Promise<DataStore> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(loadSeedFromFile(), null, 2));
  }
  return migrateStore(JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Partial<DataStore>);
}

async function saveStoreToFile(store: DataStore): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function requireProductionPostgres(): void {
  if (!isPostgresEnabled()) {
    throw new Error(
      "DATABASE_URL is required in production. Add Neon Postgres in Vercel → Storage and link it to this project."
    );
  }
}

export async function loadStore(): Promise<DataStore> {
  if (isProductionRuntime()) {
    requireProductionPostgres();
    const data = await loadStoreFromPostgres();
    return data ?? emptyStore();
  }

  if (isPostgresEnabled()) {
    try {
      const data = await loadStoreFromPostgres();
      if (data) return data;
      return emptyStore();
    } catch (err) {
      console.warn("[storage] Postgres read failed, using local file store:", err);
    }
  }

  return loadStoreFromFile();
}

export async function saveStore(store: DataStore): Promise<void> {
  if (isProductionRuntime()) {
    requireProductionPostgres();
    await saveStoreToPostgres(store);
    return;
  }

  if (isPostgresEnabled()) {
    try {
      await saveStoreToPostgres(store);
      return;
    } catch (err) {
      console.warn("[storage] Postgres write failed, using local file store:", err);
    }
  }

  await saveStoreToFile(store);
}

/** One-time manual seed (npm run db:seed) — not called automatically at runtime. */
export async function resetStore(seed?: DataStore): Promise<void> {
  const data = seed ?? loadSeedFromFile();
  await saveStore(data);
}

export function getActiveStorageBackend(): "postgres" | "file" {
  if (isProductionRuntime() || isPostgresEnabled()) return "postgres";
  return "file";
}
