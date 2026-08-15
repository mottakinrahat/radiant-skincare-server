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
exports.ProductVariantController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const trycatch_1 = require("../../../helpers/trycatch");
const sendResponse_1 = require("../../../helpers/sendResponse");
const productVariant_services_1 = require("./productVariant.services");
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE CONTROLLERS (e.g. Color, Size, Weight)
// ─────────────────────────────────────────────────────────────────────────────
const createVariantAttribute = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.createVariantAttribute(productId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Variant attribute created successfully",
        data: result,
    });
}));
const getVariantAttributesByProduct = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.getVariantAttributesByProduct(productId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant attributes retrieved successfully",
        data: result,
    });
}));
const updateVariantAttribute = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.updateVariantAttribute(productId, variantId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant attribute updated successfully",
        data: result,
    });
}));
const deleteVariantAttribute = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    yield productVariant_services_1.ProductVariantServices.deleteVariantAttribute(productId, variantId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant attribute deleted successfully",
        data: null,
    });
}));
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION CONTROLLERS (e.g. Red, Blue, XL)
// ─────────────────────────────────────────────────────────────────────────────
const addOptionToVariant = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.addOptionToVariant(productId, variantId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Option added to variant successfully",
        data: result,
    });
}));
const updateOption = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, optionId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.updateOption(productId, optionId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant option updated successfully",
        data: result,
    });
}));
const deleteOption = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, optionId } = req.params;
    yield productVariant_services_1.ProductVariantServices.deleteOption(productId, optionId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant option deleted successfully",
        data: null,
    });
}));
// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION CONTROLLERS (Crossed Matrix SKU Items)
// ─────────────────────────────────────────────────────────────────────────────
const getCombinationsByProduct = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.getCombinationsByProduct(productId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant combinations retrieved successfully",
        data: result,
    });
}));
const createCombination = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.createCombination(productId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Variant combination created successfully",
        data: result,
    });
}));
const updateCombination = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, combinationId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.updateCombination(productId, combinationId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant combination updated successfully",
        data: result,
    });
}));
const deleteCombination = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, combinationId } = req.params;
    yield productVariant_services_1.ProductVariantServices.deleteCombination(productId, combinationId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Variant combination deleted successfully",
        data: null,
    });
}));
const generateMatrixCombinations = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_services_1.ProductVariantServices.generateMatrixCombinations(productId, req);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Crossed variant matrix combinations generated successfully",
        data: result,
    });
}));
exports.ProductVariantController = {
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
