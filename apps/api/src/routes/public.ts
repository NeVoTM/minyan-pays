import { Router } from "express";
import zipcodes from "zipcodes";
import { prisma } from "../lib/prisma.js";
import {
  getOrganizationBySlug,
  getOrgSlugFromRequest,
  normalizeOrgSlug,
} from "../lib/organizationService.js";

export const publicRouter = Router();

/** List organizations (for home / picker). */
publicRouter.get("/organizations", async (_req, res) => {
  const rows = await prisma.organization.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      kind: true,
      synagogueName: true,
      locationAddress: true,
      defaultLocale: true,
    },
  });
  res.json(rows);
});

publicRouter.get("/config", async (req, res) => {
  const slug =
    normalizeOrgSlug(
      typeof req.query.organizationSlug === "string"
        ? req.query.organizationSlug
        : undefined
    ) ?? getOrgSlugFromRequest(req);

  if (!slug) {
    res.status(400).json({
      error:
        "organizationSlug query or X-Organization-Slug header is required.",
    });
    return;
  }

  const org = await getOrganizationBySlug(slug);
  if (!org) {
    res.status(404).json({ error: "Unknown organization." });
    return;
  }

  res.json({
    organizationSlug: org.slug,
    synagogueName: org.synagogueName,
    rabbiBanner: org.rabbiBanner ?? null,
    defaultLocale: org.defaultLocale,
    timezone: org.timezone,
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

  const local = zipcodes.lookup(zip) as
    | { city: string; state: string }
    | undefined;
  if (local?.city && local?.state) {
    const city = local.city;
    const state = local.state;
    await prisma.zipCache.upsert({
      where: { zip },
      create: { zip, city, state },
      update: { city, state },
    });
    res.json({ zip, city, state });
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
