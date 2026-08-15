"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreSettingsValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const optionalString = zod_1.default.string().optional().nullable().or(zod_1.default.literal(""));
const upsertSettings = zod_1.default.object({
    body: zod_1.default
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
        socialLinks: zod_1.default.record(zod_1.default.string(), zod_1.default.any()).optional().nullable(),
        // Pixels & Tracking
        metaPixelId: zod_1.default.string().optional().nullable(),
        metaAccessToken: zod_1.default.string().optional().nullable(),
        tiktokPixelId: zod_1.default.string().optional().nullable(),
        tiktokAccessToken: zod_1.default.string().optional().nullable(),
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
exports.StoreSettingsValidation = {
    upsertSettings,
};
