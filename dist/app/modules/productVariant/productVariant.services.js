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
exports.ProductVariantServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const assertProductExists = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: { id: productId },
    });
    if (!product) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    return product;
});
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE (ProductVariant: e.g. Color, Size, Weight)
// ─────────────────────────────────────────────────────────────────────────────
const createVariantAttribute = (productId, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield assertProductExists(productId);
    const data = req.body;
    const result = yield prisma_1.default.productVariant.create({
        data: Object.assign({ productId, variantTitle: data.variantTitle, isRequired: (_a = data.isRequired) !== null && _a !== void 0 ? _a : false, sortOrder: (_b = data.sortOrder) !== null && _b !== void 0 ? _b : 0 }, (Array.isArray(data.options) && data.options.length > 0
            ? {
                options: {
                    create: data.options.map((opt, idx) => {
                        var _a, _b, _c, _d, _e;
                        return ({
                            value: opt.value,
                            priceAdjustment: Number((_a = opt.priceAdjustment) !== null && _a !== void 0 ? _a : 0),
                            quantity: Number((_d = (_c = (_b = opt.quantity) !== null && _b !== void 0 ? _b : opt.stock) !== null && _c !== void 0 ? _c : opt.stockQuantity) !== null && _d !== void 0 ? _d : 0),
                            sku: opt.sku || null,
                            status: opt.status || "ACTIVE",
                            sortOrder: (_e = opt.sortOrder) !== null && _e !== void 0 ? _e : idx + 1,
                        });
                    }),
                },
            }
            : {})),
        include: {
            options: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });
    return result;
});
const getVariantAttributesByProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    return prisma_1.default.productVariant.findMany({
        where: { productId },
        include: {
            options: {
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: { sortOrder: "asc" },
    });
});
const updateVariantAttribute = (productId, variantId, req) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    const data = req.body;
    const existing = yield prisma_1.default.productVariant.findFirst({
        where: { id: variantId, productId },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Variant attribute not found for this product");
    }
    return prisma_1.default.productVariant.update({
        where: { id: variantId },
        data: Object.assign(Object.assign(Object.assign({}, (data.variantTitle && { variantTitle: data.variantTitle })), (data.isRequired !== undefined && { isRequired: data.isRequired })), (data.sortOrder !== undefined && { sortOrder: data.sortOrder })),
        include: {
            options: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });
});
const deleteVariantAttribute = (productId, variantId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    const existing = yield prisma_1.default.productVariant.findFirst({
        where: { id: variantId, productId },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Variant attribute not found for this product");
    }
    const deleted = yield prisma_1.default.productVariant.delete({
        where: { id: variantId },
    });
    // Check remaining attributes — if fewer than 2, clean up combinations
    const remainingVariants = yield prisma_1.default.productVariant.findMany({
        where: { productId },
        include: { options: true },
    });
    const validRemaining = remainingVariants.filter((v) => v.options.length > 0);
    if (validRemaining.length === 0) {
        yield prisma_1.default.productVariantCombination.deleteMany({
            where: { productId },
        });
    }
    return deleted;
});
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION (ProductVariantOption: e.g. Red, Blue, XL)
// ─────────────────────────────────────────────────────────────────────────────
const addOptionToVariant = (productId, variantId, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    yield assertProductExists(productId);
    const data = req.body;
    const variant = yield prisma_1.default.productVariant.findFirst({
        where: { id: variantId, productId },
    });
    if (!variant) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Variant attribute not found for this product");
    }
    return prisma_1.default.productVariantOption.create({
        data: {
            variantId,
            value: data.value,
            priceAdjustment: Number((_a = data.priceAdjustment) !== null && _a !== void 0 ? _a : 0),
            quantity: Number((_d = (_c = (_b = data.quantity) !== null && _b !== void 0 ? _b : data.stock) !== null && _c !== void 0 ? _c : data.stockQuantity) !== null && _d !== void 0 ? _d : 0),
            sku: data.sku || null,
            status: data.status || "ACTIVE",
            sortOrder: (_e = data.sortOrder) !== null && _e !== void 0 ? _e : 0,
        },
    });
});
const updateOption = (productId, optionId, req) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    const data = req.body;
    const option = yield prisma_1.default.productVariantOption.findFirst({
        where: { id: optionId, variant: { productId } },
    });
    if (!option) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Option not found for this product");
    }
    const quantityToSet = data.quantity !== undefined
        ? Number(data.quantity)
        : data.stock !== undefined
            ? Number(data.stock)
            : data.stockQuantity !== undefined
                ? Number(data.stockQuantity)
                : undefined;
    return prisma_1.default.productVariantOption.update({
        where: { id: optionId },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.value && { value: data.value })), (data.priceAdjustment !== undefined && {
            priceAdjustment: Number(data.priceAdjustment),
        })), (quantityToSet !== undefined && {
            quantity: Math.max(0, quantityToSet),
        })), (data.sku !== undefined && { sku: data.sku || null })), (data.status !== undefined && { status: data.status })), (data.sortOrder !== undefined && { sortOrder: data.sortOrder })),
    });
});
const deleteOption = (productId, optionId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    const option = yield prisma_1.default.productVariantOption.findFirst({
        where: { id: optionId, variant: { productId } },
    });
    if (!option) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Option not found for this product");
    }
    const deleted = yield prisma_1.default.productVariantOption.delete({
        where: { id: optionId },
    });
    // Check remaining attributes — if fewer than 2 valid attributes remain, clean up combinations
    const remainingVariants = yield prisma_1.default.productVariant.findMany({
        where: { productId },
        include: { options: true },
    });
    const validRemaining = remainingVariants.filter((v) => v.options.length > 0);
    if (validRemaining.length === 0) {
        yield prisma_1.default.productVariantCombination.deleteMany({
            where: { productId },
        });
    }
    return deleted;
});
// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION (ProductVariantCombination: crossed Matrix SKU items)
// ─────────────────────────────────────────────────────────────────────────────
const getCombinationsByProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    return prisma_1.default.productVariantCombination.findMany({
        where: { productId },
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
        orderBy: { createdAt: "asc" },
    });
});
const createCombination = (productId, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const product = yield assertProductExists(productId);
    const { sku, quantity, finalPrice, imageId, status: combStatus, optionIds } = req.body;
    let calculatedPrice = finalPrice !== undefined ? Number(finalPrice) : 0;
    // Auto-calculate finalPrice if 0 or not provided
    if (!calculatedPrice && Array.isArray(optionIds) && optionIds.length > 0) {
        const selectedOptions = yield prisma_1.default.productVariantOption.findMany({
            where: { id: { in: optionIds } },
        });
        const priceAdjustmentsSum = selectedOptions.reduce((sum, opt) => sum + Number(opt.priceAdjustment || 0), 0);
        const baseProductPrice = (_b = (_a = product.sellingPrice) !== null && _a !== void 0 ? _a : product.buyingPrice) !== null && _b !== void 0 ? _b : 0;
        calculatedPrice = Math.max(0, baseProductPrice + priceAdjustmentsSum);
    }
    try {
        return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const combination = yield tx.productVariantCombination.create({
                data: Object.assign({ productId,
                    sku, quantity: Number(quantity !== null && quantity !== void 0 ? quantity : 0), finalPrice: calculatedPrice, imageId: imageId || null, status: combStatus || "ACTIVE" }, (Array.isArray(optionIds) && optionIds.length > 0
                    ? {
                        options: {
                            create: optionIds.map((optId) => ({
                                productVariantOptionId: optId,
                            })),
                        },
                    }
                    : {})),
                include: {
                    options: {
                        include: {
                            option: {
                                include: { variant: true },
                            },
                        },
                    },
                },
            });
            return combination;
        }));
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "P2002") {
            throw new apiError_1.default(http_status_1.default.CONFLICT, "A variant combination with this SKU already exists");
        }
        throw error;
    }
});
const updateCombination = (productId, combinationId, req) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield assertProductExists(productId);
    const data = req.body;
    const existing = yield prisma_1.default.productVariantCombination.findFirst({
        where: { id: combinationId, productId },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Combination not found for this product");
    }
    // Stock & Status Logic:
    // If target quantity is 0 or less, it must be INACTIVE
    // If target status is ACTIVE but target quantity is 0 or less, reject with error
    const finalQuantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
    let finalStatus = data.status !== undefined ? data.status : existing.status;
    if (finalQuantity <= 0) {
        // If quantity is 0, automatic INACTIVE
        finalStatus = "INACTIVE";
        if (data.status === "ACTIVE") {
            throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Cannot activate variant with 0 stock. Please add stock quantity first.");
        }
    }
    else if (data.status !== undefined) {
        finalStatus = data.status;
    }
    else if (finalQuantity > 0) {
        finalStatus = "ACTIVE";
    }
    try {
        return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            let finalPriceToSet = data.finalPrice !== undefined ? Number(data.finalPrice) : existing.finalPrice;
            if (Array.isArray(data.optionIds)) {
                yield tx.productVariantCombinationOption.deleteMany({
                    where: { productVariantCombinationId: combinationId },
                });
                if (data.optionIds.length > 0) {
                    yield tx.productVariantCombinationOption.createMany({
                        data: data.optionIds.map((optId) => ({
                            productVariantCombinationId: combinationId,
                            productVariantOptionId: optId,
                        })),
                    });
                    // Recalculate price if finalPrice wasn't explicitly passed
                    if (data.finalPrice === undefined) {
                        const selectedOptions = yield tx.productVariantOption.findMany({
                            where: { id: { in: data.optionIds } },
                        });
                        const priceAdjustmentsSum = selectedOptions.reduce((sum, opt) => sum + Number(opt.priceAdjustment || 0), 0);
                        const baseProductPrice = (_b = (_a = product.sellingPrice) !== null && _a !== void 0 ? _a : product.buyingPrice) !== null && _b !== void 0 ? _b : 0;
                        finalPriceToSet = Math.max(0, baseProductPrice + priceAdjustmentsSum);
                    }
                }
            }
            return yield tx.productVariantCombination.update({
                where: { id: combinationId },
                data: Object.assign(Object.assign(Object.assign(Object.assign({}, (data.sku && { sku: data.sku })), { quantity: Math.max(0, finalQuantity), finalPrice: finalPriceToSet }), (data.imageId !== undefined && { imageId: data.imageId })), { status: finalStatus }),
                include: {
                    options: {
                        include: {
                            option: {
                                include: { variant: true },
                            },
                        },
                    },
                },
            });
        }));
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "P2002") {
            throw new apiError_1.default(http_status_1.default.CONFLICT, "A variant combination with this SKU already exists");
        }
        throw error;
    }
});
const deleteCombination = (productId, combinationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    const existing = yield prisma_1.default.productVariantCombination.findFirst({
        where: { id: combinationId, productId },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Combination not found for this product");
    }
    return prisma_1.default.productVariantCombination.delete({
        where: { id: combinationId },
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// MATRIX CROSS COMBINATIONS GENERATOR
// Given product's variant attributes & options, cross them to form combinations
// ONLY when 2 or more variant attributes exist
// ─────────────────────────────────────────────────────────────────────────────
const generateMatrixCombinations = (productId, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const product = yield assertProductExists(productId);
    const basePrice = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.basePrice) !== undefined && ((_b = req.body) === null || _b === void 0 ? void 0 : _b.basePrice) !== null
        ? Number(req.body.basePrice)
        : ((_d = (_c = product.sellingPrice) !== null && _c !== void 0 ? _c : product.buyingPrice) !== null && _d !== void 0 ? _d : 0);
    const defaultQuantity = ((_e = req.body) === null || _e === void 0 ? void 0 : _e.defaultQuantity) !== undefined ? Number(req.body.defaultQuantity) : 0;
    const skuPrefix = ((_f = req.body) === null || _f === void 0 ? void 0 : _f.skuPrefix) || product.slug.toUpperCase();
    const variantAttributes = yield prisma_1.default.productVariant.findMany({
        where: { productId },
        include: {
            options: {
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: { sortOrder: "asc" },
    });
    const validAttributes = variantAttributes.filter((v) => v.options.length > 0);
    if (validAttributes.length === 0) {
        yield prisma_1.default.productVariantCombination.deleteMany({
            where: { productId },
        });
        return [];
    }
    // Cartesian Product helper for 2 or more variant attributes
    const cartesian = (arrays) => {
        return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])), [[]]);
    };
    const optionGroups = validAttributes.map((attr) => attr.options);
    const crossedCombinations = cartesian(optionGroups);
    const createdCombinations = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const results = [];
        for (const comboOptions of crossedCombinations) {
            // comboOptions is an array of ProductVariantOption objects
            const skuParts = comboOptions.map((opt) => opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
            const sku = `${skuPrefix}-${skuParts.join("-")}`.toUpperCase();
            const priceAdjustmentsSum = comboOptions.reduce((sum, opt) => sum + Number(opt.priceAdjustment || 0), 0);
            const finalPrice = Math.max(0, basePrice + priceAdjustmentsSum);
            // Check if SKU exists
            const existingCombo = yield tx.productVariantCombination.findUnique({
                where: { sku },
            });
            let combination;
            if (existingCombo) {
                // Delete existing combination options and recreate
                yield tx.productVariantCombinationOption.deleteMany({
                    where: { productVariantCombinationId: existingCombo.id },
                });
                combination = yield tx.productVariantCombination.update({
                    where: { id: existingCombo.id },
                    data: {
                        finalPrice,
                        quantity: defaultQuantity,
                        options: {
                            create: comboOptions.map((opt) => ({
                                productVariantOptionId: opt.id,
                            })),
                        },
                    },
                    include: {
                        options: {
                            include: {
                                option: {
                                    include: { variant: true },
                                },
                            },
                        },
                    },
                });
            }
            else {
                combination = yield tx.productVariantCombination.create({
                    data: {
                        productId,
                        sku,
                        finalPrice,
                        quantity: defaultQuantity,
                        status: defaultQuantity > 0 ? "ACTIVE" : "INACTIVE",
                        options: {
                            create: comboOptions.map((opt) => ({
                                productVariantOptionId: opt.id,
                            })),
                        },
                    },
                    include: {
                        options: {
                            include: {
                                option: {
                                    include: { variant: true },
                                },
                            },
                        },
                    },
                });
            }
            results.push(combination);
        }
        return results;
    }), {
        maxWait: 10000,
        timeout: 30000,
    });
    return createdCombinations;
});
exports.ProductVariantServices = {
    createVariantAttribute,
    getVariantAttributesByProduct,
    updateVariantAttribute,
    deleteVariantAttribute,
    addOptionToVariant,
    updateOption,
    deleteOption,
    getCombinationsByProduct,
    createCombination,
    updateCombination,
    deleteCombination,
    generateMatrixCombinations,
};
