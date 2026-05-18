import 'tsconfig-paths/register';
import { getAppCheck } from 'firebase-admin/app-check';
import { getApps, initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { createNestApplication } from './nest-application.factory';

type ExpressHandler = (req: unknown, res: unknown) => void;

let cachedServer: ExpressHandler | null = null;

if (!getApps().length) {
  initializeApp();
}

async function getServer(): Promise<ExpressHandler> {
  if (cachedServer) {
    return cachedServer;
  }

  const app = await createNestApplication();
  await app.init();

  cachedServer = app.getHttpAdapter().getInstance() as ExpressHandler;
  return cachedServer;
}

export const api = onRequest(
  {
    invoker: 'public',
  },
  async (req, res) => {
    // Allow CORS preflight requests to reach the NestJS CORS middleware
    // so the correct Access-Control-Allow-* headers are returned.
    if (req.method === 'OPTIONS') {
      const server = await getServer();
      server(req, res);
      return;
    }

    const appCheckToken = req.header('X-Firebase-AppCheck');

    if (!appCheckToken) {
      res.status(401).json({ message: 'Missing App Check token' });
      return;
    }

    try {
      await getAppCheck().verifyToken(appCheckToken);
    } catch {
      res.status(401).json({ message: 'Invalid App Check token' });
      return;
    }

    const server = await getServer();
    server(req, res);
  },
);
