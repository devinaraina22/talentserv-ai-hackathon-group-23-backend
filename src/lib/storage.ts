import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { DataStore } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
const REDIS_KEY = "medibook:store";

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

function loadSeedFromFile(): DataStore {
  if (fs.existsSync(SEED_PATH)) {
    return migrateStore(JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as Partial<DataStore>);
  }
  return migrateStore({});
}

function isRedisEnabled(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function loadStore(): Promise<DataStore> {
  if (isRedisEnabled()) {
    const redis = getRedis();
    const data = await redis.get<DataStore>(REDIS_KEY);
    if (data) return migrateStore(data);
    const seed = loadSeedFromFile();
    await redis.set(REDIS_KEY, seed);
    return seed;
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(loadSeedFromFile(), null, 2));
  }
  return migrateStore(JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Partial<DataStore>);
}

export async function saveStore(store: DataStore): Promise<void> {
  if (isRedisEnabled()) {
    await getRedis().set(REDIS_KEY, store);
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function resetStore(seed?: DataStore): Promise<void> {
  const data = seed ?? loadSeedFromFile();
  await saveStore(data);
}
