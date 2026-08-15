import z from "zod";

const optionalString = z.string().optional().nullable().or(z.literal(""));

const upsertSettings = z.object({
  body: z
    .object({
      storeName: optionalString,
      logoUrl: optionalString,
      faviconUrl: optionalString,
      primaryColor: optionalString,
      secondaryColor: optionalString,
      accentColor: optionalString,
      supportEmail: optionalString,
      supportPhone: optionalString,
      address: optionalString,
      currency: optionalString,
      currencySymbol: optionalString,
      socialLinks: z.record(z.string(), z.any()).optional().nullable(),

      // Pixels & Tracking
      metaPixelId: z.string().optional().nullable(),
      metaAccessToken: z.string().optional().nullable(),
      tiktokPixelId: z.string().optional().nullable(),
      tiktokAccessToken: z.string().optional().nullable(),

      // Couriers
      steadfastApiKey: optionalString,
      steadfastSecretKey: optionalString,
      steadfastBaseUrl: optionalString,

      redxAccessToken: optionalString,
      redxBaseUrl: optionalString,

      pathaoClientId: optionalString,
      pathaoClientSecret: optionalString,
      pathaoUsername: optionalString,
      pathaoPassword: optionalString,

      fraudBdApiKey: optionalString,
    })
    .partial(),
});

export const StoreSettingsValidation = {
  upsertSettings,
};
