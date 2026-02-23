const { Client } = require('pg');
require('dotenv').config();

async function cleanupDuplicateTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('🗑️  Dropando tabelas duplicadas...');
    
    // Dropar tabelas na ordem correta (respeitando foreign keys)
    const dropQueries = [
      'DROP TABLE IF EXISTS restaurant_food_types CASCADE',
      'DROP TABLE IF EXISTS restaurant_place_types CASCADE',
      'DROP TABLE IF EXISTS restaurant_images CASCADE',
      'DROP TABLE IF EXISTS restaurants CASCADE',
      'DROP TABLE IF EXISTS food_types CASCADE',
      'DROP TABLE IF EXISTS place_types CASCADE',
    ];

    for (const query of dropQueries) {
      console.log(`   Executando: ${query}`);
      await client.query(query);
    }

    console.log('\n🧹 Limpando registros de migrations duplicadas...');
    
    const deleteMigrations = `
      DELETE FROM "SequelizeMeta" WHERE name IN (
        '20260203021638-create-food-types',
        '20260203021754-create-place-types',
        '20260203021900-create-restaurants',
        '20260203021955-create-restaurant-food-types',
        '20260203022044-create-restaurant-place-types',
        '20260203022128-create-restaurant-images'
      )
    `;
    
    const result = await client.query(deleteMigrations);
    console.log(`   ✅ ${result.rowCount} registros removidos da tabela SequelizeMeta\n`);

    console.log('✨ Limpeza concluída com sucesso!');
    console.log('📝 Agora você pode executar: yarn db:migrate\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

cleanupDuplicateTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
