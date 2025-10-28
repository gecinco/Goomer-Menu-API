import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

