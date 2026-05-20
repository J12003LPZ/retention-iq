import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const dir = join(process.cwd(), "db", "migrations");

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const body = readFileSync(join(dir, f), "utf8");
    console.log(`-> applying ${f}`);
    const statements = body.split(/;\s*$/m).filter((s) => s.trim());
    await sql.transaction(statements.map((s) => sql.query(s + ";")));
    console.log(`   ok`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
