import 'tsconfig-paths/register';
import { createNestApplication } from './nest-application.factory';

async function bootstrap() {
  const app = await createNestApplication();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
