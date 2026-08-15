"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createVariantAttribute = zod_1.default.object({
    body: zod_1.default.object({
        variantTitle: zod_1.default.string().min(1, "Variant title is required (e.g. Color, Size)"),
        isRequired: zod_1.default.boolean().optional(),
        sortOrder: zod_1.default.number().int().optional(),
        options: zod_1.default
            .array(zod_1.default.object({
            value: zod_1.default.string().min(1, "Option value is required"),
            priceAdjustment: zod_1.default.number().optional(),
            quantity: zod_1.default.number().int().nonnegative().optional(),
            stock: zod_1.default.number().int().nonnegative().optional(),
            stockQuantity: zod_1.default.number().int().nonnegative().optional(),
            sku: zod_1.default.string().optional().nullable(),
            status: zod_1.default.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
            sortOrder: zod_1.default.number().int().optional(),
        }))
            .optional(),
    }),
});
const updateVariantAttribute = zod_1.default.object({
    body: zod_1.default.object({
        variantTitle: zod_1.default.string().min(1).optional(),
        isRequired: zod_1.default.boolean().optional(),
        sortOrder: zod_1.default.number().int().optional(),
    }),
});
const createVariantOption = zod_1.default.object({
    body: zod_1.default.object({
        value: zod_1.default.string().min(1, "Option value is required (e.g. Red, Blue, XL)"),
        priceAdjustment: zod_1.default.number().optional(),
        quantity: zod_1.default.number().int().nonnegative().optional(),
        stock: zod_1.default.number().int().nonnegative().optional(),
        stockQuantity: zod_1.default.number().int().nonnegative().optional(),
        sku: zod_1.default.string().optional().nullable(),
        status: zod_1.default.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
        sortOrder: zod_1.default.number().int().optional(),
    }),
});
const updateVariantOption = zod_1.default.object({
    body: zod_1.default.object({
        value: zod_1.default.string().optional(),
        priceAdjustment: zod_1.default.number().optional(),
        quantity: zod_1.default.number().int().nonnegative().optional(),
        stock: zod_1.default.number().int().nonnegative().optional(),
        stockQuantity: zod_1.default.number().int().nonnegative().optional(),
        sku: zod_1.default.string().optional().nullable(),
        status: zod_1.default.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
        sortOrder: zod_1.default.number().int().optional(),
    }),
});
const createCombination = zod_1.default.object({
    body: zod_1.default.object({
        sku: zod_1.default.string().min(1, "SKU is required"),
        quantity: zod_1.default.number().int().nonnegative("Quantity must be non-negative").default(0),
        finalPrice: zod_1.default.number().nonnegative("Final price must be non-negative"),
        imageId: zod_1.default.string().optional().nullable(),
        status: zod_1.default.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
        optionIds: zod_1.default.array(zod_1.default.string()).min(1, "At least one option ID is required"),
    }),
});
const updateCombination = zod_1.default.object({
    body: zod_1.default.object({
        sku: zod_1.default.string().optional(),
        quantity: zod_1.default.number().int().nonnegative().optional(),
        finalPrice: zod_1.default.number().nonnegative().optional(),
        imageId: zod_1.default.string().optional().nullable(),
        status: zod_1.default.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
        optionIds: zod_1.default.array(zod_1.default.string()).optional(),
    }),
});
const generateMatrix = zod_1.default.object({
    body: zod_1.default.object({
        basePrice: zod_1.default.number().nonnegative().optional(),
        defaultQuantity: zod_1.default.number().int().nonnegative().optional(),
        skuPrefix: zod_1.default.string().optional(),
    }),
});
exports.ProductVariantValidation = {
    createVariantAttribute,
    updateVariantAttribute,
    createVariantOption,
    updateVariantOption,
    createCombination,
    updateCombination,
    generateMatrix,
};
