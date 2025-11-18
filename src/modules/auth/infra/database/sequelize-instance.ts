import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load .env when running scripts (sync-tables etc.)
dotenv.config();

const DB_USER = process.env.USER || process.env.DB_USER;
const DB_PASSWORD = process.env.PASSWORD || process.env.DB_PASSWORD;
const DB_HOST = process.env.HOST || process.env.DB_HOST;
const DB_PORT = process.env.PORT || process.env.DB_PORT;
const DB_NAME = process.env.DATABASE || process.env.DB_NAME;

const missing: string[] = [];
if (!DB_HOST) missing.push('HOST');
if (!DB_PORT) missing.push('PORT');
if (!DB_USER) missing.push('USER');
if (!DB_PASSWORD) missing.push('PASSWORD');
if (!DB_NAME) missing.push('DATABASE');

if (missing.length > 0) {
  throw new Error(
    `Missing required DB environment variables: ${missing.join(', ')}.\n` +
      `Set them in your environment or create a .env file with the values.`,
  );
}

export const sequelize = new Sequelize(DB_NAME!, DB_USER!, DB_PASSWORD, {
  host: DB_HOST!,
  port: parseInt(DB_PORT!, 10),
  dialect: 'mysql',
  logging: false,
});
