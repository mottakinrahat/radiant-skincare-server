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
exports.OrderController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = require("../../../helpers/sendResponse");
const trycatch_1 = require("../../../helpers/trycatch");
const order_services_1 = require("./order.services");
const prisma_1 = require("../../../../prisma/generated/prisma");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const createOrder = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const clientIp = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    let userEmail = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.email) || ((_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.shippingAddress) === null || _d === void 0 ? void 0 : _d.email);
    const phone = ((_e = req.body) === null || _e === void 0 ? void 0 : _e.phone) || ((_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.shippingAddress) === null || _g === void 0 ? void 0 : _g.phoneNumber) || ((_j = (_h = req.body) === null || _h === void 0 ? void 0 : _h.shippingAddress) === null || _j === void 0 ? void 0 : _j.phone) || "";
    if (!userEmail) {
        userEmail = `buyer_${String(phone).replace(/\D/g, "") || Date.now()}@radiantskincare.com`;
    }
    let user = yield prisma_2.default.user.findFirst({
        where: {
            OR: [
                { email: userEmail },
                ...(phone ? [{ contactNumber: String(phone) }] : []),
            ],
        },
    });
    if (!user) {
        user = yield prisma_2.default.user.create({
            data: {
                name: ((_l = (_k = req.body) === null || _k === void 0 ? void 0 : _k.shippingAddress) === null || _l === void 0 ? void 0 : _l.name) || ((_m = req.body) === null || _m === void 0 ? void 0 : _m.name) || "Customer",
                email: userEmail,
                contactNumber: phone ? String(phone) : null,
                role: prisma_1.UserRole.BUYER,
                password: "guest_buyer_account",
            },
        });
    }
    const result = yield order_services_1.OrderServices.createOrder(user.email, req.body, { clientIp, userAgent });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order created successfully",
        data: result,
    });
}));
const getMyOrders = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_services_1.OrderServices.getOrdersForUser(req.user.email);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Orders retrieved successfully",
        data: result,
    });
}));
const getOrderById = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_services_1.OrderServices.getOrderById(id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order retrieved successfully",
        data: result,
    });
}));
const getAllOrders = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_services_1.OrderServices.getAllOrders();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "All orders retrieved successfully",
        data: result,
    });
}));
const updateOrderStatus = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status: orderStatus } = req.body;
    const result = yield order_services_1.OrderServices.updateOrderStatus(id, orderStatus);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order status updated successfully",
        data: result,
    });
}));
const updatePaymentStatus = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const result = yield order_services_1.OrderServices.updatePaymentStatus(id, paymentStatus);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Payment status updated successfully",
        data: result,
    });
}));
const updateOrderCourierInfo = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_services_1.OrderServices.updateOrderCourierInfo(id, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order courier info updated successfully",
        data: result,
    });
}));
const trackOrderPublic = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, orderNumber, phone } = req.query;
    const orderQuery = (orderNumber || orderId);
    const result = yield order_services_1.OrderServices.trackOrderPublic(orderQuery, phone);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order tracked successfully",
        data: result,
    });
}));
const clearOrderCourierInfo = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_services_1.OrderServices.clearOrderCourierInfo(id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order courier info cleared successfully",
        data: result,
    });
}));
const deleteOrder = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_services_1.OrderServices.deleteOrder(id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order deleted successfully",
        data: result,
    });
}));
exports.OrderController = {
    deleteOrder,
    createOrder,
    getMyOrders,
    getOrderById,
    trackOrderPublic,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateOrderCourierInfo,
    clearOrderCourierInfo,
};
