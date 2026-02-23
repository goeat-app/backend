const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('⚠️  ATENÇÃO: Este script vai DROPAR TODAS AS TABELAS!');
    console.log('🗑️  Dropando todas as tabelas...\n');

    // Dropar todas as tabelas na ordem correta (respeitando foreign keys)
    const dropQueries = [
      'DROP TABLE IF EXISTS profile_mapping_food_type CASCADE',
      'DROP TABLE IF EXISTS profile_mapping_place_type CASCADE',
      'DROP TABLE IF EXISTS profile_mapping CASCADE',
      'DROP TABLE IF EXISTS reviews CASCADE',
      'DROP TABLE IF EXISTS restaurant_food_types CASCADE',
      'DROP TABLE IF EXISTS restaurant_place_types CASCADE',
      'DROP TABLE IF EXISTS restaurant_images CASCADE',
      'DROP TABLE IF EXISTS restaurants CASCADE',
      'DROP TABLE IF EXISTS food_types CASCADE',
      'DROP TABLE IF EXISTS place_types CASCADE',
      'DROP TABLE IF EXISTS "user" CASCADE',
      'DROP TABLE IF EXISTS "SequelizeMeta" CASCADE',
    ];

    for (const query of dropQueries) {
      const tableName = query.match(/DROP TABLE IF EXISTS (\S+)/)[1];
      console.log(`   🗑️  Dropando: ${tableName}`);
      await client.query(query);
    }

    console.log('\n✨ Banco de dados resetado com sucesso!');
    console.log('📝 Agora execute: yarn db:migrate\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
