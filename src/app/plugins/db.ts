import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "../../shared/types/db.types";

export default fp(async (app) => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  const db = drizzle(pool);
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await pool.end();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

