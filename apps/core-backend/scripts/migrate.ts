import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { getConfig } from "../src/lib/config.ts";

const config = getConfig();
const sql = await readFile(resolve("db/migrations/001_initial.sql"), "utf8");
const client = new pg.Client({ connectionString: config.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log("Migración aplicada");
} finally {
  await client.end();
}
