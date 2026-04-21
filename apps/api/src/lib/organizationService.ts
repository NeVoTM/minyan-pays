import type { Organization } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "./prisma.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrgSlug(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = raw.trim().toLowerCase();
  if (!s || !SLUG_RE.test(s)) return null;
  return s;
}

/** Resolve org slug from header (preferred) or query string. */
export function getOrgSlugFromRequest(req: Request): string | null {
  const h = req.headers["x-organization-slug"];
  if (typeof h === "string" && h.trim()) {
    return normalizeOrgSlug(h);
  }
  const q = req.query.organizationSlug ?? req.query.org;
  if (typeof q === "string" && q.trim()) {
    return normalizeOrgSlug(q);
  }
  return null;
}

export async function getOrganizationBySlug(
  slug: string | null
): Promise<Organization | null> {
  if (!slug) return null;
  return prisma.organization.findUnique({ where: { slug } });
}

export async function requireOrganizationFromRequest(
  req: Request
): Promise<{ org: Organization; slug: string } | { error: string; status: number }> {
  const slug = getOrgSlugFromRequest(req);
  if (!slug) {
    return {
      error:
        "Organization is required. Send header X-Organization-Slug or query organizationSlug.",
      status: 400,
    };
  }
  const org = await getOrganizationBySlug(slug);
  if (!org) {
    return { error: "Unknown organization.", status: 404 };
  }
  return { org, slug };
}
