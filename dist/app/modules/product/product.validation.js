"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createProduct = zod_1.default.object({
    body: zod_1.default.object({
        name: zod_1.default.string().min(1, "Product name is required"),
        slug: zod_1.default.string().min(1, "Slug is required"),
        categoryId: zod_1.default.string().min(1, "Category ID is required"),
        description: zod_1.default.string().optional(),
        brandId: zod_1.default.string().optional().nullable(),
        tags: zod_1.default.array(zod_1.default.string()).optional(),
        isPublished: zod_1.default.boolean().optional(),
        isFeatured: zod_1.default.boolean().optional(),
        metaTitle: zod_1.default.string().optional(),
        metaDescription: zod_1.default.string().optional(),
        attributes: zod_1.default.record(zod_1.default.string(), zod_1.default.unknown()).optional(),
    }),
});
const updateProduct = zod_1.default.object({
    body: zod_1.default
        .object({
        name: zod_1.default.string().min(1).optional(),
        slug: zod_1.default.string().min(1).optional(),
        categoryId: zod_1.default.string().min(1).optional(),
        description: zod_1.default.string().optional().nullable(),
        brandId: zod_1.default.string().optional().nullable(),
        tags: zod_1.default.array(zod_1.default.string()).optional(),
        isPublished: zod_1.default.boolean().optional(),
        isFeatured: zod_1.default.boolean().optional(),
        metaTitle: zod_1.default.string().optional().nullable(),
        metaDescription: zod_1.default.string().optional().nullable(),
        attributes: zod_1.default.record(zod_1.default.string(), zod_1.default.unknown()).optional(),
        variantId: zod_1.default.string().optional().nullable(),
        stockQuantity: zod_1.default.number().optional(),
        stock: zod_1.default.number().optional(),
        initialSoldCount: zod_1.default.number().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required for update",
    }),
});
const createProductImage = zod_1.default.object({
    body: zod_1.default.object({
        url: zod_1.default.string().min(1, "Image URL is required"),
        isPrimary: zod_1.default.boolean().optional(),
        sortOrder: zod_1.default.number().int().optional(),
        altText: zod_1.default.string().optional(),
        variantId: zod_1.default.string().optional(),
    }),
});
exports.ProductValidation = {
    createProduct,
    updateProduct,
    createProductImage,
};
