import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

const LOCAL_SERVICE_ACCOUNT_FILE = 'firebase-service-account.json';

export function ensureFirebaseAdminInitialized() {
  if (getApps().length > 0) {
    return;
  }

  // When the Firebase Auth Emulator is active, firebase-admin reads
  // AUTH_EMULATOR_HOST and EMULATOR_PROJECT_ID automatically and routes all Auth calls to it.
  // No real credentials are required in this mode.
  if (process.env.AUTH_EMULATOR_HOST) {
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
