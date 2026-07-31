import app from "./app";
import { logger } from "./lib/logger";
import { runPortalAclBackfill } from "./lib/portalAclBackfill";
import { runMigrations } from "./lib/runMigrations";
import { ensurePortalSettingsSeed } from "./lib/portalSettings";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run DB migrations synchronously before accepting traffic
runMigrations()
  .then(() => ensurePortalSettingsSeed())
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");

      // Ensure all portal documents are private on every startup. Runs
      // asynchronously so it never blocks request handling.
      runPortalAclBackfill(logger).catch(() => {});
    });
  })
  .catch((err) => {
    logger.error({ err }, "Startup failed");
    process.exit(1);
  });
