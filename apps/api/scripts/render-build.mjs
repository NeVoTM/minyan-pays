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

if (onRender) {
  execSync("npx prisma db push --accept-data-loss", opts);
}

execSync("npx tsc", opts);

if (onRender) {
  execSync("npm run db:seed", opts);
}
