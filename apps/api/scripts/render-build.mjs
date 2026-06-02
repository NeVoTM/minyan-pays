/**
 * Render sets RENDER=true during build. Local dev: only `tsc` (no DB required).
 * @see https://render.com/docs/environment-variables
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const opts = { stdio: "inherit", cwd: root, env: process.env };
const onRender = process.env.RENDER === "true";

function tryStep(label, command) {
  try {
    execSync(command, opts);
    return true;
  } catch (err) {
    console.warn(
      `[render-build] ${label} failed (continuing so API can still deploy):`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

if (onRender) {
  const dbSynced = tryStep(
    "prisma db push",
    "npx prisma db push --accept-data-loss"
  );
  execSync("npx tsc", opts);
  if (dbSynced) {
    tryStep("db seed", "npm run db:seed");
  } else {
    console.warn(
      "[render-build] Skipping seed because db push did not succeed."
    );
  }
} else {
  execSync("npx tsc", opts);
}
