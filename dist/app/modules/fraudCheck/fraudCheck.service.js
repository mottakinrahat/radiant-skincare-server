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
exports.FraudCheckService = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
class FraudCheckService {
    static cleanPhoneNumber(phone) {
        if (!phone)
            return "";
        let digits = phone.replace(/[^\d]/g, "");
        if (digits.startsWith("880") && digits.length === 13) {
            digits = digits.substring(2);
        }
        return digits;
    }
    static checkByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            let apiKey = process.env.FRAUD_BD_API_KEY;
            if (!apiKey) {
                try {
                    const settings = yield prisma_1.default.storeSettings.findUnique({ where: { id: "singleton" } });
                    if (settings === null || settings === void 0 ? void 0 : settings.fraudBdApiKey) {
                        apiKey = settings.fraudBdApiKey;
                    }
                }
                catch (_a) {
                    // ignore
                }
            }
            if (!apiKey) {
                apiKey = "1302e523911213bc507c3c6dd35ebdb908044b42982345012452ac8f86406cc9";
            }
            const baseUrl = process.env.FRAUD_BD_BASE_URL || "https://fraudbd.com";
            const cleanPhone = this.cleanPhoneNumber(phone);
            if (!cleanPhone || cleanPhone.length < 11) {
                return {
                    success: false,
                    phone,
                    totalParcels: 0,
                    totalDelivered: 0,
                    totalCancelled: 0,
                    successRate: 0,
                    riskLevel: "UNKNOWN",
                    couriers: {},
                    message: `Invalid Bangladeshi mobile number: "${phone}"`,
                };
            }
            try {
                const response = yield fetch(`${baseUrl}/api/check-courier-info`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        api_key: apiKey,
                    },
                    body: JSON.stringify({ phone_number: cleanPhone }),
                });
                const responseText = yield response.text();
                let resData = {};
                try {
                    resData = JSON.parse(responseText);
                }
                catch (_b) {
                    resData = { message: responseText };
                }
                if (!response.ok) {
                    console.warn("[FraudCheckService] FraudBD API warning:", resData);
                }
                // Parse data fields flexibly from FraudBD response
                const dataObj = (resData === null || resData === void 0 ? void 0 : resData.data) || (resData === null || resData === void 0 ? void 0 : resData.result) || resData || {};
                let totalDelivered = Number(dataObj.total_delivered || dataObj.delivered || dataObj.delivered_parcels || 0);
                let totalCancelled = Number(dataObj.total_cancelled || dataObj.cancelled || dataObj.returned || dataObj.cancelled_parcels || 0);
                let totalParcels = Number(dataObj.total_parcels || dataObj.total || totalDelivered + totalCancelled || 0);
                const courierMap = {};
                // If FraudBD provides courier-wise stats
                const rawCouriers = dataObj.couriers || dataObj.courier_details || dataObj.details || {};
                if (typeof rawCouriers === "object" && rawCouriers !== null) {
                    for (const [key, val] of Object.entries(rawCouriers)) {
                        const courierVal = val;
                        const del = Number((courierVal === null || courierVal === void 0 ? void 0 : courierVal.delivered) || (courierVal === null || courierVal === void 0 ? void 0 : courierVal.total_delivered) || 0);
                        const canc = Number((courierVal === null || courierVal === void 0 ? void 0 : courierVal.cancelled) || (courierVal === null || courierVal === void 0 ? void 0 : courierVal.total_cancelled) || (courierVal === null || courierVal === void 0 ? void 0 : courierVal.returned) || 0);
                        const tot = Number((courierVal === null || courierVal === void 0 ? void 0 : courierVal.total) || del + canc || 0);
                        const rate = tot > 0 ? Math.round((del / tot) * 100) : 0;
                        courierMap[key] = {
                            delivered: del,
                            cancelled: canc,
                            total: tot,
                            successRate: rate,
                        };
                    }
                }
                // If totalParcels is still 0 but sum of courierMap > 0
                const sumDelivered = Object.values(courierMap).reduce((acc, c) => acc + c.delivered, 0);
                const sumCancelled = Object.values(courierMap).reduce((acc, c) => acc + c.cancelled, 0);
                if (totalParcels === 0 && (sumDelivered > 0 || sumCancelled > 0)) {
                    totalDelivered = sumDelivered;
                    totalCancelled = sumCancelled;
                    totalParcels = sumDelivered + sumCancelled;
                }
                const successRate = totalParcels > 0 ? Math.round((totalDelivered / totalParcels) * 100) : 0;
                let riskLevel = "UNKNOWN";
                if (totalParcels > 0) {
                    if (successRate >= 80) {
                        riskLevel = "LOW_RISK";
                    }
                    else if (successRate >= 50) {
                        riskLevel = "MEDIUM_RISK";
                    }
                    else {
                        riskLevel = "HIGH_RISK";
                    }
                }
                return {
                    success: true,
                    phone: cleanPhone,
                    totalParcels,
                    totalDelivered,
                    totalCancelled,
                    successRate,
                    riskLevel,
                    couriers: courierMap,
                    rawResponse: resData,
                };
            }
            catch (error) {
                console.error("[FraudCheckService] Error querying FraudBD API:", error);
                return {
                    success: false,
                    phone: cleanPhone,
                    totalParcels: 0,
                    totalDelivered: 0,
                    totalCancelled: 0,
                    successRate: 0,
                    riskLevel: "UNKNOWN",
                    couriers: {},
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to query FraudBD API",
                };
            }
        });
    }
}
exports.FraudCheckService = FraudCheckService;
