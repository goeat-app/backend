const { Client } = require('pg');
require('dotenv').config();

async function listMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT name 
      FROM "SequelizeMeta"
      ORDER BY name;
    `);

    console.log('\n📝 Migrations aplicadas:\n');
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${row.name}`);
    });
    console.log(`\nTotal: ${result.rows.length} migrations\n`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

listMigrations();
