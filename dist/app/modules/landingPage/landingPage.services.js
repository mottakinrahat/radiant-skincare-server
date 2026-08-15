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
exports.LandingPageServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const upsertLandingPage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield prisma_1.default.product.findUnique({
        where: { id: payload.productId },
    });
    if (!product) {
        throw new Error("Product not found");
    }
    // Generate clean slug if not provided
    let slug = (_a = payload.slug) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!slug) {
        slug = `${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-lp`;
    }
    // Ensure unique slug if different landing page uses it
    const existingWithSlug = yield prisma_1.default.landingPage.findFirst({
        where: {
            slug,
            NOT: { productId: payload.productId },
        },
    });
    if (existingWithSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    const existingLanding = yield prisma_1.default.landingPage.findUnique({
        where: { productId: payload.productId },
    });
    if (existingLanding) {
        return yield prisma_1.default.landingPage.update({
            where: { productId: payload.productId },
            data: {
                slug,
                title: payload.title || product.name,
                headline: payload.headline || null,
                subheadline: payload.subheadline || null,
                videoUrl: payload.videoUrl || null,
                features: payload.features || [],
                customPrice: payload.customPrice || null,
                discountText: payload.discountText || null,
                isActive: payload.isActive !== undefined ? payload.isActive : true,
            },
            include: {
                product: {
                    include: {
                        images: true,
                        variantCombinations: {
                            include: { options: { include: { option: true } } },
                        },
                    },
                },
            },
        });
    }
    return yield prisma_1.default.landingPage.create({
        data: {
            productId: payload.productId,
            slug,
            title: payload.title || product.name,
            headline: payload.headline || null,
            subheadline: payload.subheadline || null,
            videoUrl: payload.videoUrl || null,
            features: payload.features || [],
            customPrice: payload.customPrice || null,
            discountText: payload.discountText || null,
            isActive: payload.isActive !== undefined ? payload.isActive : true,
        },
        include: {
            product: {
                include: {
                    images: true,
                    variantCombinations: {
                        include: { options: { include: { option: true } } },
                    },
                },
            },
        },
    });
});
const getLandingPageBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const landing = yield prisma_1.default.landingPage.findFirst({
        where: {
            OR: [{ slug }, { productId: slug }],
        },
        include: {
            product: {
                include: {
                    images: true,
                    details: true,
                    variants: {
                        include: { options: true },
                    },
                    variantCombinations: {
                        include: { options: { include: { option: true } } },
                    },
                },
            },
        },
    });
    if (!landing || (!landing.isActive && !landing.product)) {
        throw new Error("Landing page not found or inactive");
    }
    // Increment views count non-blockingly
    prisma_1.default.landingPage
        .update({
        where: { id: landing.id },
        data: { viewsCount: { increment: 1 } },
    })
        .catch(() => { });
    return landing;
});
const getAllLandingPages = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.landingPage.findMany({
        include: {
            product: {
                include: {
                    images: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
const deleteLandingPage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.landingPage.delete({
        where: { id },
    });
});
// ─── Analytics Tracking ────────────────────────────────────────────────────
const trackCheckoutClick = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const landing = yield prisma_1.default.landingPage.findUnique({
        where: { productId },
        select: { id: true },
    });
    if (!landing)
        return;
    yield prisma_1.default.landingPage.update({
        where: { id: landing.id },
        data: { checkoutClicks: { increment: 1 } },
    });
});
const trackAbandonedCart = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const landing = yield prisma_1.default.landingPage.findUnique({
        where: { productId },
        select: { id: true },
    });
    if (!landing)
        return;
    yield prisma_1.default.landingPage.update({
        where: { id: landing.id },
        data: { abandonedCartCount: { increment: 1 } },
    });
});
const trackPurchase = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const landing = yield prisma_1.default.landingPage.findUnique({
        where: { productId },
        select: { id: true },
    });
    if (!landing)
        return;
    yield prisma_1.default.landingPage.update({
        where: { id: landing.id },
        data: { ordersCount: { increment: 1 } },
    });
});
const getLandingPageStatsByProductId = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const landing = yield prisma_1.default.landingPage.findUnique({
        where: { productId },
        select: {
            id: true,
            slug: true,
            viewsCount: true,
            checkoutClicks: true,
            abandonedCartCount: true,
            ordersCount: true,
            isActive: true,
        },
    });
    return landing || null;
});
exports.LandingPageServices = {
    upsertLandingPage,
    getLandingPageBySlug,
    getAllLandingPages,
    deleteLandingPage,
    trackCheckoutClick,
    trackAbandonedCart,
    trackPurchase,
    getLandingPageStatsByProductId,
};
