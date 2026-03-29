import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { punchRouter } from "./routes/punch.js";
import { adminRouter } from "./routes/admin.js";
import { memberRouter } from "./routes/member.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "minyan-pays-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/punch", punchRouter);
app.use("/api/admin", adminRouter);
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

app.listen(PORT, () => {
  console.log(`minyan-pays API http://localhost:${PORT}`);
});
