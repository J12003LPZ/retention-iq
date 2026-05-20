import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | undefined;
let _sqlReadonly: NeonQueryFunction<false, false> | null | undefined;

function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _sql = neon(url);
  }
  return _sql;
}

function getDbReadonly(): NeonQueryFunction<false, false> | null {
  if (_sqlReadonly === undefined) {
    _sqlReadonly = process.env.DATABASE_URL_READONLY
      ? neon(process.env.DATABASE_URL_READONLY)
      : null;
  }
  return _sqlReadonly;
}

export const sql: NeonQueryFunction<false, false> = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    get(_, prop) {
      return getDb()[prop as keyof NeonQueryFunction<false, false>];
    },
  }
);

export const sqlReadonly: NeonQueryFunction<false, false> | null = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    get(_, prop) {
      const db = getDbReadonly();
      if (!db) return undefined;
      return db[prop as keyof NeonQueryFunction<false, false>];
    },
  }
) as NeonQueryFunction<false, false> | null;
