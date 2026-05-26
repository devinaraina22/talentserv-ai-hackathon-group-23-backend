-- MediBook Clinic — single-document store (JSONB)
-- Run once: npm run db:init (requires DATABASE_URL)

CREATE TABLE IF NOT EXISTS medibook_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medibook_store_updated_at_idx ON medibook_store (updated_at);
