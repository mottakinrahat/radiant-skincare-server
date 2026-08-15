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
exports.ProductDetailServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const assertProductExists = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: { id: productId },
        select: { id: true },
    });
    if (!product) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
});
const createDetailIntoDB = (productId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield assertProductExists(productId);
    return prisma_1.default.productDetail.create({
        data: {
            productId,
            topic: payload.topic,
            description: payload.description,
            sortOrder: (_a = payload.sortOrder) !== null && _a !== void 0 ? _a : 0,
        },
    });
});
const getDetailsByProductFromDB = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertProductExists(productId);
    return prisma_1.default.productDetail.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
    });
});
const getSingleDetailFromDB = (productId, detailId) => __awaiter(void 0, void 0, void 0, function* () {
    const detail = yield prisma_1.default.productDetail.findFirst({
        where: { id: detailId, productId },
    });
    if (!detail) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Product detail not found");
    }
    return detail;
});
const updateDetailIntoDB = (productId, detailId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    yield getSingleDetailFromDB(productId, detailId);
    return prisma_1.default.productDetail.update({
        where: { id: detailId },
        data: payload,
    });
});
const deleteDetailFromDB = (productId, detailId) => __awaiter(void 0, void 0, void 0, function* () {
    yield getSingleDetailFromDB(productId, detailId);
    yield prisma_1.default.productDetail.delete({ where: { id: detailId } });
});
exports.ProductDetailServices = {
    createDetailIntoDB,
    getDetailsByProductFromDB,
    getSingleDetailFromDB,
    updateDetailIntoDB,
    deleteDetailFromDB,
};
