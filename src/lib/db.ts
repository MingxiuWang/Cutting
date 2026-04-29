import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only polyfill `ws` when the runtime doesn't already provide WebSocket.
// Vitest's jsdom env has no native WebSocket, so we install `ws` there.
// Vercel/Node 20+ and edge runtimes have native WebSocket — skip the polyfill
// (forcing `ws` there is fragile because it relies on bundler resolution).
if (
  typeof process !== 'undefined' &&
  process.versions?.node &&
  !neonConfig.webSocketConstructor &&
  typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined'
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require('ws');
  } catch {
    // `ws` not bundled in this runtime — fall back to whatever the runtime provides.
  }
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
