import 'tsconfig-paths/register';
import { createNestApplication } from './nest-application.factory';

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
  registerUnhandledErrorLogging();

  const app = await createNestApplication();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
