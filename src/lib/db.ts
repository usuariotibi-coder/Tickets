import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForPool = globalThis as unknown as { __tiPool?: Pool };

function getPool(): Pool {
  if (!globalForPool.__tiPool) {
    globalForPool.__tiPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      maxUses: 1,
    });
  }
  return globalForPool.__tiPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as any[]);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function runTransaction<T>(
  fn: (q: (text: string, params?: unknown[]) => Promise<unknown>) => Promise<T>
): Promise<T> {
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn((text, params) => client.query(text, params));
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}