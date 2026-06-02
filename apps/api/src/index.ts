import "./env.js";
import "./patchExpressAsync.js";
import express from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { punchRouter } from "./routes/punch.js";
import { adminRouter } from "./routes/admin.js";
import { rabbiRouter } from "./routes/rabbi.js";
import { memberRouter } from "./routes/member.js";
import { registerRouter } from "./routes/register.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const webOriginRaw = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const webOrigins = webOriginRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin:
      webOrigins.length <= 1 ? webOrigins[0] ?? "http://localhost:5173" : webOrigins,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Organization-Slug",
      "X-Admin-Bootstrap-Token",
    ],
  })
);
app.use(express.json());

let dbReady = false;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "minyan-pays-api",
    db: dbReady,
  });
});

app.use("/api/public", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/register", registerRouter);
app.use("/api/punch", punchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/rabbi", rabbiRouter);
app.use("/api/me", memberRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Server error";
    const dbUnavailable =
      err instanceof Prisma.PrismaClientInitializationError ||
      (err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P1001");
    if (dbUnavailable) {
      res.status(503).json({
        error:
          "Database is temporarily unavailable. Check Render Postgres and DATABASE_URL.",
      });
      return;
    }
    res.status(500).json({ error: message || "Server error" });
  }
);

async function connectDatabase(): Promise<void> {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      dbReady = true;
      console.log("Database connected.");
      return;
    } catch (err) {
      console.error(
        `Database connect attempt ${attempt}/${maxAttempts} failed:`,
        err
      );
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  console.error(
    "Database unreachable after retries; API stays up for /api/health but data routes return 503."
  );
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`minyan-pays API http://localhost:${PORT}`);
  void connectDatabase();
});
