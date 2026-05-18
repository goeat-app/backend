const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_DATABASE_URL =
  'postgres://admin:goeat-admin@localhost:5432/goeat_db';

// Apply defaults without overriding environment variables explicitly provided by the caller.
process.env.API_BASE_URL ??= DEFAULT_API_BASE_URL;
process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
