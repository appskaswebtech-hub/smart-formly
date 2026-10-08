/**
 * PM2 configuration for the production server.
 *
 * Why this file exists: `remix-serve` does not read `.env` — it contains no
 * dotenv — and PM2 starts processes with its own environment. Without this,
 * DATABASE_URL, SHOPIFY_APP_URL and the SMTP settings are simply absent, which
 * surfaces as "Detected an empty appUrl configuration" and
 * "Environment variable not found: DATABASE_URL".
 *
 * The .env file is read here, by PM2, and handed to the process. Secrets stay
 * in .env (gitignored) and never enter the repository.
 *
 * Start or reload with:
 *   pm2 start ecosystem.config.cjs --update-env
 *
 * --update-env matters: PM2 caches the environment from the first start, so a
 * plain `pm2 restart` would keep serving the old values.
 */
const fs = require("node:fs");
const path = require("node:path");

/**
 * Minimal .env reader. Deliberately not the dotenv package: this file is
 * executed by PM2 directly, before any dependency resolution we control, and
 * the format here is simple KEY=value.
 */
function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[pm2] ${file} not found — the app will start without its environment`);
    return {};
  }

  const vars = {};
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    // Strip matching surrounding quotes, as dotenv does.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) vars[key] = value;
  }
  return vars;
}

module.exports = {
  apps: [
    {
      name: "smartformly",
      cwd: __dirname,
      // remix-serve's real entry point. Invoking it directly rather than via
      // `npm run start` keeps PM2 managing the node process itself, so restarts
      // and memory limits apply to the server and not to an npm wrapper.
      script: "./node_modules/@remix-run/serve/dist/cli.js",
      args: "./build/server/index.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        ...readEnvFile(path.join(__dirname, ".env")),
      },
    },
  ],
};
