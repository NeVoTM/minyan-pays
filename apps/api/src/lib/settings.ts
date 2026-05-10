import { prisma } from "./prisma.js";

export const SETTING_KEY_GLOBAL_ADMIN_HASH = "globalAdminPasswordHash";
export const SETTING_KEY_GLOBAL_ADMIN_PLAIN = "globalAdminPasswordPlain";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getGlobalAdminPasswordHash(): Promise<string | null> {
  return getSetting(SETTING_KEY_GLOBAL_ADMIN_HASH);
}

export async function getGlobalAdminPasswordPlain(): Promise<string | null> {
  return getSetting(SETTING_KEY_GLOBAL_ADMIN_PLAIN);
}

export async function setGlobalAdminPassword(args: {
  hash: string;
  plain: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: SETTING_KEY_GLOBAL_ADMIN_HASH },
      update: { value: args.hash },
      create: { key: SETTING_KEY_GLOBAL_ADMIN_HASH, value: args.hash },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEY_GLOBAL_ADMIN_PLAIN },
      update: { value: args.plain },
      create: { key: SETTING_KEY_GLOBAL_ADMIN_PLAIN, value: args.plain },
    }),
  ]);
}
