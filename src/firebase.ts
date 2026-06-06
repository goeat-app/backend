import 'tsconfig-paths/register';
import { onRequest } from 'firebase-functions/v2/https';
import {
  beforeUserCreated as onBeforeUserCreated,
  AuthBlockingEvent,
} from 'firebase-functions/v2/identity';
import { createNestApplication } from './nest-application.factory';
import { ensureFirebaseAdminInitialized } from './lib/infra/firebase/firebase-admin.bootstrap';

type ExpressHandler = (req: unknown, res: unknown) => void;

let cachedServer: ExpressHandler | null = null;

ensureFirebaseAdminInitialized();

function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function resolveDisplayName(event: AuthBlockingEvent): string {
  const currentDisplayName = event.data?.displayName;

  if (typeof currentDisplayName === 'string' && currentDisplayName.trim()) {
    return currentDisplayName.trim();
  }

  const email = normalizeEmail(event.data?.email);
  if (email) {
    const [localPart] = email.split('@');
    if (localPart?.trim()) {
      return localPart.trim();
    }
  }

  return 'GoEat User';
}

export const beforeUserCreated: ReturnType<typeof onBeforeUserCreated> =
  onBeforeUserCreated(
    {
      region: 'us-central1',
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async (event) => {
      const normalizedEmail = normalizeEmail(event.data?.email);

      // Keep backend auth identity deterministic: every user must have an email.
      if (!normalizedEmail) {
        throw new Error('Email is required to create a user.');
      }

      return {
        displayName: resolveDisplayName(event),
      };
    },
  );

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
  },
);
