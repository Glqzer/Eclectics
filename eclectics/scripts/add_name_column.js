const { Pool } = require('@neondatabase/serverless');
(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) { console.error('DATABASE_URL missing'); process.exit(1); }
  const pool = new Pool({ connectionString: cs });
  try {
    await pool.query("ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS name varchar(255) NOT NULL DEFAULT ''");
    const res = await pool.query("select column_name from information_schema.columns where table_name='choreographies' order by column_name");
    console.log('Columns:', res.rows.map(r => r.column_name));
  } catch (e) {
    console.error('Error applying column:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
