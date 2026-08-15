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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductServices = exports.generateNextProductSerial = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const apiError_1 = __importDefault(require("../../errors/apiError"));
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const product_constant_1 = require("./product.constant");
const product_helper_1 = require("./product.helper");
const fileUploader_1 = require("../../../helpers/fileUploader");
const generateUniqueSlug = (nameOrSlug, currentProductId) => __awaiter(void 0, void 0, void 0, function* () {
    let baseSlug = (nameOrSlug || "product")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    if (!baseSlug)
        baseSlug = `product-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = yield prisma_2.default.product.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!existing || (currentProductId && existing.id === currentProductId)) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
});
/**
 * Generate sequential product serial number (e.g. 01, 02, 03... or 1, 2, 3...)
 * Safe against race conditions and preserves existing serial formats.
 */
const generateNextProductSerial = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    const db = tx || prisma_2.default;
    const products = yield db.product.findMany({
        select: { productSerial: true },
    });
    let maxSerial = 0;
    for (const p of products) {
        if (p.productSerial) {
            const digits = p.productSerial.replace(/\D/g, "");
            const num = parseInt(digits, 10);
            if (!isNaN(num) && num > maxSerial) {
                maxSerial = num;
            }
        }
    }
    const nextNum = maxSerial + 1;
    return nextNum < 10 ? `0${nextNum}` : String(nextNum);
});
exports.generateNextProductSerial = generateNextProductSerial;
const createProductIntoDB = (req, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const file = req === null || req === void 0 ? void 0 : req.file;
        let payload = req.body;
        if (typeof payload === "string") {
            try {
                payload = JSON.parse(payload);
            }
            catch (e) { }
        }
        if ((payload === null || payload === void 0 ? void 0 : payload.data) && typeof payload.data === "string") {
            try {
                payload = JSON.parse(payload.data);
            }
            catch (e) { }
        }
        else if ((payload === null || payload === void 0 ? void 0 : payload.data) && typeof payload.data === "object") {
            payload = payload.data;
        }
        if (!payload || !payload.name) {
            throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Product name is required.");
        }
        // Auto-resolve unique slug to prevent unique constraint collisions
        payload.slug = yield generateUniqueSlug(payload.slug || payload.name);
        // Always auto-generate productSerial safely on backend (sequential: 01, 02, 03...)
        payload.productSerial = yield (0, exports.generateNextProductSerial)();
        if (payload.sellingPrice !== undefined && payload.sellingPrice !== null) {
            payload.sellingPrice = Number(payload.sellingPrice);
        }
        if (payload.regularPrice !== undefined && payload.regularPrice !== null) {
            payload.regularPrice = Number(payload.regularPrice);
        }
        if (payload.buyingPrice !== undefined && payload.buyingPrice !== null) {
            payload.buyingPrice = Number(payload.buyingPrice);
        }
        const existingUser = yield prisma_2.default.user.findUnique({
            where: {
                email: user.email,
                status: prisma_1.UserStatus.ACTIVE,
            },
            select: { id: true },
        });
        if (!existingUser) {
            throw new apiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        let uploadToCloudflare;
        if (file === null || file === void 0 ? void 0 : file.path) {
            uploadToCloudflare = yield fileUploader_1.fileUploader.uploadToCloudflare(file.path);
        }
        if (!payload.brandId || payload.brandId === "" || payload.brandId === "null") {
            delete payload.brandId;
        }
        const { details, variants, variantCombinations, images } = payload, productData = __rest(payload, ["details", "variants", "variantCombinations", "images"]);
        const hasVariantsOnCreate = Array.isArray(variants) && variants.length > 0 && variants.some((v) => Array.isArray(v.options) && v.options.length > 0);
        if (hasVariantsOnCreate) {
            // Products with variants must NOT use product-level stock
            productData.stock = 0;
        }
        else {
            // Products without variants use product-level stock
            productData.stock = Math.max(0, Number((_b = (_a = payload.stock) !== null && _a !== void 0 ? _a : payload.stockQuantity) !== null && _b !== void 0 ? _b : 0));
        }
        const newProduct = yield prisma_2.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // 1. Create base product with details, variant attributes & options
            const product = yield tx.product.create({
                data: Object.assign(Object.assign(Object.assign(Object.assign({}, productData), { productAddById: existingUser.id }), (Array.isArray(details) && details.length > 0
                    ? {
                        details: {
                            create: details.map((d, idx) => {
                                var _a;
                                return ({
                                    topic: d.topic || "Specification",
                                    description: d.description || "",
                                    sortOrder: (_a = d.sortOrder) !== null && _a !== void 0 ? _a : idx + 1,
                                });
                            }),
                        },
                    }
                    : {})), (Array.isArray(variants) && variants.length > 0
                    ? {
                        variants: {
                            create: variants.map((v, idx) => {
                                var _a, _b;
                                return (Object.assign({ variantTitle: v.variantTitle || v.title || "Variant", isRequired: (_a = v.isRequired) !== null && _a !== void 0 ? _a : false, sortOrder: (_b = v.sortOrder) !== null && _b !== void 0 ? _b : idx + 1 }, (Array.isArray(v.options) && v.options.length > 0
                                    ? {
                                        options: {
                                            create: v.options.map((opt, optIdx) => {
                                                var _a, _b, _c, _d, _e;
                                                return ({
                                                    value: opt.value,
                                                    priceAdjustment: Number((_a = opt.priceAdjustment) !== null && _a !== void 0 ? _a : 0),
                                                    quantity: Number((_d = (_c = (_b = opt.quantity) !== null && _b !== void 0 ? _b : opt.stock) !== null && _c !== void 0 ? _c : opt.stockQuantity) !== null && _d !== void 0 ? _d : 0),
                                                    sku: opt.sku || null,
                                                    status: opt.status || "ACTIVE",
                                                    sortOrder: (_e = opt.sortOrder) !== null && _e !== void 0 ? _e : optIdx + 1,
                                                });
                                            }),
                                        },
                                    }
                                    : {})));
                            }),
                        },
                    }
                    : {})),
                include: product_helper_1.productHelpers.productIncludeDefault,
            });
            // 2. Build image records with guaranteed productId
            const imageRecords = [];
            if (uploadToCloudflare === null || uploadToCloudflare === void 0 ? void 0 : uploadToCloudflare.url) {
                imageRecords.push({
                    url: uploadToCloudflare.url,
                    productId: product.id,
                    isPrimary: true,
                    sortOrder: 0,
                });
            }
            const isValidUrl = (u) => typeof u === "string" && u.trim().length > 0 && u.length < 2000 && !u.startsWith("blob:");
            if (Array.isArray(images)) {
                images.forEach((img, idx) => {
                    const url = typeof img === "string" ? img : img === null || img === void 0 ? void 0 : img.url;
                    if (isValidUrl(url) && url !== (uploadToCloudflare === null || uploadToCloudflare === void 0 ? void 0 : uploadToCloudflare.url)) {
                        imageRecords.push({
                            url,
                            productId: product.id,
                            isPrimary: typeof img === "object" ? !!img.isPrimary : idx === 0 && !(uploadToCloudflare === null || uploadToCloudflare === void 0 ? void 0 : uploadToCloudflare.url),
                            sortOrder: idx,
                        });
                    }
                });
            }
            if (imageRecords.length > 0) {
                yield tx.productImage.createMany({
                    data: imageRecords,
                });
            }
            // Auto-generate Matrix Combinations ONLY if 2 or more variant attributes were created
            if (Array.isArray(variants) && variants.length >= 2) {
                const createdVariants = yield tx.productVariant.findMany({
                    where: { productId: product.id },
                    include: { options: { orderBy: { sortOrder: "asc" } } },
                    orderBy: { sortOrder: "asc" },
                });
                const validAttrs = createdVariants.filter((v) => v.options.length > 0);
                if (validAttrs.length >= 2) {
                    const cartesian = (arrays) => arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])), [[]]);
                    const optionGroups = validAttrs.map((v) => v.options);
                    const crossed = cartesian(optionGroups);
                    const basePrice = (_b = (_a = product.sellingPrice) !== null && _a !== void 0 ? _a : product.buyingPrice) !== null && _b !== void 0 ? _b : 0;
                    const skuPrefix = product.slug.toUpperCase();
                    for (const comboOptions of crossed) {
                        const skuParts = comboOptions.map((opt) => opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                        const sku = `${skuPrefix}-${skuParts.join("-")}`.toUpperCase();
                        const priceAdjustmentsSum = comboOptions.reduce((sum, opt) => sum + Number(opt.priceAdjustment || 0), 0);
                        const finalPrice = Math.max(0, basePrice + priceAdjustmentsSum);
                        const existingCombo = yield tx.productVariantCombination.findUnique({
                            where: { sku },
                        });
                        if (!existingCombo) {
                            yield tx.productVariantCombination.create({
                                data: {
                                    productId: product.id,
                                    sku,
                                    finalPrice,
                                    quantity: 0,
                                    status: "INACTIVE",
                                    options: {
                                        create: comboOptions.map((opt) => ({
                                            productVariantOptionId: opt.id,
                                        })),
                                    },
                                },
                            });
                        }
                    }
                }
            }
            return yield tx.product.findUnique({
                where: { id: product.id },
                include: product_helper_1.productHelpers.productIncludeDefault,
            });
        }), {
            maxWait: 5000,
            timeout: 20000,
        });
        return newProduct;
    }
    catch (error) {
        if (error instanceof prisma_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                const target = Array.isArray((_c = error.meta) === null || _c === void 0 ? void 0 : _c.target)
                    ? (_d = error.meta) === null || _d === void 0 ? void 0 : _d.target.join(", ")
                    : ((_e = error.meta) === null || _e === void 0 ? void 0 : _e.target) || "";
                if (target.includes("sku")) {
                    throw new apiError_1.default(http_status_1.default.CONFLICT, "Product variant SKU must be unique");
                }
                throw new apiError_1.default(http_status_1.default.CONFLICT, "Product slug must be unique");
            }
            if (error.code === "P2003") {
                const field = ((_g = (_f = error.meta) === null || _f === void 0 ? void 0 : _f.constraint) === null || _g === void 0 ? void 0 : _g.includes("brandId"))
                    ? "brandId"
                    : ((_j = (_h = error.meta) === null || _h === void 0 ? void 0 : _h.constraint) === null || _j === void 0 ? void 0 : _j.includes("categoryId"))
                        ? "categoryId"
                        : "Brand or Category";
                throw new apiError_1.default(http_status_1.default.BAD_REQUEST, `Invalid ${field} — specified ${field} does not exist in the database.`);
            }
        }
        throw error;
    }
});
const getProductsFromDB = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, sortBy, sortOrder, skip } = paginationHelpers_1.paginationHelpers.calculatePagination(options);
    const { searchTerm, category, categoryId, categorySlug, brand, brandId, minPrice, maxPrice, isPublished, isFeatured, status: productStatus } = filters, filterData = __rest(filters, ["searchTerm", "category", "categoryId", "categorySlug", "brand", "brandId", "minPrice", "maxPrice", "isPublished", "isFeatured", "status"]);
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            OR: [
                ...product_constant_1.productSearchableFields.map((field) => ({
                    [field]: { contains: searchTerm, mode: "insensitive" },
                })),
                {
                    variants: {
                        some: {
                            variantTitle: { contains: searchTerm, mode: "insensitive" },
                        },
                    },
                },
                {
                    variantCombinations: {
                        some: {
                            sku: { contains: searchTerm, mode: "insensitive" },
                        },
                    },
                },
            ],
        });
    }
    const targetCategory = categoryId || categorySlug || category;
    if (targetCategory && targetCategory.length > 0) {
        const unhyphenated = targetCategory.replace(/-/g, " ");
        andConditions.push({
            OR: [
                { categoryId: targetCategory },
                { category: { id: targetCategory } },
                { category: { slug: { equals: targetCategory, mode: "insensitive" } } },
                { category: { categoryName: { equals: targetCategory, mode: "insensitive" } } },
                { category: { categoryName: { equals: unhyphenated, mode: "insensitive" } } },
            ],
        });
    }
    if (brand && brand.length > 0) {
        andConditions.push({
            brand: { brandName: { equals: brand, mode: "insensitive" } },
        });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceCondition = {};
        if (minPrice !== undefined)
            priceCondition.gte = Number(minPrice);
        if (maxPrice !== undefined)
            priceCondition.lte = Number(maxPrice);
        andConditions.push({ variantCombinations: { some: { finalPrice: priceCondition } } });
    }
    const published = product_helper_1.productHelpers.parseBooleanParam(isPublished);
    if (published !== undefined)
        andConditions.push({ isPublished: published });
    const featured = product_helper_1.productHelpers.parseBooleanParam(isFeatured);
    if (featured !== undefined)
        andConditions.push({ isFeatured: featured });
    if (productStatus)
        andConditions.push({ status: productStatus });
    if (Object.keys(filterData).length > 0) {
        const filterCondition = Object.keys(filterData).map((key) => ({
            [key]: { equals: filterData[key] },
        }));
        andConditions.push(...filterCondition);
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const [result, total] = yield prisma_2.default.$transaction([
        prisma_2.default.product.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: sortBy && sortOrder
                ? [{ [sortBy]: sortOrder }]
                : [{ createdAt: "asc" }],
            include: product_helper_1.productHelpers.productIncludeDefault,
        }),
        prisma_2.default.product.count({ where: whereConditions }),
    ]);
    const productIds = result.map((p) => p.id);
    const ratings = yield prisma_2.default.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const productsWithRatings = result.map((product) => {
        var _a, _b;
        const ratingData = ratings.find((r) => r.productId === product.id);
        return Object.assign(Object.assign({}, product), { rating: (_a = ratingData === null || ratingData === void 0 ? void 0 : ratingData._avg.rating) !== null && _a !== void 0 ? _a : 0, reviewCount: (_b = ratingData === null || ratingData === void 0 ? void 0 : ratingData._count.rating) !== null && _b !== void 0 ? _b : 0 });
    });
    return { meta: { page, limit, total }, data: productsWithRatings };
});
const getSingleProductFromDB = (identifier_1, ...args_1) => __awaiter(void 0, [identifier_1, ...args_1], void 0, function* (identifier, options = {}) {
    var _a, _b;
    const andConditions = [
        product_helper_1.productHelpers.identifierWhere(identifier),
    ];
    if (options.publishedOnly) {
        andConditions.push({ isPublished: true });
    }
    const result = yield prisma_2.default.product.findFirst({
        where: { AND: andConditions },
        include: options.publishedOnly
            ? Object.assign(Object.assign({}, product_helper_1.productHelpers.productIncludeDefault), { variantCombinations: {
                    include: {
                        options: {
                            include: {
                                option: {
                                    include: { variant: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                } }) : product_helper_1.productHelpers.productIncludeDefault,
    });
    if (!result) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const validAttrsCount = Array.isArray(result.variants)
        ? result.variants.filter((v) => Array.isArray(v.options) && v.options.length > 0).length
        : 0;
    const finalCombinations = result.variantCombinations || [];
    const agg = yield prisma_2.default.review.aggregate({
        where: { productId: result.id },
        _avg: { rating: true },
        _count: { rating: true },
    });
    return Object.assign(Object.assign({}, result), { variantCombinations: finalCombinations, rating: (_a = agg._avg.rating) !== null && _a !== void 0 ? _a : 0, reviewCount: (_b = agg._count.rating) !== null && _b !== void 0 ? _b : 0 });
});
const updateProductIntoDB = (identifier, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const existing = yield prisma_2.default.product.findFirst({
        where: product_helper_1.productHelpers.identifierWhere(identifier),
        select: { id: true },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const { details, variants, images, variantId, stockQuantity } = payload, productData = __rest(payload, ["details", "variants", "images", "variantId", "stockQuantity"]);
    // Retrieve existing product with its variant combinations
    const existingRecord = yield prisma_2.default.product.findUnique({
        where: { id: existing.id },
        include: { variantCombinations: true, variants: { include: { options: true } } },
    });
    // Preserve permanent productSerial (do not allow edits to change it)
    productData.productSerial = (existingRecord === null || existingRecord === void 0 ? void 0 : existingRecord.productSerial) || (yield (0, exports.generateNextProductSerial)());
    const existingVariantsCount = (_b = (_a = existingRecord === null || existingRecord === void 0 ? void 0 : existingRecord.variants) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    const newVariantsCount = Array.isArray(variants) ? variants.length : existingVariantsCount;
    const hasMultipleVariants = newVariantsCount >= 2;
    const hasSingleVariant = newVariantsCount === 1;
    const hasVariantsInDB = hasMultipleVariants || hasSingleVariant;
    if (hasVariantsInDB) {
        // Product HAS variants: Product-level stock is disabled / not applicable
        productData.stock = 0;
        if (variantId && typeof stockQuantity === "number") {
            if (hasMultipleVariants) {
                // Check if variantId is a combination or option
                const comb = yield prisma_2.default.productVariantCombination.findFirst({
                    where: { id: variantId, productId: existing.id },
                });
                if (comb) {
                    yield prisma_2.default.productVariantCombination.update({
                        where: { id: variantId },
                        data: Object.assign({ quantity: Math.max(0, stockQuantity) }, (stockQuantity <= 0 ? { status: "INACTIVE" } : {})),
                    }).catch(() => { });
                }
                else {
                    yield prisma_2.default.productVariantOption.update({
                        where: { id: variantId },
                        data: Object.assign({ quantity: Math.max(0, stockQuantity) }, (stockQuantity <= 0 ? { status: "INACTIVE" } : {})),
                    }).catch(() => { });
                }
            }
            else {
                // Single variant attribute: update option stock directly
                yield prisma_2.default.productVariantOption.update({
                    where: { id: variantId },
                    data: Object.assign({ quantity: Math.max(0, stockQuantity) }, (stockQuantity <= 0 ? { status: "INACTIVE" } : {})),
                }).catch(() => { });
            }
        }
    }
    else {
        // Product has NO variants: Stock is managed at product level
        if (typeof stockQuantity === "number") {
            productData.stock = Math.max(0, stockQuantity);
        }
        else if (payload.stock !== undefined) {
            productData.stock = Math.max(0, Number(payload.stock));
        }
    }
    if (productData.slug || productData.name) {
        productData.slug = yield generateUniqueSlug(productData.slug || productData.name, existing.id);
    }
    try {
        if (Array.isArray(details)) {
            yield prisma_2.default.productDetail.deleteMany({ where: { productId: existing.id } });
            if (details.length > 0) {
                yield prisma_2.default.productDetail.createMany({
                    data: details.map((d, idx) => {
                        var _a;
                        return ({
                            productId: existing.id,
                            topic: d.topic || "Specification",
                            description: d.description || "",
                            sortOrder: (_a = d.sortOrder) !== null && _a !== void 0 ? _a : idx + 1,
                        });
                    }),
                });
            }
        }
        return yield prisma_2.default.product.update({
            where: { id: existing.id },
            data: productData,
            include: product_helper_1.productHelpers.productIncludeDefault,
        });
    }
    catch (error) {
        if (error instanceof prisma_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            throw new apiError_1.default(http_status_1.default.CONFLICT, "Product slug must be unique");
        }
        throw error;
    }
});
const deleteProductIntoDB = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_2.default.product.findFirst({
        where: product_helper_1.productHelpers.identifierWhere(identifier),
        select: { id: true },
    });
    if (!existing) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    yield prisma_2.default.product.delete({ where: { id: existing.id } });
});
const getProductAttributeSchema = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield prisma_2.default.product.findUnique({
        where: { id: productId },
        select: {
            categoryId: true,
            category: true,
        },
    });
    if (!product) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    return {
        categoryName: product.category.categoryName,
        attributeSchema: (_a = product.category.attributeSchema) !== null && _a !== void 0 ? _a : [],
    };
});
const createProductImageIntoDB = (productId, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield prisma_2.default.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const file = req === null || req === void 0 ? void 0 : req.file;
    let imageUrl = (_a = req.body) === null || _a === void 0 ? void 0 : _a.url;
    if (file === null || file === void 0 ? void 0 : file.path) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudflare(file.path);
        imageUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.url;
    }
    if (!imageUrl) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Image URL or file is required");
    }
    const { isPrimary, sortOrder, altText } = req.body;
    return prisma_2.default.productImage.create({
        data: {
            url: imageUrl,
            productId,
            isPrimary: isPrimary === true || isPrimary === "true",
            sortOrder: sortOrder ? Number(sortOrder) : 0,
            altText,
        },
    });
});
const deleteProductImageIntoDB = (imageId) => __awaiter(void 0, void 0, void 0, function* () {
    const image = yield prisma_2.default.productImage.findUnique({
        where: { id: imageId },
    });
    if (!image) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Image not found");
    }
    yield prisma_2.default.productImage.delete({ where: { id: imageId } });
});
exports.ProductServices = {
    createProductIntoDB,
    getProductsFromDB,
    getSingleProductFromDB,
    updateProductIntoDB,
    deleteProductIntoDB,
    getProductAttributeSchema,
    createProductImageIntoDB,
    deleteProductImageIntoDB,
};
