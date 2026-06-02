import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"] as const;

/** Render Postgres requires SSL; append sslmode when the URL omits it. */
function normalizeDatabaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!/render\.com|oregon-postgres/i.test(trimmed)) {
    return trimmed;
  }
  if (/[?&]sslmode=/i.test(trimmed)) {
    return trimmed;
  }
  const joiner = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${joiner}sslmode=require`;
}

if (process.env.NODE_ENV !== "test") {
  const missing = requiredEnv.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
  }
}
