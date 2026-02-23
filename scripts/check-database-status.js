const { Client } = require('pg');
require('dotenv').config();

async function checkTablesAndSchemas() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // Verificar schemas disponíveis
    console.log('📊 Schemas disponíveis:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    schemas.rows.forEach(row => console.log(`   - ${row.schema_name}`));

    // Verificar tabelas em todos os schemas
    console.log('\n📋 Tabelas por schema:');
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    
    let currentSchema = '';
    tables.rows.forEach(row => {
      if (row.table_schema !== currentSchema) {
        currentSchema = row.table_schema;
        console.log(`\n   [${currentSchema}]:`);
      }
      console.log(`      - ${row.table_name}`);
    });

    // Verificar search_path atual
    console.log('\n🔍 Search path atual:');
    const searchPath = await client.query('SHOW search_path;');
    console.log(`   ${searchPath.rows[0].search_path}`);

    // Verificar se as tabelas têm RLS habilitado
    console.log('\n🔒 Status do RLS (Row Level Security):');
    const rlsStatus = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    rlsStatus.rows.forEach(row => {
      const status = row.rowsecurity ? '🔒 Habilitado' : '🔓 Desabilitado';
      console.log(`   ${row.tablename.padEnd(35)} ${status}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkTablesAndSchemas();
