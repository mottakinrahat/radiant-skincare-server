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
exports.AbandonedCartServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const landingPage_services_1 = require("../landingPage/landingPage.services");
const extractProductIdFromItems = (items) => {
    var _a;
    try {
        const itemsArr = Array.isArray(items) ? items : [];
        const firstItem = itemsArr[0];
        if (!firstItem)
            return null;
        if (firstItem.productId && typeof firstItem.productId === "string")
            return firstItem.productId;
        if (((_a = firstItem.product) === null || _a === void 0 ? void 0 : _a.id) && typeof firstItem.product.id === "string")
            return firstItem.product.id;
        if (typeof firstItem.id === "string") {
            const parts = firstItem.id.split("-");
            if (parts.length >= 5) {
                return parts.slice(0, 5).join("-");
            }
            return firstItem.id;
        }
    }
    catch (_) { }
    return null;
};
const createOrUpdateAbandonedCartInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, customerName, customerPhone, customerEmail, district, items, totalAmount, status, followUpNote } = payload;
    const phoneToUse = (customerPhone && typeof customerPhone === "string" && customerPhone.trim())
        ? customerPhone.trim()
        : "Guest (Pending Phone)";
    // Match existing ONLY by draft ID, or by phone if updated in last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = yield prisma_1.default.abandonedCart.findFirst({
        where: {
            OR: [
                { id: id || "invalid_id" },
                ...(phoneToUse !== "Guest (Pending Phone)"
                    ? [{ customerPhone: phoneToUse, updatedAt: { gte: thirtyMinsAgo } }]
                    : []),
            ],
        },
    });
    const productId = extractProductIdFromItems(items);
    if (existing) {
        return yield prisma_1.default.abandonedCart.update({
            where: { id: existing.id },
            data: {
                customerName: customerName || existing.customerName,
                customerPhone: phoneToUse !== "Guest (Pending Phone)" ? phoneToUse : existing.customerPhone,
                customerEmail: customerEmail || existing.customerEmail,
                district: district || existing.district,
                items: items ? JSON.parse(JSON.stringify(items)) : existing.items,
                totalAmount: totalAmount !== null && totalAmount !== void 0 ? totalAmount : existing.totalAmount,
                status: status || existing.status,
                followUpNote: followUpNote !== undefined ? followUpNote : existing.followUpNote,
            },
        });
    }
    // Brand new abandoned cart
    const newCart = yield prisma_1.default.abandonedCart.create({
        data: {
            id: id || undefined,
            customerName: customerName || "Guest Customer",
            customerPhone: phoneToUse,
            customerEmail: customerEmail || null,
            district: district || null,
            items: items ? JSON.parse(JSON.stringify(items)) : [],
            totalAmount: totalAmount || 0,
            status: status || "ABANDONED",
            followUpNote: followUpNote || null,
        },
    });
    if (productId) {
        landingPage_services_1.LandingPageServices.trackAbandonedCart(productId).catch(() => { });
    }
    return newCart;
});
const getAbandonedCartsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.abandonedCart.findMany({
        orderBy: { updatedAt: "desc" },
    });
});
const convertAbandonedCartInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { draftId, phone } = payload;
    const match = yield prisma_1.default.abandonedCart.findFirst({
        where: {
            OR: [
                { id: draftId || "invalid_id" },
                { customerPhone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || "invalid_phone" },
            ],
        },
    });
    if (match) {
        return yield prisma_1.default.abandonedCart.update({
            where: { id: match.id },
            data: { status: "CONVERTED" },
        });
    }
    return null;
});
const updateStatusInDB = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.abandonedCart.update({
        where: { id },
        data: { status },
    });
});
const updateFollowUpNoteInDB = (id, followUpNote) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.abandonedCart.update({
        where: { id },
        data: { followUpNote },
    });
});
const deleteAbandonedCartFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.abandonedCart.delete({
        where: { id },
    });
});
exports.AbandonedCartServices = {
    createOrUpdateAbandonedCartInDB,
    getAbandonedCartsFromDB,
    convertAbandonedCartInDB,
    updateStatusInDB,
    updateFollowUpNoteInDB,
    deleteAbandonedCartFromDB,
};
