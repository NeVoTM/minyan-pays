import "./env.js";
import express from "express";
import cors from "cors";
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "minyan-pays-api" });
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
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`minyan-pays API http://localhost:${PORT}`);
});
