import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __medibookPgPool: Pool | undefined;
}

function getConnectionString(): string {
  const url = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for Postgres");
  }
  return url;
}

export function getPool(): Pool {
  if (!global.__medibookPgPool) {
    global.__medibookPgPool = new Pool({ connectionString: getConnectionString() });
  }

  return global.__medibookPgPool;
}
