"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const hash_util_1 = require("./hash.util");
class TrackingService {
    /**
     * Sends a server-side event to Meta Conversions API (CAPI)
     */
    static sendMetaEvent(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let metaPixelId = ((_a = input.customConfig) === null || _a === void 0 ? void 0 : _a.metaPixelId) || process.env.META_PIXEL_ID;
            let metaToken = ((_b = input.customConfig) === null || _b === void 0 ? void 0 : _b.metaCapiToken) || process.env.META_CAPI_ACCESS_TOKEN;
            if (!metaPixelId || !metaToken) {
                try {
                    const settings = yield prisma_1.default.storeSettings.findUnique({ where: { id: "singleton" } });
                    if (!metaPixelId && (settings === null || settings === void 0 ? void 0 : settings.metaPixelId))
                        metaPixelId = settings.metaPixelId;
                    if (!metaToken && (settings === null || settings === void 0 ? void 0 : settings.metaAccessToken))
                        metaToken = settings.metaAccessToken;
                }
                catch (_c) {
                    // ignore
                }
            }
            if (!metaPixelId || !metaToken) {
                console.log("[TrackingService] Meta Pixel ID or CAPI Access Token not configured. Skipping Meta CAPI.");
                return;
            }
            try {
                const eventName = input.eventName || "Purchase";
                const eventTime = Math.floor(Date.now() / 1000);
                const userData = {};
                const emHash = (0, hash_util_1.hashEmail)(input.email);
                const phHash = (0, hash_util_1.hashPhone)(input.phone);
                if (emHash)
                    userData.em = [emHash];
                if (phHash)
                    userData.ph = [phHash];
                if (input.clientIp)
                    userData.client_ip_address = input.clientIp;
                if (input.userAgent)
                    userData.client_user_agent = input.userAgent;
                const payload = {
                    data: [
                        {
                            event_name: eventName,
                            event_time: eventTime,
                            event_id: input.eventId,
                            action_source: "website",
                            user_data: userData,
                            custom_data: {
                                currency: input.currency || "BDT",
                                value: input.value,
                                content_ids: input.contentIds || [],
                                content_type: "product",
                            },
                        },
                    ],
                };
                const url = `https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`;
                const response = yield fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const resData = yield response.json();
                if (!response.ok) {
                    console.warn("[TrackingService] Meta CAPI error response:", resData);
                }
                else {
                    console.log(`[TrackingService] Meta CAPI event '${eventName}' sent successfully for eventId: ${input.eventId}`);
                }
            }
            catch (error) {
                console.error("[TrackingService] Failed to send Meta CAPI event:", error);
            }
        });
    }
    /**
     * Sends a server-side event to TikTok Events API (CAPI)
     */
    static sendTikTokEvent(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let tiktokPixelId = ((_a = input.customConfig) === null || _a === void 0 ? void 0 : _a.tiktokPixelId) || process.env.TIKTOK_PIXEL_ID;
            let tiktokToken = ((_b = input.customConfig) === null || _b === void 0 ? void 0 : _b.tiktokAccessToken) || process.env.TIKTOK_ACCESS_TOKEN;
            if (!tiktokPixelId || !tiktokToken) {
                try {
                    const settings = yield prisma_1.default.storeSettings.findUnique({ where: { id: "singleton" } });
                    if (!tiktokPixelId && (settings === null || settings === void 0 ? void 0 : settings.tiktokPixelId))
                        tiktokPixelId = settings.tiktokPixelId;
                }
                catch (_c) {
                    // ignore
                }
            }
            if (!tiktokPixelId || !tiktokToken) {
                console.log("[TrackingService] TikTok Pixel ID or Access Token not configured. Skipping TikTok CAPI.");
                return;
            }
            try {
                const eventName = input.eventName === "Purchase" || !input.eventName
                    ? "CompletePayment"
                    : input.eventName;
                const userObj = {};
                const emHash = (0, hash_util_1.hashEmail)(input.email);
                const phHash = (0, hash_util_1.hashPhone)(input.phone);
                if (emHash)
                    userObj.email = emHash;
                if (phHash)
                    userObj.phone_number = phHash;
                if (input.clientIp)
                    userObj.ip = input.clientIp;
                if (input.userAgent)
                    userObj.user_agent = input.userAgent;
                const payload = {
                    pixel_code: tiktokPixelId,
                    event: eventName,
                    event_id: input.eventId,
                    timestamp: new Date().toISOString(),
                    context: {
                        user: userObj,
                    },
                    properties: {
                        currency: input.currency || "BDT",
                        value: input.value,
                        contents: (input.contentIds || []).map((id) => ({
                            content_id: id,
                            quantity: 1,
                            price: input.value,
                        })),
                    },
                };
                const url = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
                const response = yield fetch(url, {
                    method: "POST",
                    headers: {
                        "Access-Token": tiktokToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                const resData = yield response.json();
                if (!response.ok || resData.code !== 0) {
                    console.warn("[TrackingService] TikTok CAPI error response:", resData);
                }
                else {
                    console.log(`[TrackingService] TikTok CAPI event '${eventName}' sent successfully for eventId: ${input.eventId}`);
                }
            }
            catch (error) {
                console.error("[TrackingService] Failed to send TikTok CAPI event:", error);
            }
        });
    }
    /**
     * Convenience method to track purchase server-side on both Meta and TikTok in parallel
     */
    static trackPurchase(input) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.allSettled([
                    this.sendMetaEvent(Object.assign(Object.assign({}, input), { eventName: "Purchase" })),
                    this.sendTikTokEvent(Object.assign(Object.assign({}, input), { eventName: "CompletePayment" })),
                ]);
            }
            catch (error) {
                console.error("[TrackingService] trackPurchase non-blocking catch:", error);
            }
        });
    }
}
exports.TrackingService = TrackingService;
