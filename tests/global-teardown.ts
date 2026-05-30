async function globalTeardown(): Promise<void> {
  const container = globalThis.__VOICESCRIPT_PG__;
  if (container) {
    console.log("\n[global-teardown] Stopping Postgres container...");
    await container.stop();
    globalThis.__VOICESCRIPT_PG__ = undefined;
  }
}

export default globalTeardown;
