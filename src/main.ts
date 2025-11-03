import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { syncTables } from './infrastructure/database/sync-tables';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  const syncDatabase = await syncTables();
}
bootstrap();
