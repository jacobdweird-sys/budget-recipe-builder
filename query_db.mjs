import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
try {
  const result = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';`;
  console.log(result);
} catch (e) {
  console.error("DB error:", e);
}
