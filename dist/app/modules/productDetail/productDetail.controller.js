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
exports.ProductDetailController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const trycatch_1 = require("../../../helpers/trycatch");
const sendResponse_1 = require("../../../helpers/sendResponse");
const productDetail_services_1 = require("./productDetail.services");
const createDetail = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productDetail_services_1.ProductDetailServices.createDetailIntoDB(productId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Product detail created successfully",
        data: result,
    });
}));
const getDetailsByProduct = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productDetail_services_1.ProductDetailServices.getDetailsByProductFromDB(productId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product details retrieved successfully",
        data: result,
    });
}));
const getSingleDetail = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, detailId } = req.params;
    const result = yield productDetail_services_1.ProductDetailServices.getSingleDetailFromDB(productId, detailId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product detail retrieved successfully",
        data: result,
    });
}));
const updateDetail = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, detailId } = req.params;
    const result = yield productDetail_services_1.ProductDetailServices.updateDetailIntoDB(productId, detailId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product detail updated successfully",
        data: result,
    });
}));
const deleteDetail = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, detailId } = req.params;
    yield productDetail_services_1.ProductDetailServices.deleteDetailFromDB(productId, detailId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product detail deleted successfully",
        data: null,
    });
}));
exports.ProductDetailController = {
    createDetail,
    getDetailsByProduct,
    getSingleDetail,
    updateDetail,
    deleteDetail,
};
