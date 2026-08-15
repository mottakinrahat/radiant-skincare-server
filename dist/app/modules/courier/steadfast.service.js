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
exports.SteadfastService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../../config"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
function sanitizeBaseUrl(rawUrl, fallback = "https://portal.packzy.com/api/v1") {
    let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
    if (!url)
        return fallback;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    return url.replace(/\/+$/, "");
}
function formatSteadfastError(responseData, fallbackMessage) {
    let mainMsg = (responseData === null || responseData === void 0 ? void 0 : responseData.message) || (responseData === null || responseData === void 0 ? void 0 : responseData.error) || fallbackMessage;
    if ((responseData === null || responseData === void 0 ? void 0 : responseData.errors) && typeof responseData.errors === "object") {
        const details = Object.entries(responseData.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
        mainMsg = `${mainMsg} (${details})`;
    }
    return mainMsg;
}
class SteadfastService {
    static getCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = yield prisma_1.default.storeSettings.findUnique({
                where: { id: "singleton" },
            });
            return {
                apiKey: (settings === null || settings === void 0 ? void 0 : settings.steadfastApiKey) || config_1.default.steadfast.apiKey || "",
                secretKey: (settings === null || settings === void 0 ? void 0 : settings.steadfastSecretKey) || config_1.default.steadfast.secretKey || "",
                baseUrl: sanitizeBaseUrl((settings === null || settings === void 0 ? void 0 : settings.steadfastBaseUrl) || config_1.default.steadfast.baseUrl, "https://portal.packzy.com/api/v1"),
            };
        });
    }
    /**
     * Create parcel in Steadfast Courier
     */
    static createParcel(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const creds = yield this.getCredentials();
            if (!creds.apiKey || !creds.secretKey) {
                return {
                    success: false,
                    message: "Steadfast API Key or Secret Key missing. Please configure Steadfast credentials in Store Settings.",
                };
            }
            const url = `${creds.baseUrl}/create_order`;
            try {
                const response = yield axios_1.default.post(url, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Key": creds.apiKey,
                        "Secret-Key": creds.secretKey,
                    },
                });
                const data = response.data;
                const trackingCode = ((_a = data === null || data === void 0 ? void 0 : data.consignment) === null || _a === void 0 ? void 0 : _a.tracking_code) || (data === null || data === void 0 ? void 0 : data.tracking_code) || null;
                const consignmentId = ((_b = data === null || data === void 0 ? void 0 : data.consignment) === null || _b === void 0 ? void 0 : _b.consignment_id) ? String(data.consignment.consignment_id) : trackingCode;
                const isSuccess = (data === null || data === void 0 ? void 0 : data.status) === 200 || (data === null || data === void 0 ? void 0 : data.status) === "success" || Boolean(trackingCode);
                if (!isSuccess || !trackingCode) {
                    return {
                        success: false,
                        message: formatSteadfastError(data, "Steadfast rejected parcel creation"),
                        error: data,
                    };
                }
                return {
                    success: true,
                    data,
                    trackingCode: String(trackingCode),
                    consignmentId: String(consignmentId),
                };
            }
            catch (error) {
                const errRes = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data;
                return {
                    success: false,
                    message: formatSteadfastError(errRes, error.message || "Failed to create Steadfast parcel"),
                    error: errRes || error.message,
                };
            }
        });
    }
    /**
     * Track parcel by tracking code
     */
    static trackByTrackingCode(trackingCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const creds = yield this.getCredentials();
            const url = `${creds.baseUrl}/status_by_trackingcode/${trackingCode}`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Key": creds.apiKey,
                        "Secret-Key": creds.secretKey,
                    },
                });
                return response.data;
            }
            catch (error) {
                return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || null;
            }
        });
    }
    /**
     * Track parcel by invoice ID
     */
    static trackByInvoice(invoice) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const creds = yield this.getCredentials();
            const url = `${creds.baseUrl}/status_by_invoice/${invoice}`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Key": creds.apiKey,
                        "Secret-Key": creds.secretKey,
                    },
                });
                return response.data;
            }
            catch (error) {
                return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || null;
            }
        });
    }
    /**
     * Check current Steadfast balance
     */
    static getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const creds = yield this.getCredentials();
            const url = `${creds.baseUrl}/get_balance`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Key": creds.apiKey,
                        "Secret-Key": creds.secretKey,
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
exports.SteadfastService = SteadfastService;
