import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';

import { createNestApplication } from './nest-application.factory';
import { ensureFirebaseAdminInitialized } from './lib/infra/firebase/firebase-admin.bootstrap';
import { ZodValidationPipe } from 'nestjs-zod';

function registerUnhandledErrorLogging() {
  process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[UncaughtException]', error);
    process.exit(1);
  });
}

async function bootstrap() {
  dotenv.config({ path: '.env.local' });
  dotenv.config();

  registerUnhandledErrorLogging();
  ensureFirebaseAdminInitialized();

  const app = await createNestApplication();

  app.enableCors();
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
