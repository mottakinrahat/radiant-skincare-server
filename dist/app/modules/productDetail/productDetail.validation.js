"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDetailValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const createDetail = zod_1.default.object({
    body: zod_1.default.object({
        topic: zod_1.default.string().min(1, "Topic is required"),
        description: zod_1.default.string().min(1, "Description is required"),
        sortOrder: zod_1.default.number().int().nonnegative().optional().default(0),
    }),
});
const updateDetail = zod_1.default.object({
    body: zod_1.default
        .object({
        topic: zod_1.default.string().min(1).optional(),
        description: zod_1.default.string().min(1).optional(),
        sortOrder: zod_1.default.number().int().nonnegative().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required for update",
    }),
});
exports.ProductDetailValidation = {
    createDetail,
    updateDetail,
};
