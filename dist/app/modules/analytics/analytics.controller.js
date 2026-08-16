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
exports.AnalyticsController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = require("../../../helpers/sendResponse");
const trycatch_1 = require("../../../helpers/trycatch");
const analytics_services_1 = require("./analytics.services");
const trackEvent = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield analytics_services_1.AnalyticsServices.trackEvent(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Event tracked successfully",
        data: result,
    });
}));
const getAnalyticsOverview = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield analytics_services_1.AnalyticsServices.getAnalyticsOverview(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Analytics overview retrieved successfully",
        data: result,
    });
}));
const getProductAnalyticsList = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, sortBy, sortOrder, searchTerm, timeRange, startDate, endDate } = req.query;
    const result = yield analytics_services_1.AnalyticsServices.getProductAnalyticsList({ searchTerm, timeRange, startDate, endDate }, { page, limit, sortBy, sortOrder });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product analytics list retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const getSingleProductAnalytics = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.params.productId;
    const { timeRange, startDate, endDate } = req.query;
    const result = yield analytics_services_1.AnalyticsServices.getSingleProductAnalytics(productId, {
        timeRange,
        startDate,
        endDate,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Single product analytics retrieved successfully",
        data: result,
    });
}));
const getTopSearchQueries = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { timeRange, startDate, endDate } = req.query;
    const result = yield analytics_services_1.AnalyticsServices.getTopSearchQueries({
        timeRange,
        startDate,
        endDate,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Top search queries retrieved successfully",
        data: result,
    });
}));
const getAbandonedCartsList = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { timeRange, startDate, endDate, status: cartStatus } = req.query;
    const result = yield analytics_services_1.AnalyticsServices.getAbandonedCartsList({
        timeRange,
        startDate,
        endDate,
        status: cartStatus,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned carts retrieved successfully",
        data: result,
    });
}));
exports.AnalyticsController = {
    trackEvent,
    getAnalyticsOverview,
    getProductAnalyticsList,
    getSingleProductAnalytics,
    getTopSearchQueries,
    getAbandonedCartsList,
};
