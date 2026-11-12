import { Pool } from "pg";

const g = globalThis as unknown as { pool?: Pool; ready?: Promise<void> };

export const pool =
  g.pool ??
  (g.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  }));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧰',
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  owner TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','beta','deprecated')),
  access_note TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES tools(id) ON DELETE CASCADE;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** Creates tables on first use (idempotent) and seeds a sample card on an empty DB. */
export function ready(): Promise<void> {
  return (g.ready ??= (async () => {
    await pool.query(SCHEMA);
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM tools");
    if (rows[0].n === 0) {
      const c = await pool.query(
        "INSERT INTO categories(name) VALUES ('General') ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
      );
      await pool.query(
        "INSERT INTO tools(name,description,url,icon,category_id,owner,featured) VALUES ($1,$2,$3,$4,$5,$6,TRUE)",
        ["Sample Tool", "Replace me from the Admin section.", "https://example.com", "🚀", c.rows[0].id, "Leadership"],
      );
    }
  })().catch((e) => {
    g.ready = undefined;
    const msg = e?.code === "ECONNREFUSED" || e?.errors
      ? "Cannot reach the database. Is the SSH tunnel up? Run: npm run dev (or npm run db:tunnel)."
      : e?.message || String(e);
    throw new Error(msg);
  }));
}

export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await pool.query(text, params)).rows as T[];
}

export type Category = { id: number; name: string; sort_order: number };
export type Tool = {
  id: number; name: string; description: string; url: string; icon: string;
  parent_id: number | null; child_count: number; is_group: boolean;
  category_id: number | null; category_name: string | null; owner: string;
  status: "live" | "beta" | "deprecated"; access_note: string;
  featured: boolean; published: boolean; sort_order: number; clicks: number;
};

export const TOOL_SELECT = `SELECT t.id,t.name,t.description,t.url,t.icon,t.category_id,c.name AS category_name,
  t.owner,t.status,t.access_note,t.featured,t.published,t.sort_order,t.clicks,t.parent_id,t.is_group,
  (SELECT COUNT(*)::int FROM tools k WHERE k.parent_id=t.id AND k.published) AS child_count
  FROM tools t LEFT JOIN categories c ON c.id=t.category_id`;

export const log = (action: string, detail = "") =>
  q("INSERT INTO audit_log(action,detail) VALUES ($1,$2)", [action, detail]);
