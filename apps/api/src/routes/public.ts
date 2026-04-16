import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getSettings } from "../lib/earnings.js";

export const publicRouter = Router();

publicRouter.get("/config", async (_req, res) => {
  const s = await getSettings();
  res.json({
    synagogueName: s.synagogueName,
    rabbiBanner: s.rabbiBanner ?? null,
  });
});

/** US ZIP → city/state. Uses DB cache, then zippopotam.us if needed. */
publicRouter.get("/zip/:zip", async (req, res) => {
  const zip = String(req.params.zip).replace(/\D/g, "").slice(0, 5);
  if (zip.length !== 5) {
    res.status(400).json({ error: "Enter a 5-digit ZIP code." });
    return;
  }

  const cached = await prisma.zipCache.findUnique({ where: { zip } });
  if (cached) {
    res.json({
      zip: cached.zip,
      city: cached.city,
      state: cached.state,
    });
    return;
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: ac.signal,
    }).finally(() => clearTimeout(timer));
    if (!r.ok) {
      res.status(404).json({ error: "ZIP not found. Enter city and state manually." });
      return;
    }
    const j = (await r.json()) as {
      places: { "place name": string; "state abbreviation": string }[];
    };
    const p = j.places?.[0];
    if (!p) {
      res.status(404).json({ error: "ZIP not found." });
      return;
    }
    const city = p["place name"];
    const state = p["state abbreviation"];
    await prisma.zipCache.upsert({
      where: { zip },
      create: { zip, city, state },
      update: { city, state },
    });
    res.json({ zip, city, state });
  } catch {
    res.status(502).json({
      error: "ZIP lookup unavailable. Enter city and state manually.",
    });
  }
});
