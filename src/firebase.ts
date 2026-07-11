import 'tsconfig-paths/register';
import * as functions from 'firebase-functions/v1';
import { onRequest } from 'firebase-functions/v2/https';
import { createNestApplication } from './nest-application.factory';
import { ensureFirebaseAdminInitialized } from './lib/infra/firebase/firebase-admin.bootstrap';
import { CreateUserUseCase } from './modules/auth/app/use-cases/register.use-case';

type ExpressHandler = (req: unknown, res: unknown) => void;

let cachedServer: ExpressHandler | null = null;

ensureFirebaseAdminInitialized();

async function getServer(): Promise<ExpressHandler> {
  if (cachedServer) {
    return cachedServer;
  }

  const app = await createNestApplication();
  await app.init();

  cachedServer = app.getHttpAdapter().getInstance() as ExpressHandler;
  return cachedServer;
}

export const api = onRequest({ invoker: 'public' }, async (req, res) => {
  // Allow CORS preflight requests to reach the NestJS CORS middleware
  // so the correct Access-Control-Allow-* headers are returned.
  // if (req.method === 'OPTIONS') {
  //   const server = await getServer();
  //   server(req, res);
  //   return;
  // }

  // const appCheckToken = req.header('X-Firebase-AppCheck');

  // if (!appCheckToken) {
  //   res.status(401).json({ message: 'Missing App Check token' });
  //   return;
  // }

  // try {
  //   await getAppCheck().verifyToken(appCheckToken);
  // } catch {
  //   res.status(401).json({ message: 'Invalid App Check token' });
  //   return;
  // }

  const server = await getServer();
  server(req, res);
});

export const onFirebaseUserCreate = functions.auth
  .user()
  .onCreate(async (user) => {
    const app = await createNestApplication();

    const usersUseCase = app.get(CreateUserUseCase);
    const userEmail = user.email;

    if (!userEmail) {
      console.error(
        `User with UID ${user.uid} has no email. Skipping registration.`,
      );
      return;
    }

    await usersUseCase.execute({
      firebaseUid: user.uid,
      email: user.email,
    });
  });
