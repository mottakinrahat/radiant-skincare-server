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
exports.InventoryServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const http_status_1 = __importDefault(require("http-status"));
const getAllInventory = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield prisma_1.default.product.findMany({
        include: {
            category: true,
            brand: true,
            images: { orderBy: { sortOrder: "asc" } },
            variantCombinations: {
                include: {
                    options: {
                        include: {
                            option: {
                                include: {
                                    variant: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const rows = [];
    products.forEach((p) => {
        var _a, _b, _c, _d, _e;
        const primaryImg = ((_b = (_a = p.images) === null || _a === void 0 ? void 0 : _a.find((img) => img.isPrimary)) === null || _b === void 0 ? void 0 : _b.url) || ((_d = (_c = p.images) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) || "/img-3.png";
        const catName = ((_e = p.category) === null || _e === void 0 ? void 0 : _e.categoryName) || "Uncategorized";
        if (p.variantCombinations && p.variantCombinations.length > 0) {
            p.variantCombinations.forEach((combo) => {
                var _a;
                const optNames = (_a = combo.options) === null || _a === void 0 ? void 0 : _a.map((o) => { var _a; return (_a = o.option) === null || _a === void 0 ? void 0 : _a.value; }).filter(Boolean).join(" / ");
                const stockQty = typeof combo.quantity === "number" ? combo.quantity : 0;
                rows.push({
                    id: `${p.id}_${combo.id}`,
                    productId: p.id,
                    productName: p.name,
                    productSlug: p.slug,
                    productSerial: p.productSerial,
                    categoryName: catName,
                    imageUrl: combo.imageId || primaryImg,
                    variantId: combo.id,
                    variantTitle: optNames || combo.sku,
                    stockMode: "VARIANT_LEVEL",
                    sku: combo.sku || `SKU-${p.id.slice(0, 6)}`,
                    price: combo.finalPrice || p.sellingPrice || p.regularPrice || 0,
                    regularPrice: p.regularPrice,
                    sellingPrice: combo.finalPrice || p.sellingPrice,
                    buyingPrice: p.buyingPrice,
                    stock: stockQty,
                    stockStatus: stockQty === 0 ? "OUT_OF_STOCK" : stockQty <= 5 ? "LOW_STOCK" : "IN_STOCK",
                    soldCount: p.initialSoldCount || 0,
                    updatedAt: combo.updatedAt,
                });
            });
        }
        else {
            const stockQty = typeof p.stock === "number" ? p.stock : 0;
            rows.push({
                id: p.id,
                productId: p.id,
                productName: p.name,
                productSlug: p.slug,
                productSerial: p.productSerial,
                categoryName: catName,
                imageUrl: primaryImg,
                variantId: null,
                variantTitle: null,
                stockMode: "PRODUCT_LEVEL",
                sku: p.productSerial || `SKU-${p.id.slice(0, 6)}`,
                price: p.sellingPrice || p.regularPrice || 0,
                regularPrice: p.regularPrice,
                sellingPrice: p.sellingPrice,
                buyingPrice: p.buyingPrice,
                stock: stockQty,
                stockStatus: stockQty === 0 ? "OUT_OF_STOCK" : stockQty <= 5 ? "LOW_STOCK" : "IN_STOCK",
                soldCount: p.initialSoldCount || 0,
                updatedAt: p.updatedAt,
            });
        }
    });
    return rows;
});
const adjustStock = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId, quantity, changeType, source = "MANUAL_ADD", referenceId, note } = payload;
    if (!productId) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Product ID is required for stock adjustment");
    }
    if (typeof quantity !== "number") {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Valid quantity is required");
    }
    let product = yield prisma_1.default.product.findFirst({
        where: {
            OR: [
                { id: productId },
                { slug: productId },
                { name: { contains: productId, mode: "insensitive" } },
            ],
        },
    });
    if (!product) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, `Product not found: ${productId}`);
    }
    const actualProductId = product.id;
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        let previousStock = 0;
        let newStock = 0;
        let delta = 0;
        if (variantId) {
            const variant = yield tx.productVariantCombination.findUnique({
                where: { id: variantId },
            });
            if (!variant) {
                throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Variant combination not found");
            }
            previousStock = variant.quantity || 0;
            if (changeType === "ADD" || changeType === "RESTORE") {
                delta = Math.abs(quantity);
                newStock = previousStock + delta;
            }
            else if (changeType === "DEDUCT") {
                delta = -Math.abs(quantity);
                newStock = Math.max(0, previousStock - Math.abs(quantity));
            }
            else if (changeType === "ADJUST") {
                newStock = Math.max(0, quantity);
                delta = newStock - previousStock;
            }
            yield tx.productVariantCombination.update({
                where: { id: variantId },
                data: {
                    quantity: newStock,
                    status: newStock > 0 ? "ACTIVE" : variant.status,
                },
            });
        }
        else {
            previousStock = product.stock || 0;
            if (changeType === "ADD" || changeType === "RESTORE") {
                delta = Math.abs(quantity);
                newStock = previousStock + delta;
            }
            else if (changeType === "DEDUCT") {
                delta = -Math.abs(quantity);
                newStock = Math.max(0, previousStock - Math.abs(quantity));
            }
            else if (changeType === "ADJUST") {
                newStock = Math.max(0, quantity);
                delta = newStock - previousStock;
            }
            yield tx.product.update({
                where: { id: actualProductId },
                data: {
                    stock: newStock,
                },
            });
        }
        const movement = yield tx.stockMovement.create({
            data: {
                productId: actualProductId,
                variantId: variantId || null,
                changeType: changeType,
                quantity: Math.abs(delta),
                previousStock,
                newStock,
                source: source,
                referenceId: referenceId || null,
                note: note || (delta >= 0 ? `+${delta} items added` : `${delta} items deducted`),
            },
        });
        return {
            productId: actualProductId,
            productName: product.name,
            variantId,
            previousStock,
            newStock,
            delta,
            movement,
        };
    }));
});
const getStockHistory = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, limit = 100, page = 1 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const whereClause = {};
    if (productId) {
        whereClause.productId = productId;
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.stockMovement.count({ where: whereClause }),
        prisma_1.default.stockMovement.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        sellingPrice: true,
                        images: { take: 1, select: { url: true } },
                    },
                },
                variant: {
                    select: {
                        id: true,
                        sku: true,
                        finalPrice: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: Number(limit),
            skip,
        }),
    ]);
    return {
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        data: items,
    };
});
/**
 * Idempotently deduct stock for order placement/reshipment
 * Mathematical Net Deductions Guard: guarantees stock is deducted exactly once.
 */
const deductStockForOrder = (orderId_1, items_1, ...args_1) => __awaiter(void 0, [orderId_1, items_1, ...args_1], void 0, function* (orderId, items, source = "ORDER_PLACED") {
    if (!orderId || !items || items.length === 0)
        return;
    // Check net deductions balance for this order
    const existingMovements = yield prisma_1.default.stockMovement.findMany({
        where: { referenceId: orderId },
    });
    const totalDeductions = existingMovements.filter((m) => m.changeType === "DEDUCT").length;
    const totalRestores = existingMovements.filter((m) => m.changeType === "RESTORE").length;
    const netDeductions = totalDeductions - totalRestores;
    if (netDeductions > 0) {
        // Already currently deducted for this order, do NOT deduct again!
        console.log(`[Inventory] Skipping deductStockForOrder for order ${orderId}: already deducted.`);
        return;
    }
    for (const item of items) {
        try {
            const pId = item.productId;
            if (!pId)
                continue;
            const qty = Number(item.quantity) || 1;
            yield adjustStock({
                productId: pId,
                variantId: item.variantId,
                quantity: qty,
                changeType: "DEDUCT",
                source,
                referenceId: orderId,
                note: `Order #${orderId} item deduction (${source})`,
            });
        }
        catch (err) {
            console.warn(`[Inventory] Error deducting stock for order ${orderId}:`, err);
        }
    }
});
/**
 * Idempotently restore stock for order cancellation/refund
 * Mathematical Net Deductions Guard: guarantees stock is restored exactly once.
 */
const restoreStockForOrder = (orderId_1, items_1, ...args_1) => __awaiter(void 0, [orderId_1, items_1, ...args_1], void 0, function* (orderId, items, source = "ORDER_CANCELLED") {
    if (!orderId || !items || items.length === 0)
        return;
    const existingMovements = yield prisma_1.default.stockMovement.findMany({
        where: { referenceId: orderId },
    });
    const totalDeductions = existingMovements.filter((m) => m.changeType === "DEDUCT").length;
    const totalRestores = existingMovements.filter((m) => m.changeType === "RESTORE").length;
    const netDeductions = totalDeductions - totalRestores;
    if (netDeductions <= 0) {
        // Stock is currently NOT in a deducted state, nothing to restore!
        console.log(`[Inventory] Skipping restoreStockForOrder for order ${orderId}: net deductions is ${netDeductions}.`);
        return;
    }
    for (const item of items) {
        try {
            const pId = item.productId;
            if (!pId)
                continue;
            const qty = Number(item.quantity) || 1;
            yield adjustStock({
                productId: pId,
                variantId: item.variantId,
                quantity: qty,
                changeType: "RESTORE",
                source,
                referenceId: orderId,
                note: `Order #${orderId} stock restoration (${source})`,
            });
        }
        catch (err) {
            console.warn(`[Inventory] Error restoring stock for order ${orderId}:`, err);
        }
    }
});
exports.InventoryServices = {
    getAllInventory,
    adjustStock,
    getStockHistory,
    deductStockForOrder,
    restoreStockForOrder,
};
