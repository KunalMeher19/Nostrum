require('dotenv').config();

const { assertBootEnv } = require('./src/config/env.config');
assertBootEnv(); // throws (and exits) on missing/misconfigured env

const app = require('./src/app');
const { connectDb, mongoose } = require('./src/db/db');

const PORT = process.env.PORT || 5000;
const SHUTDOWN_GRACE_MS = Number(process.env.SHUTDOWN_GRACE_MS) || 10_000;

let server;

connectDb()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Nostrum API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Graceful shutdown: stop accepting connections, let in-flight requests
// finish, close Mongo, then exit. A hard timer guarantees the process
// never hangs on a stuck connection past the grace period.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, draining (max ${SHUTDOWN_GRACE_MS}ms)...`);
  const force = setTimeout(() => {
    console.error('Drain timed out, exiting hard.');
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);
  force.unref();
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    console.log('Drained cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Crash handlers: log with full stack and exit non-zero so the process
// manager (pm2/systemd/container runtime) restarts a clean instance.
// Never keep serving from an unknown state.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
