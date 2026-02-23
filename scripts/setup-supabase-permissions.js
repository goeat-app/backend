const { Client } = require('pg');
require('dotenv').config();

async function setupSupabasePermissions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    const tables = [
      'user',
      'food_types',
      'place_types',
      'restaurants',
      'restaurant_food_types',
      'restaurant_place_types',
      'restaurant_images',
      'reviews',
      'profile_mapping',
      'profile_mapping_food_type',
      'profile_mapping_place_type'
    ];

    console.log('🔒 Habilitando RLS (Row Level Security) nas tabelas...\n');

    for (const table of tables) {
      console.log(`   Configurando: ${table}`);
      
      // Habilitar RLS
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      
      // Criar política permissiva para autenticados (você pode ajustar depois)
      await client.query(`
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.${table};
      `);
      
      await client.query(`
        CREATE POLICY "Enable all access for authenticated users" 
        ON public.${table}
        FOR ALL 
        USING (true)
        WITH CHECK (true);
      `);

      // Dar permissões para o role anon e authenticated
      await client.query(`
        GRANT ALL ON public.${table} TO postgres, anon, authenticated, service_role;
      `);
    }

    console.log('\n✨ Configuração concluída!');
    console.log('📝 RLS habilitado em todas as tabelas');
    console.log('🔓 Políticas permissivas criadas (ATENÇÃO: ajuste para produção!)');
    console.log('\n⚠️  IMPORTANTE: As políticas atuais permitem acesso total.');
    console.log('   Configure políticas mais restritivas antes de ir para produção!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

setupSupabasePermissions();
