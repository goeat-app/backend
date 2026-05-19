import request from 'supertest';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

/**
 * Supertest agent bound to the live API base URL.
 * Override the target host with the API_BASE_URL environment variable.
 */
export const api = request(BASE_URL);
