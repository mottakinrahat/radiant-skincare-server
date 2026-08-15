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
exports.PaymentServices = exports.paymentServices = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const payment_utils_1 = require("./payment.utils");
const initPayment = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const orderData = yield prisma_2.default.order.findUnique({
        where: {
            id: orderId
        },
        include: {
            user: {
                include: {
                    userInfo: true
                }
            },
            shippingAddress: true,
        }
    });
    if (!orderData) {
        throw new Error("Order not found");
    }
    const userInfo = orderData.user.userInfo;
    const transactionId = "txn-" + Date.now();
    const paymentData = {
        // ── Mandatory fields ──────────────────────────────────────────────
        total_amount: orderData.totalAmount,
        currency: 'BDT',
        tran_id: transactionId,
        success_url: (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/v1/payment/confirmation?transactionId=' + transactionId + '&status=success',
        fail_url: (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/v1/payment/confirmation?transactionId=' + transactionId + '&status=fail',
        cancel_url: (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/v1/payment/confirmation?transactionId=' + transactionId + '&status=cancel',
        cus_name: orderData.user.name || 'Customer',
        cus_email: orderData.user.email,
        cus_phone: ((_a = orderData.shippingAddress) === null || _a === void 0 ? void 0 : _a.phoneNumber) || orderData.user.contactNumber || '01711111111',
        cus_add1: [(_b = orderData.shippingAddress) === null || _b === void 0 ? void 0 : _b.houseStreet, (_c = orderData.shippingAddress) === null || _c === void 0 ? void 0 : _c.village].filter(Boolean).join(', ') || (userInfo === null || userInfo === void 0 ? void 0 : userInfo.line1) || 'N/A',
        cus_city: ((_d = orderData.shippingAddress) === null || _d === void 0 ? void 0 : _d.district) || (userInfo === null || userInfo === void 0 ? void 0 : userInfo.city) || 'Dhaka',
        cus_country: ((_e = orderData.shippingAddress) === null || _e === void 0 ? void 0 : _e.country) || (userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) || 'Bangladesh',
        product_name: 'TechNTrove Product',
        product_category: 'Electronic',
        product_profile: 'general',
        shipping_method: 'NO',
    };
    const initialPaymentResponse = yield (0, payment_utils_1.initiatePayment)(paymentData);
    return initialPaymentResponse;
});
const validatePayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, payment_utils_1.verifyPayment)(payload);
    if (!response || response.status !== 'VALID') {
        return {
            message: "Payment Failed!"
        };
    }
    yield prisma_2.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedPaymentData = yield tx.payment.update({
            where: {
                transactionId: response.tran_id
            },
            data: {
                paymentStatus: prisma_1.PaymentStatusEnum.PAID,
                paymentGatewayData: response
            }
        });
        yield tx.order.update({
            where: {
                id: updatedPaymentData.orderId
            },
            data: {
                paymentStatus: prisma_1.PaymentStatusEnum.PAID
            }
        });
    }));
    return {
        message: "Payment Successful!"
    };
});
const confirmationService = (transactionId, paymentStatus, val_id) => __awaiter(void 0, void 0, void 0, function* () {
    let message = "Payment Failed!";
    if (paymentStatus === 'success' && val_id) {
        const verifyRes = yield validatePayment({ val_id });
        message = verifyRes.message;
    }
    return `<h1>${message}</h1><p>Transaction ID: ${transactionId}</p>`;
});
exports.paymentServices = {
    initPayment,
    validatePayment,
    confirmationService
};
exports.PaymentServices = exports.paymentServices;
