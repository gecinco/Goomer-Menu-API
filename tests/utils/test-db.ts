import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

export type TestDbHandle = {
  container: StartedPostgreSqlContainer;
  databaseUrl: string;
  stop: () => Promise<void>;
};

export async function startTestDb(): Promise<TestDbHandle> {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("goomer_test")
    .withUsername("postgres")
    .withPassword("postgres")
    .start();

  const databaseUrl = container.getConnectionUri();

  // Run migrations
  const pool = new Pool({ connectionString: databaseUrl });
  const migrationPath = path.resolve(process.cwd(), "src/db/migrations/0000_initial_schema.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  await pool.query(migrationSql);
  await pool.end();

  return {
    container,
    databaseUrl,
    stop: async () => {
      await container.stop();
    },
  };
}


