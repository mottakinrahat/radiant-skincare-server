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
exports.PathaoService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
function sanitizeBaseUrl(rawUrl, fallback = "https://api-hermes.pathao.com") {
    let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
    if (!url)
        return fallback;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    return url.replace(/\/+$/, "");
}
function formatPathaoError(responseData, fallbackMessage) {
    let mainMsg = (responseData === null || responseData === void 0 ? void 0 : responseData.message) || (responseData === null || responseData === void 0 ? void 0 : responseData.error) || fallbackMessage;
    if ((responseData === null || responseData === void 0 ? void 0 : responseData.errors) && typeof responseData.errors === "object") {
        const details = Object.entries(responseData.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
        mainMsg = `${mainMsg} (${details})`;
    }
    return mainMsg;
}
class PathaoService {
    static getCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = yield prisma_1.default.storeSettings.findUnique({
                where: { id: "singleton" },
            });
            return {
                clientId: (settings === null || settings === void 0 ? void 0 : settings.pathaoClientId) || "",
                clientSecret: (settings === null || settings === void 0 ? void 0 : settings.pathaoClientSecret) || "",
                username: (settings === null || settings === void 0 ? void 0 : settings.pathaoUsername) || "",
                password: (settings === null || settings === void 0 ? void 0 : settings.pathaoPassword) || "",
                baseUrl: sanitizeBaseUrl(settings === null || settings === void 0 ? void 0 : settings.pathaoBaseUrl, "https://api-hermes.pathao.com"),
            };
        });
    }
    /**
     * Issue access token from Pathao API
     */
    static getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const creds = yield this.getCredentials();
            if (!creds.clientId || !creds.clientSecret || !creds.username || !creds.password) {
                return null;
            }
            try {
                const response = yield axios_1.default.post(`${creds.baseUrl}/aladdin/api/v1/issue-token`, {
                    client_id: creds.clientId,
                    client_secret: creds.clientSecret,
                    username: creds.username,
                    password: creds.password,
                    grant_type: "password",
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });
                return ((_a = response.data) === null || _a === void 0 ? void 0 : _a.access_token) || null;
            }
            catch (_b) {
                return null;
            }
        });
    }
    /**
     * Create order in Pathao Courier
     */
    static createOrder(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const token = yield this.getAccessToken();
            const creds = yield this.getCredentials();
            if (!token) {
                return {
                    success: false,
                    message: "Failed to authenticate with Pathao API. Please verify Pathao credentials in Store Settings.",
                };
            }
            try {
                const response = yield axios_1.default.post(`${creds.baseUrl}/aladdin/api/v1/orders`, {
                    store_id: payload.store_id || 1,
                    merchant_order_id: payload.merchant_order_id,
                    recipient_name: payload.recipient_name,
                    recipient_phone: payload.recipient_phone,
                    recipient_address: payload.recipient_address,
                    recipient_city: payload.recipient_city || 1,
                    recipient_zone: payload.recipient_zone || 1,
                    delivery_type: payload.delivery_type || 48,
                    item_type: payload.item_type || 2,
                    special_instruction: payload.special_instruction || "",
                    item_quantity: payload.item_quantity || 1,
                    item_weight: payload.item_weight || 0.5,
                    amount_to_collect: payload.amount_to_collect,
                    item_description: payload.item_description || "Ecommerce Parcel",
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const json = response.data;
                const consignmentId = ((_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.consignment_id) || (json === null || json === void 0 ? void 0 : json.consignment_id) || null;
                if (!consignmentId || (json === null || json === void 0 ? void 0 : json.type) === "error") {
                    return {
                        success: false,
                        message: formatPathaoError(json, "Pathao rejected order creation"),
                        error: json,
                    };
                }
                return {
                    success: true,
                    data: json,
                    consignmentId: String(consignmentId),
                    trackingCode: String(consignmentId),
                };
            }
            catch (error) {
                const errRes = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data;
                return {
                    success: false,
                    message: formatPathaoError(errRes, error.message || "Failed to create Pathao order"),
                    error: errRes || error.message,
                };
            }
        });
    }
}
exports.PathaoService = PathaoService;
