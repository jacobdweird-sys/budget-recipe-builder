import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 10;`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';`;
  console.log("Successfully added columns!");
} catch (e) {
  console.error("DB error:", e);
}
