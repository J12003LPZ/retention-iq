import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const dir = join(process.cwd(), "db", "migrations");

/**
 * Split a SQL file into individual statements, preserving dollar-quoted
 * blocks (DO $$ ... $$, DO $grant$ ... $grant$, etc.) intact.
 */
function splitStatements(body: string): string[] {
  const statements: string[] = [];
  let current = "";
  let dollarTag: string | null = null;
  let i = 0;

  while (i < body.length) {
    // Detect start/end of dollar-quoting
    if (dollarTag === null) {
      const tagMatch = body.slice(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
      if (tagMatch) {
        dollarTag = tagMatch[1];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    } else {
      if (body.slice(i).startsWith(dollarTag)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
    }

    const ch = body[i];
    if (ch === ";" && dollarTag === null) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
    } else {
      current += ch;
    }
    i++;
  }

  const last = current.trim();
  if (last) statements.push(last);

  return statements.filter((s) => s.length > 0);
}

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const body = readFileSync(join(dir, f), "utf8");
    const statements = splitStatements(body);
    console.log(`-> applying ${f} (${statements.length} statements)`);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
    console.log(`   ok`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
