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
exports.CategoryServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const fileUploader_1 = require("../../../helpers/fileUploader");
const generateUniqueCategorySlug = (nameOrSlug, currentCategoryId) => __awaiter(void 0, void 0, void 0, function* () {
    let baseSlug = (nameOrSlug || "category")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    if (!baseSlug)
        baseSlug = "category-" + Date.now();
    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = yield prisma_1.default.category.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!existing || (currentCategoryId && existing.id === currentCategoryId)) {
            return slug;
        }
        slug = baseSlug + "-" + counter;
        counter++;
    }
});
const createCategoryIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
    const categoryName = (payload === null || payload === void 0 ? void 0 : payload.categoryName) || (payload === null || payload === void 0 ? void 0 : payload.name);
    if (!categoryName) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Category name is required");
    }
    const existing = yield prisma_1.default.category.findFirst({
        where: {
            categoryName: {
                equals: categoryName,
                mode: "insensitive",
            },
        },
    });
    if (existing) {
        throw new apiError_1.default(http_status_1.default.CONFLICT, "A category with this name already exists");
    }
    let imageUrl = (payload === null || payload === void 0 ? void 0 : payload.image) || (payload === null || payload === void 0 ? void 0 : payload.imageUrl);
    if (file === null || file === void 0 ? void 0 : file.path) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudflare(file.path);
        imageUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.url;
    }
    if (!imageUrl) {
        imageUrl = "/img-3.png";
    }
    const categorySlug = yield generateUniqueCategorySlug(payload.slug || categoryName);
    return prisma_1.default.category.create({
        data: {
            categoryName: categoryName,
            description: payload.description || "",
            image: imageUrl,
            slug: categorySlug,
            attributeSchema: (_a = payload.attributeSchema) !== null && _a !== void 0 ? _a : [],
        },
    });
});
const getCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.category.findMany({
        orderBy: { categoryName: "asc" },
        include: {
            _count: { select: { product: true } },
        },
    });
});
const getSingleCategoryFromDB = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield prisma_1.default.category.findUnique({
        where: { id: categoryId },
        include: {
            _count: { select: { product: true } },
        },
    });
    if (!category) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    return category;
});
const updateCategoryIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryId = req.params.categoryId;
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
    yield getSingleCategoryFromDB(categoryId);
    const categoryName = (payload === null || payload === void 0 ? void 0 : payload.categoryName) || (payload === null || payload === void 0 ? void 0 : payload.name);
    if (categoryName) {
        const duplicate = yield prisma_1.default.category.findFirst({
            where: {
                categoryName: { equals: categoryName, mode: "insensitive" },
                NOT: { id: categoryId },
            },
        });
        if (duplicate) {
            throw new apiError_1.default(http_status_1.default.CONFLICT, "A category with this name already exists");
        }
    }
    let imageUrl;
    if (file === null || file === void 0 ? void 0 : file.path) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudflare(file.path);
        imageUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.url;
    }
    const updateData = Object.assign({}, payload);
    if (categoryName)
        updateData.categoryName = categoryName;
    if (imageUrl)
        updateData.image = imageUrl;
    return prisma_1.default.category.update({
        where: { id: categoryId },
        data: updateData,
    });
});
const deleteCategoryFromDB = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    yield getSingleCategoryFromDB(categoryId);
    const productCount = yield prisma_1.default.product.count({
        where: { categoryId },
    });
    if (productCount > 0) {
        throw new apiError_1.default(http_status_1.default.CONFLICT, "Cannot delete category - it has products linked to it");
    }
    yield prisma_1.default.category.delete({ where: { id: categoryId } });
});
exports.CategoryServices = {
    createCategoryIntoDB,
    getCategoriesFromDB,
    getSingleCategoryFromDB,
    updateCategoryIntoDB,
    deleteCategoryFromDB,
};
