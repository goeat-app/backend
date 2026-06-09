import { randomBytes } from 'crypto';

export interface TestIdentity {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * Creates a unique test user payload on every call.
 * Uses timestamp + random hex suffix so the suite can be re-run
 * without hitting unique-constraint violations.
 */
export function createTestIdentity(): TestIdentity {
  const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  return {
    name: `Test User ${suffix}`,
    email: `test.${suffix}@integration.test`,
    phone: `+5511${Math.floor(10000000 + Math.random() * 89999999)}`,
    password: 'Test@Password123!',
  };
}
