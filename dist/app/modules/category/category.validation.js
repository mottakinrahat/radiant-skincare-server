"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryValidation = void 0;
const zod_1 = __importDefault(require("zod"));
// Defines a single attribute field in the category's dynamic schema
const attributeFieldSchema = zod_1.default.object({
    key: zod_1.default.string().min(1, "Attribute key is required"),
    label: zod_1.default.string().min(1, "Attribute label is required"),
    type: zod_1.default.enum(["text", "number", "select", "boolean", "textarea"]),
    options: zod_1.default.array(zod_1.default.string()).optional(), // only relevant when type === "select"
    required: zod_1.default.boolean().default(false),
});
const createCategory = zod_1.default.object({
    body: zod_1.default.object({
        categoryName: zod_1.default.string().min(1, "Category name is required"),
        description: zod_1.default.string().optional(),
        image: zod_1.default.string().optional(),
        slug: zod_1.default.string().optional(),
        attributeSchema: zod_1.default.array(attributeFieldSchema).optional(),
    }),
});
const updateCategory = zod_1.default.object({
    body: zod_1.default
        .object({
        categoryName: zod_1.default.string().min(1).optional(),
        description: zod_1.default.string().optional(),
        image: zod_1.default.string().optional(),
        slug: zod_1.default.string().optional(),
        attributeSchema: zod_1.default.array(attributeFieldSchema).optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required for update",
    }),
});
exports.CategoryValidation = {
    createCategory,
    updateCategory,
};
