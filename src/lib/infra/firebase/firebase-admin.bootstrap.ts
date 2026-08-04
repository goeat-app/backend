import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

const LOCAL_SERVICE_ACCOUNT_FILE = 'firebase-service-account.json';

export function ensureFirebaseAdminInitialized() {
  if (getApps().length > 0) {
    return;
  }

  // When the Firebase Auth Emulator is active, firebase-admin reads
  // FIREBASE_AUTH_EMULATOR_HOST and EMULATOR_PROJECT_ID automatically.
  // Support the older AUTH_EMULATOR_HOST variable used in local docs/config.
  const emulatorHost =
    process.env.FIREBASE_AUTH_EMULATOR_HOST ?? process.env.AUTH_EMULATOR_HOST;

  if (emulatorHost) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorHost;
    const projectId = process.env.EMULATOR_PROJECT_ID ?? 'demo-goeat';
    initializeApp({ projectId });
    return;
  }

  const localCredentialPath = path.resolve(
    process.cwd(),
    LOCAL_SERVICE_ACCOUNT_FILE,
  );

  const shouldUseLocalCredentialFile =
    !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    process.env.NODE_ENV !== 'production' &&
    existsSync(localCredentialPath);

  if (shouldUseLocalCredentialFile) {
    const rawJson = readFileSync(localCredentialPath, 'utf-8');
    const serviceAccount = JSON.parse(rawJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });

    return;
  }

  initializeApp();
}
