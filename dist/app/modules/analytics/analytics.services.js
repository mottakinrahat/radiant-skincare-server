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
exports.AnalyticsServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const getDateFilterBounds = (filter) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    if (filter.startDate || filter.endDate) {
        return {
            start: filter.startDate ? new Date(filter.startDate) : undefined,
            end: filter.endDate ? new Date(filter.endDate) : undefined,
        };
    }
    switch (filter.timeRange) {
        case "today":
            return { start: todayStart, end: todayEnd };
        case "yesterday": {
            const yStart = new Date(todayStart);
            yStart.setDate(yStart.getDate() - 1);
            const yEnd = new Date(todayEnd);
            yEnd.setDate(yEnd.getDate() - 1);
            return { start: yStart, end: yEnd };
        }
        case "last7days": {
            const d7 = new Date(todayStart);
            d7.setDate(d7.getDate() - 6);
            return { start: d7, end: todayEnd };
        }
        case "last30days": {
            const d30 = new Date(todayStart);
            d30.setDate(d30.getDate() - 29);
            return { start: d30, end: todayEnd };
        }
        case "thisMonth": {
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            return { start: mStart, end: todayEnd };
        }
        default:
            return {};
    }
};
/**
 * Track an analytics event (search, view, cart, checkout, abandoned cart, purchase)
 */
const trackEvent = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    let targetProductId = payload.productId;
    if (targetProductId) {
        const product = yield prisma_1.default.product.findFirst({
            where: {
                OR: [{ id: targetProductId }, { slug: targetProductId }],
            },
            select: { id: true },
        });
        if (product) {
            targetProductId = product.id;
        }
    }
    if (!targetProductId && payload.eventType !== "SEARCH") {
        const firstP = yield prisma_1.default.product.findFirst({ select: { id: true } });
        if (firstP)
            targetProductId = firstP.id;
    }
    if (targetProductId) {
        yield prisma_1.default.productAnalyticsEvent.create({
            data: {
                productId: targetProductId,
                eventType: payload.eventType,
                visitorId: payload.visitorId || null,
                sessionId: payload.sessionId || null,
                searchQuery: payload.searchQuery || null,
                metadata: payload.metadata || undefined,
            },
        });
    }
    return { success: true };
});
/**
 * Get Overall High-Level Dashboard Analytics with Funnel & Daily Timeline
 */
const getAnalyticsOverview = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end } = getDateFilterBounds(filter);
    const eventWhere = {};
    if (start || end) {
        eventWhere.createdAt = {};
        if (start)
            eventWhere.createdAt.gte = start;
        if (end)
            eventWhere.createdAt.lte = end;
    }
    if (filter.productId) {
        eventWhere.productId = filter.productId;
    }
    // 1. Query all matching analytics events
    const events = yield prisma_1.default.productAnalyticsEvent.findMany({
        where: eventWhere,
        select: {
            eventType: true,
            visitorId: true,
            createdAt: true,
            productId: true,
        },
    });
    // 2. Query actual confirmed orders in the date range
    const orderWhere = {
        status: { not: "CANCELLED" },
    };
    if (start || end) {
        orderWhere.createdAt = {};
        if (start)
            orderWhere.createdAt.gte = start;
        if (end)
            orderWhere.createdAt.lte = end;
    }
    const orders = yield prisma_1.default.order.findMany({
        where: orderWhere,
        select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            items: {
                select: {
                    productId: true,
                    quantity: true,
                    price: true,
                },
            },
        },
    });
    // 3. Query Abandoned Carts in date range
    const abandonedWhere = {
        status: "ABANDONED",
    };
    if (start || end) {
        abandonedWhere.createdAt = {};
        if (start)
            abandonedWhere.createdAt.gte = start;
        if (end)
            abandonedWhere.createdAt.lte = end;
    }
    const abandonedCartCount = yield prisma_1.default.abandonedCart.count({
        where: abandonedWhere,
    });
    let totalViews = 0;
    let totalSearches = 0;
    let totalAddToCart = 0;
    let totalCheckoutInitiated = 0;
    const uniqueVisitorSet = new Set();
    const dailyMap = new Map();
    events.forEach((evt) => {
        const dStr = evt.createdAt.toISOString().split("T")[0];
        if (!dailyMap.has(dStr)) {
            dailyMap.set(dStr, {
                date: dStr,
                views: 0,
                uniqueVisitorsSet: new Set(),
                searches: 0,
                addToCart: 0,
                checkoutInitiated: 0,
                purchases: 0,
                revenue: 0,
            });
        }
        const day = dailyMap.get(dStr);
        switch (evt.eventType) {
            case "VIEW":
                totalViews++;
                day.views++;
                if (evt.visitorId) {
                    uniqueVisitorSet.add(evt.visitorId);
                    day.uniqueVisitorsSet.add(evt.visitorId);
                }
                break;
            case "SEARCH":
                totalSearches++;
                day.searches++;
                break;
            case "ADD_TO_CART":
                totalAddToCart++;
                day.addToCart++;
                break;
            case "INITIATE_CHECKOUT":
                totalCheckoutInitiated++;
                day.checkoutInitiated++;
                break;
        }
    });
    // Tally Purchases & Revenue from actual Orders
    let totalPurchases = orders.length;
    let totalRevenue = 0;
    orders.forEach((ord) => {
        const rev = ord.totalAmount || 0;
        totalRevenue += rev;
        const dStr = ord.createdAt.toISOString().split("T")[0];
        if (!dailyMap.has(dStr)) {
            dailyMap.set(dStr, {
                date: dStr,
                views: 0,
                uniqueVisitorsSet: new Set(),
                searches: 0,
                addToCart: 0,
                checkoutInitiated: 0,
                purchases: 0,
                revenue: 0,
            });
        }
        const day = dailyMap.get(dStr);
        day.purchases++;
        day.revenue += rev;
    });
    const uniqueVisitors = uniqueVisitorSet.size > 0 ? Math.min(uniqueVisitorSet.size, totalViews) : totalViews;
    // Funnel calculations with safe boundaries
    const searchToViewRate = totalSearches > 0 ? Math.min(100, Math.round((totalViews / totalSearches) * 1000) / 10) : 0;
    const viewToCartRate = totalViews > 0 ? Math.min(100, Math.round((totalAddToCart / totalViews) * 1000) / 10) : 0;
    const cartToCheckoutRate = totalAddToCart > 0 ? Math.min(100, Math.round((totalCheckoutInitiated / totalAddToCart) * 1000) / 10) : 0;
    const checkoutToPurchaseRate = totalCheckoutInitiated > 0
        ? Math.min(100, Math.round((totalPurchases / totalCheckoutInitiated) * 1000) / 10)
        : 0;
    const conversionRate = totalViews > 0 ? Math.min(100, Math.round((totalPurchases / totalViews) * 1000) / 10) : 0;
    const dailyTimeline = Array.from(dailyMap.values())
        .map((item) => ({
        date: item.date,
        views: item.views,
        uniqueVisitors: item.uniqueVisitorsSet.size > 0 ? item.uniqueVisitorsSet.size : item.views,
        searches: item.searches,
        addToCart: item.addToCart,
        checkoutInitiated: item.checkoutInitiated,
        purchases: item.purchases,
        revenue: item.revenue,
    }))
        .sort((a, b) => a.date.localeCompare(b.date));
    return {
        totalViews,
        uniqueVisitors,
        totalSearches,
        totalAddToCart,
        totalCheckoutInitiated,
        totalAbandonedCarts: abandonedCartCount,
        totalPurchases,
        conversionRate,
        totalRevenue,
        funnel: {
            searches: totalSearches,
            views: totalViews,
            addToCart: totalAddToCart,
            checkoutInitiated: totalCheckoutInitiated,
            purchases: totalPurchases,
            searchToViewRate,
            viewToCartRate,
            cartToCheckoutRate,
            checkoutToPurchaseRate,
        },
        dailyTimeline,
    };
});
/**
 * Get Product-wise Analytics Table Data with Search & Pagination
 */
const getProductAnalyticsList = (filter_1, ...args_1) => __awaiter(void 0, [filter_1, ...args_1], void 0, function* (filter, options = {}) {
    const { start, end } = getDateFilterBounds(filter);
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const productWhere = {};
    if (filter.searchTerm) {
        productWhere.OR = [
            { name: { contains: filter.searchTerm, mode: "insensitive" } },
            { slug: { contains: filter.searchTerm, mode: "insensitive" } },
            { productSerial: { contains: filter.searchTerm, mode: "insensitive" } },
        ];
    }
    const products = yield prisma_1.default.product.findMany({
        where: productWhere,
        include: {
            images: true,
            category: true,
        },
    });
    const eventWhere = {};
    if (start || end) {
        eventWhere.createdAt = {};
        if (start)
            eventWhere.createdAt.gte = start;
        if (end)
            eventWhere.createdAt.lte = end;
    }
    const events = yield prisma_1.default.productAnalyticsEvent.findMany({
        where: eventWhere,
        select: {
            productId: true,
            eventType: true,
            visitorId: true,
        },
    });
    const orderWhere = {
        status: { not: "CANCELLED" },
    };
    if (start || end) {
        orderWhere.createdAt = {};
        if (start)
            orderWhere.createdAt.gte = start;
        if (end)
            orderWhere.createdAt.lte = end;
    }
    const orders = yield prisma_1.default.order.findMany({
        where: orderWhere,
        select: {
            id: true,
            items: {
                select: {
                    productId: true,
                    quantity: true,
                    price: true,
                },
            },
        },
    });
    const abandonedCarts = yield prisma_1.default.abandonedCart.findMany({
        where: { status: "ABANDONED" },
        select: { items: true },
    });
    const statsByProduct = new Map();
    events.forEach((evt) => {
        if (!evt.productId)
            return;
        if (!statsByProduct.has(evt.productId)) {
            statsByProduct.set(evt.productId, {
                searches: 0,
                views: 0,
                uniqueVisitorsSet: new Set(),
                addToCart: 0,
                checkout: 0,
                abandoned: 0,
                purchases: 0,
                revenue: 0,
            });
        }
        const stat = statsByProduct.get(evt.productId);
        switch (evt.eventType) {
            case "SEARCH":
                stat.searches++;
                break;
            case "VIEW":
                stat.views++;
                if (evt.visitorId)
                    stat.uniqueVisitorsSet.add(evt.visitorId);
                break;
            case "ADD_TO_CART":
                stat.addToCart++;
                break;
            case "INITIATE_CHECKOUT":
                stat.checkout++;
                break;
            case "ABANDONED_CART":
                stat.abandoned++;
                break;
        }
    });
    orders.forEach((ord) => {
        var _a;
        (_a = ord.items) === null || _a === void 0 ? void 0 : _a.forEach((item) => {
            if (!statsByProduct.has(item.productId)) {
                statsByProduct.set(item.productId, {
                    searches: 0,
                    views: 0,
                    uniqueVisitorsSet: new Set(),
                    addToCart: 0,
                    checkout: 0,
                    abandoned: 0,
                    purchases: 0,
                    revenue: 0,
                });
            }
            const stat = statsByProduct.get(item.productId);
            stat.purchases += 1;
            stat.revenue += (item.price || 0) * (item.quantity || 1);
        });
    });
    abandonedCarts.forEach((cart) => {
        const items = cart.items;
        if (Array.isArray(items)) {
            items.forEach((item) => {
                var _a;
                const pId = item.productId || ((_a = item.product) === null || _a === void 0 ? void 0 : _a.id) || item.id;
                if (pId && statsByProduct.has(pId)) {
                    statsByProduct.get(pId).abandoned++;
                }
            });
        }
    });
    const rows = products.map((prod) => {
        var _a, _b, _c;
        const stat = statsByProduct.get(prod.id) || {
            searches: 0,
            views: 0,
            uniqueVisitorsSet: new Set(),
            addToCart: 0,
            checkout: 0,
            abandoned: 0,
            purchases: 0,
            revenue: 0,
        };
        const views = stat.views;
        const purchases = stat.purchases;
        const conversionRate = views > 0 ? Math.min(100, Math.round((purchases / views) * 1000) / 10) : 0;
        const uniqueVisitors = stat.uniqueVisitorsSet.size > 0 ? Math.min(stat.uniqueVisitorsSet.size, views) : views;
        return {
            productId: prod.id,
            productName: prod.name,
            slug: prod.slug,
            sku: prod.productSerial || undefined,
            imageUrl: ((_b = (_a = prod.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || "/img-3.png",
            categoryName: ((_c = prod.category) === null || _c === void 0 ? void 0 : _c.categoryName) || "Skincare",
            sellingPrice: prod.sellingPrice || prod.regularPrice || 0,
            searches: stat.searches,
            totalViews: views,
            uniqueVisitors,
            addToCart: stat.addToCart,
            checkoutInitiated: stat.checkout,
            abandonedCarts: stat.abandoned,
            purchases,
            revenue: stat.revenue,
            conversionRate,
        };
    });
    const sortBy = options.sortBy || "totalViews";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    rows.sort((a, b) => {
        var _a, _b;
        const aVal = (_a = a[sortBy]) !== null && _a !== void 0 ? _a : 0;
        const bVal = (_b = b[sortBy]) !== null && _b !== void 0 ? _b : 0;
        if (typeof aVal === "string") {
            return aVal.localeCompare(bVal) * sortOrder;
        }
        return (aVal - bVal) * sortOrder;
    });
    const total = rows.length;
    const paginatedData = rows.slice((page - 1) * limit, page * limit);
    return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        data: paginatedData,
    };
});
/**
 * Get Comprehensive Detailed Analytics & Funnel for a Single Product
 */
const getSingleProductAnalytics = (productId, filter) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const product = yield prisma_1.default.product.findFirst({
        where: {
            OR: [{ id: productId }, { slug: productId }],
        },
        include: {
            images: true,
            category: true,
        },
    });
    if (!product) {
        throw new Error("Product not found");
    }
    const { start, end } = getDateFilterBounds(filter);
    const eventWhere = { productId: product.id };
    if (start || end) {
        eventWhere.createdAt = {};
        if (start)
            eventWhere.createdAt.gte = start;
        if (end)
            eventWhere.createdAt.lte = end;
    }
    const events = yield prisma_1.default.productAnalyticsEvent.findMany({
        where: eventWhere,
        orderBy: { createdAt: "asc" },
    });
    let views = 0;
    let searches = 0;
    let addToCart = 0;
    let checkout = 0;
    let abandoned = 0;
    const uniqueVisitorSet = new Set();
    events.forEach((evt) => {
        switch (evt.eventType) {
            case "VIEW":
                views++;
                if (evt.visitorId)
                    uniqueVisitorSet.add(evt.visitorId);
                break;
            case "SEARCH":
                searches++;
                break;
            case "ADD_TO_CART":
                addToCart++;
                break;
            case "INITIATE_CHECKOUT":
                checkout++;
                break;
            case "ABANDONED_CART":
                abandoned++;
                break;
        }
    });
    const orderWhere = {
        status: { not: "CANCELLED" },
        items: {
            some: { productId: product.id },
        },
    };
    if (start || end) {
        orderWhere.createdAt = {};
        if (start)
            orderWhere.createdAt.gte = start;
        if (end)
            orderWhere.createdAt.lte = end;
    }
    const orders = yield prisma_1.default.order.findMany({
        where: orderWhere,
        include: {
            items: {
                where: { productId: product.id },
            },
        },
    });
    let purchases = orders.length;
    let revenue = 0;
    orders.forEach((ord) => {
        var _a;
        (_a = ord.items) === null || _a === void 0 ? void 0 : _a.forEach((item) => {
            revenue += (item.price || product.sellingPrice || 0) * (item.quantity || 1);
        });
    });
    const uniqueVisitors = uniqueVisitorSet.size > 0 ? Math.min(uniqueVisitorSet.size, views) : views;
    const conversionRate = views > 0 ? Math.min(100, Math.round((purchases / views) * 1000) / 10) : 0;
    const searchToViewRate = searches > 0 ? Math.min(100, Math.round((views / searches) * 1000) / 10) : 0;
    const viewToCartRate = views > 0 ? Math.min(100, Math.round((addToCart / views) * 1000) / 10) : 0;
    const cartToCheckoutRate = addToCart > 0 ? Math.min(100, Math.round((checkout / addToCart) * 1000) / 10) : 0;
    const checkoutToPurchaseRate = checkout > 0 ? Math.min(100, Math.round((purchases / checkout) * 1000) / 10) : 0;
    return {
        product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.productSerial,
            imageUrl: ((_b = (_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || "/img-3.png",
            price: product.sellingPrice || product.regularPrice || 0,
            stock: product.stock,
            category: ((_c = product.category) === null || _c === void 0 ? void 0 : _c.categoryName) || "Skincare",
        },
        metrics: {
            searches,
            views,
            uniqueVisitors,
            addToCart,
            checkout,
            abandoned,
            purchases,
            revenue,
            conversionRate,
        },
        funnel: {
            searches,
            views,
            addToCart,
            checkout,
            purchases,
            searchToViewRate,
            viewToCartRate,
            cartToCheckoutRate,
            checkoutToPurchaseRate,
        },
    };
});
/**
 * Get Top Search Queries and clicked products
 */
const getTopSearchQueries = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end } = getDateFilterBounds(filter);
    const where = { eventType: "SEARCH", searchQuery: { not: null } };
    if (start || end) {
        where.createdAt = {};
        if (start)
            where.createdAt.gte = start;
        if (end)
            where.createdAt.lte = end;
    }
    const searchEvents = yield prisma_1.default.productAnalyticsEvent.findMany({
        where,
        select: {
            searchQuery: true,
            productId: true,
            createdAt: true,
            product: {
                select: { name: true, slug: true },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    const queryMap = new Map();
    searchEvents.forEach((evt) => {
        var _a, _b;
        const q = (_a = evt.searchQuery) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
        if (!q)
            return;
        if (!queryMap.has(q)) {
            queryMap.set(q, {
                query: q,
                count: 0,
                lastSearched: evt.createdAt,
                topProduct: (_b = evt.product) === null || _b === void 0 ? void 0 : _b.name,
            });
        }
        const item = queryMap.get(q);
        item.count++;
    });
    return Array.from(queryMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
});
/**
 * Get Detailed Abandoned Carts with Customer Contact & Cart Items
 */
const getAbandonedCartsList = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end } = getDateFilterBounds(filter);
    const where = {};
    if (start || end) {
        where.createdAt = {};
        if (start)
            where.createdAt.gte = start;
        if (end)
            where.createdAt.lte = end;
    }
    if (filter.status && filter.status !== "ALL") {
        where.status = filter.status;
    }
    const carts = yield prisma_1.default.abandonedCart.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    return carts.map((c) => ({
        id: c.id,
        customerName: c.customerName || "Guest Customer",
        customerPhone: c.customerPhone,
        customerEmail: c.customerEmail || undefined,
        district: c.district || undefined,
        items: Array.isArray(c.items) ? c.items : [],
        totalAmount: c.totalAmount || 0,
        status: c.status || "ABANDONED",
        followUpNote: c.followUpNote || undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }));
});
exports.AnalyticsServices = {
    trackEvent,
    getAnalyticsOverview,
    getProductAnalyticsList,
    getSingleProductAnalytics,
    getTopSearchQueries,
    getAbandonedCartsList,
};
