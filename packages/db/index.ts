import type { Logger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/node-postgres';

export const createClient = (url: string, logger: Logger) => {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return drizzle(url, { logger });
};

export * from 'drizzle-orm';
export * from './schema';
