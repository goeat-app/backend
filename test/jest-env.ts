const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_DATABASE_URL =
  'postgres://admin:goeat-admin@localhost:5432/goeat_db';

type TestFirebaseClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  phone_number?: string;
};

jest.mock('firebase-admin/auth', () => {
  return {
    getAuth: () => ({
      verifyIdToken: (token: string) => {
        if (token === 'expired.token') {
          const error = new Error('Token has expired') as Error & {
            code: string;
          };
          error.code = 'auth/id-token-expired';
          throw error;
        }

        if (token === 'service.unavailable') {
          const error = new Error('Network unavailable') as Error & {
            code: string;
          };
          error.code = 'app/network-error';
          throw error;
        }

        if (!token.startsWith('test-firebase.')) {
          const error = new Error('Invalid token') as Error & { code: string };
          error.code = 'auth/invalid-id-token';
          throw error;
        }

        const payloadPart = token.slice('test-firebase.'.length);

        try {
          const claims = JSON.parse(
            Buffer.from(payloadPart, 'base64url').toString('utf-8'),
          ) as TestFirebaseClaims;

          return {
            uid: claims.uid,
            email: claims.email,
            email_verified: claims.email_verified,
            name: claims.name,
            phone_number: claims.phone_number,
          };
        } catch {
          const error = new Error('Malformed token') as Error & {
            code: string;
          };
          error.code = 'auth/invalid-id-token';
          throw error;
        }
      },
    }),
  };
});

// Apply defaults without overriding environment variables explicitly provided by the caller.
process.env.API_BASE_URL ??= DEFAULT_API_BASE_URL;
process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
