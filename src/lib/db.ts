import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// In Node runtimes (including vitest), supply the `ws` WebSocket implementation.
// The native/undici WebSocket in Node 20+ has compatibility issues with the Neon
// driver. In edge/browser contexts the global WebSocket is used automatically.
if (typeof process !== 'undefined' && process.versions?.node && !neonConfig.webSocketConstructor) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws');
}

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // Detect Neon vs plain Postgres. Use the Neon adapter only for Neon URLs;
  // anything else (e.g. CI's local Postgres service container) goes through
  // the vanilla pg-based adapter, which speaks the standard Postgres protocol
  // instead of Neon's WebSocket transport.
  const isNeon =
    connectionString.includes('.neon.tech') || connectionString.includes('neondb_owner');

  if (isNeon) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }

  // Plain Postgres (CI). Lazy-require so production bundles only pull the Neon adapter.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
