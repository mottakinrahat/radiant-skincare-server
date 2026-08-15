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
exports.RedXService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
function sanitizeBaseUrl(rawUrl, fallback = "https://openapi.redx.com.bd/v1.0.0") {
    let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
    if (!url)
        return fallback;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    return url.replace(/\/+$/, "");
}
function formatRedXError(responseData, fallbackMessage) {
    let mainMsg = (responseData === null || responseData === void 0 ? void 0 : responseData.message) || (responseData === null || responseData === void 0 ? void 0 : responseData.error) || fallbackMessage;
    if (Array.isArray(responseData === null || responseData === void 0 ? void 0 : responseData.validation_errors) && responseData.validation_errors.length > 0) {
        const details = responseData.validation_errors
            .map((item) => {
            if (typeof item === "string")
                return item;
            return Object.entries(item)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
        })
            .join("; ");
        mainMsg = `${mainMsg} (${details})`;
    }
    return mainMsg;
}
class RedXService {
    static getCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = yield prisma_1.default.storeSettings.findUnique({
                where: { id: "singleton" },
            });
            return {
                accessToken: (settings === null || settings === void 0 ? void 0 : settings.redxAccessToken) || "",
                baseUrl: sanitizeBaseUrl(settings === null || settings === void 0 ? void 0 : settings.redxBaseUrl, "https://openapi.redx.com.bd/v1.0.0"),
            };
        });
    }
    /**
     * Create parcel in RedX Courier
     */
    static createParcel(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const creds = yield this.getCredentials();
            if (!creds.accessToken) {
                return {
                    success: false,
                    message: "RedX access token missing. Please configure RedX access token in Store Settings.",
                };
            }
            const requestBody = {
                customer_name: payload.customer_name,
                customer_phone: payload.customer_phone,
                delivery_area: payload.delivery_area || "Dhaka",
                delivery_area_id: payload.delivery_area_id || 1,
                customer_address: payload.customer_address,
                merchant_invoice_id: payload.merchant_invoice_id,
                cash_collection_amount: payload.cash_collection_amount,
                parcel_weight: payload.parcel_weight || 500,
                instruction: payload.instruction || "",
                value: payload.value || payload.cash_collection_amount,
            };
            const cleanToken = creds.accessToken.replace(/^Bearer\s+/i, "").trim();
            const headers = {
                "Content-Type": "application/json",
                "API-ACCESS-TOKEN": `Bearer ${cleanToken}`,
                Authorization: `Bearer ${cleanToken}`,
            };
            const candidateEndpoints = [
                `${creds.baseUrl}/parcel/create`,
                `${creds.baseUrl}/parcels/create`,
                `${creds.baseUrl}/parcel`,
            ];
            let response = null;
            let lastError = null;
            for (const endpoint of candidateEndpoints) {
                try {
                    response = yield axios_1.default.post(endpoint, requestBody, { headers });
                    if (response === null || response === void 0 ? void 0 : response.data) {
                        const msg = ((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "";
                        if (msg.includes("specified endpoint") || msg.includes("request method")) {
                            continue;
                        }
                        break;
                    }
                }
                catch (err) {
                    lastError = err;
                    const errData = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data;
                    const errMsg = (errData === null || errData === void 0 ? void 0 : errData.message) || err.message || "";
                    if (((_c = err.response) === null || _c === void 0 ? void 0 : _c.status) === 404 ||
                        ((_d = err.response) === null || _d === void 0 ? void 0 : _d.status) === 405 ||
                        errMsg.includes("specified endpoint") ||
                        errMsg.includes("request method")) {
                        continue;
                    }
                    break;
                }
            }
            if (!response && lastError) {
                const responseData = (_e = lastError.response) === null || _e === void 0 ? void 0 : _e.data;
                const errorMessage = formatRedXError(responseData, lastError.message || "Failed to create RedX parcel");
                return {
                    success: false,
                    message: errorMessage,
                    error: responseData || lastError.message,
                };
            }
            const data = response === null || response === void 0 ? void 0 : response.data;
            if (!data || (data === null || data === void 0 ? void 0 : data.success) === false) {
                return {
                    success: false,
                    message: formatRedXError(data, "RedX rejected parcel creation"),
                    error: data,
                };
            }
            const trackingCode = (data === null || data === void 0 ? void 0 : data.tracking_number) || ((_f = data === null || data === void 0 ? void 0 : data.parcel) === null || _f === void 0 ? void 0 : _f.tracking_number) || (data === null || data === void 0 ? void 0 : data.tracking_id) || null;
            if (!trackingCode) {
                return {
                    success: false,
                    message: formatRedXError(data, "RedX did not return a valid tracking number"),
                    error: data,
                };
            }
            return {
                success: true,
                data,
                trackingCode: String(trackingCode),
                consignmentId: String(trackingCode),
            };
        });
    }
    /**
     * Track parcel status in RedX
     */
    static trackParcel(trackingNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const creds = yield this.getCredentials();
            const cleanToken = creds.accessToken.replace(/^Bearer\s+/i, "").trim();
            try {
                const response = yield axios_1.default.get(`${creds.baseUrl}/parcels/track/${trackingNumber}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "API-ACCESS-TOKEN": `Bearer ${cleanToken}`,
                        Authorization: `Bearer ${cleanToken}`,
                    },
                });
                return response.data;
            }
            catch (error) {
                return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || null;
            }
        });
    }
}
exports.RedXService = RedXService;
