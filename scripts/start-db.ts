import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

async function main() {
  const dbDir = path.resolve(__dirname, '../.data/postgres');
  console.log(`[WorkWise DB] Initializing embedded Postgres at ${dbDir}...`);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'workwise',
    password: 'workwise_dev',
    port: 5432,
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log('[WorkWise DB] Cluster initialised.');
  } catch (err: any) {
    console.log('[WorkWise DB] Init note (may already exist):', err.message);
  }

  await pg.start();
  console.log('[WorkWise DB] Embedded Postgres started on port 5432!');

  try {
    await pg.createDatabase('workwise_db');
    console.log('[WorkWise DB] Database workwise_db created.');
  } catch (err: any) {
    console.log('[WorkWise DB] DB check note:', err.message);
  }

  console.log('[WorkWise DB] Database is ready for Prisma migrations and API connections.');

  // Keep alive
  process.on('SIGINT', async () => {
    console.log('[WorkWise DB] Stopping embedded Postgres...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[WorkWise DB] Stopping embedded Postgres...');
    await pg.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[WorkWise DB] Error starting embedded Postgres:', err);
  process.exit(1);
});
