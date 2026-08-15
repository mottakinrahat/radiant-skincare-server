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
exports.CourierController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const trycatch_1 = require("../../../helpers/trycatch");
const sendResponse_1 = require("../../../helpers/sendResponse");
const steadfast_service_1 = require("./steadfast.service");
const courier_services_1 = require("./courier.services");
const dispatchOrder = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield courier_services_1.CourierServices.dispatchOrderToCourier(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message || "Order dispatched to courier successfully",
        data: result,
    });
}));
const getShipmentHistory = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = req.params.orderId;
    const result = yield courier_services_1.CourierServices.getCourierShipmentHistory(orderId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Courier shipment history retrieved successfully",
        data: result,
    });
}));
const resetCourierInfo = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = req.params.orderId;
    const result = yield courier_services_1.CourierServices.resetCourierInfo(orderId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message || "Courier info reset successfully",
        data: result,
    });
}));
const sendOrderToSteadfast = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = req.body;
    const result = yield steadfast_service_1.SteadfastService.createParcel({
        invoice,
        recipient_name,
        recipient_phone,
        recipient_address,
        cod_amount,
        note,
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Parcel sent to Steadfast Courier successfully",
        data: result,
    });
}));
const getSteadfastStatusByTrackingCode = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trackingCode = req.params.trackingCode;
    const result = yield steadfast_service_1.SteadfastService.trackByTrackingCode(trackingCode);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Tracking status retrieved successfully",
        data: result,
    });
}));
const getSteadfastStatusByInvoice = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const invoice = req.params.invoice;
    const result = yield steadfast_service_1.SteadfastService.trackByInvoice(invoice);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Tracking status retrieved successfully",
        data: result,
    });
}));
const getSteadfastBalance = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield steadfast_service_1.SteadfastService.getBalance();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Steadfast balance retrieved successfully",
        data: result,
    });
}));
exports.CourierController = {
    dispatchOrder,
    getShipmentHistory,
    resetCourierInfo,
    sendOrderToSteadfast,
    getSteadfastStatusByTrackingCode,
    getSteadfastStatusByInvoice,
    getSteadfastBalance,
};
