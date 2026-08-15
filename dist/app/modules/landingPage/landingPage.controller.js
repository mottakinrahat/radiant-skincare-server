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
exports.LandingPageController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = require("../../../helpers/sendResponse");
const trycatch_1 = require("../../../helpers/trycatch");
const landingPage_services_1 = require("./landingPage.services");
const upsertLandingPage = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield landingPage_services_1.LandingPageServices.upsertLandingPage(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Landing page saved successfully",
        data: result,
    });
}));
const getLandingPageBySlug = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { slug } = req.params;
    const result = yield landingPage_services_1.LandingPageServices.getLandingPageBySlug(slug);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Landing page retrieved successfully",
        data: result,
    });
}));
const getAllLandingPages = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield landingPage_services_1.LandingPageServices.getAllLandingPages();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Landing pages retrieved successfully",
        data: result,
    });
}));
const deleteLandingPage = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield landingPage_services_1.LandingPageServices.deleteLandingPage(id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Landing page deleted successfully",
        data: result,
    });
}));
// ─── Analytics Tracking Handlers ───────────────────────────────────────────
const trackCheckoutClick = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    yield landingPage_services_1.LandingPageServices.trackCheckoutClick(productId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Checkout click tracked",
        data: null,
    });
}));
const trackPurchase = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    yield landingPage_services_1.LandingPageServices.trackPurchase(productId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Purchase tracked",
        data: null,
    });
}));
const getLandingPageStats = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield landingPage_services_1.LandingPageServices.getLandingPageStatsByProductId(productId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Landing page stats retrieved",
        data: result,
    });
}));
exports.LandingPageController = {
    upsertLandingPage,
    getLandingPageBySlug,
    getAllLandingPages,
    deleteLandingPage,
    trackCheckoutClick,
    trackPurchase,
    getLandingPageStats,
};
