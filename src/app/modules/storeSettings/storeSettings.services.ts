import { Prisma } from "../../../../prisma/generated/prisma";
import prisma from "../../../shared/prisma";

const getSettingsFromDB = async () => {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
};

const ALLOWED_FIELDS = new Set([
  "storeName",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "supportEmail",
  "supportPhone",
  "address",
  "currency",
  "currencySymbol",
  "socialLinks",
  "metaPixelId",
  "metaAccessToken",
  "metaTestEventCode",
  "tiktokPixelId",
  "tiktokAccessToken",
  "tiktokTestEventCode",
  "googlePixelId",
  "steadfastApiKey",
  "steadfastSecretKey",
  "steadfastBaseUrl",
  "redxAccessToken",
  "redxBaseUrl",
  "pathaoClientId",
  "pathaoClientSecret",
  "pathaoUsername",
  "pathaoPassword",
  "fraudBdApiKey",
]);

const upsertSettingsIntoDB = async (payload: Record<string, any>) => {
  const data: Record<string, any> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (value !== undefined) {
      if (key === "socialLinks" && value === null) {
        data[key] = Prisma.JsonNull;
      } else {
        data[key] = value;
      }
    }
  }

  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: {
      id: "singleton",
      ...data,
    },
  });
};

export const StoreSettingsServices = {
  getSettingsFromDB,
  upsertSettingsIntoDB,
};
