import { execSync } from "node:child_process";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";

/**
 * Default database connection, read from `.env.example`. The Postgres
 * testcontainer is bound to the same host/port so the running app and Prisma
 * can keep using these default values with no extra wiring.
 */
export function resolveDatabaseUrl(): string {
  const parsed =
    loadEnv({ path: path.resolve(process.cwd(), ".env.example") }).parsed ?? {};
  return (
    process.env.DATABASE_URL ??
    parsed.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/postgres"
  );
}

const POSTGRES_IMAGE = process.env.TEST_POSTGRES_IMAGE ?? "postgres:18-alpine";

declare global {
  var __VOICESCRIPT_PG__: StartedTestContainer | undefined;
}

async function globalSetup(): Promise<void> {
  const databaseUrl = resolveDatabaseUrl();
  const url = new URL(databaseUrl);
  const username = url.username || "postgres";
  const password = url.password || "postgres";
  const database = url.pathname.replace(/^\//, "") || "postgres";
  const hostPort = Number(url.port || "5432");

  // The reaper image (testcontainers/ryuk) lives on Docker Hub; disable it so
  // the suite still runs in restricted networks. We stop the container
  // ourselves in global teardown.
  process.env.TESTCONTAINERS_RYUK_DISABLED =
    process.env.TESTCONTAINERS_RYUK_DISABLED ?? "true";

  console.log(`\n[global-setup] Starting Postgres (${POSTGRES_IMAGE})...`);

  const container = await new GenericContainer(POSTGRES_IMAGE)
    .withEnvironment({
      POSTGRES_USER: username,
      POSTGRES_PASSWORD: password,
      POSTGRES_DB: database,
    })
    // Bind the container's 5432 to the fixed host port from .env.example so the
    // resulting DATABASE_URL stays deterministic.
    .withExposedPorts({ container: 5432, host: hostPort })
    .withWaitStrategy(
      Wait.forLogMessage(/database system is ready to accept connections/, 2),
    )
    .start();

  const resolvedUrl = `postgresql://${username}:${password}@${container.getHost()}:${container.getMappedPort(
    5432,
  )}/${database}`;
  process.env.DATABASE_URL = resolvedUrl;
  globalThis.__VOICESCRIPT_PG__ = container;

  const env = { ...process.env, DATABASE_URL: resolvedUrl };
  console.log("[global-setup] Applying migrations...");
  execSync("pnpm exec prisma migrate deploy", { stdio: "inherit", env });
  console.log("[global-setup] Seeding database...");
  execSync("pnpm exec prisma db seed", { stdio: "inherit", env });
  console.log("[global-setup] Database ready.\n");
}

export default globalSetup;
