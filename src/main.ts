import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(3000);

  const syncTablesModule = await import('./modules/auth/infra/database/sync-tables.js');
  await syncTablesModule.syncTables();
  app.enableCors();
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
