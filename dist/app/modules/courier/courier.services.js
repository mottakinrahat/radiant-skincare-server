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
exports.CourierServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const steadfast_service_1 = require("./steadfast.service");
const pathao_service_1 = require("./pathao.service");
const redx_service_1 = require("./redx.service");
const dispatchOrderToCourier = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { orderId, courierProvider, codAmount, note, recipientName, recipientPhone, recipientAddress, district } = payload;
    if (!orderId) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Order ID is required for courier dispatch");
    }
    // 1. Retrieve Order & Validate Existence
    const order = yield prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            shippingAddress: true,
            items: { include: { product: true } },
            shipmentHistories: true,
        },
    });
    if (!order) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, `Order not found with ID ${orderId}`);
    }
    // 2. Duplicate Shipment Guard Validation
    const reshipmentAllowedStatuses = [
        "CANCELLED",
        "REFUNDED",
        "RETURNED",
        "RETURNED_READY_FOR_RESHIPMENT",
    ];
    const orderStatusUpper = String(order.status || "").toUpperCase();
    const paymentStatusUpper = String(order.paymentStatus || "").toUpperCase();
    const courierStatusUpper = String(order.courierStatus || "").toUpperCase();
    const isReshipmentAllowed = reshipmentAllowedStatuses.includes(orderStatusUpper) ||
        paymentStatusUpper === "REFUNDED" ||
        courierStatusUpper.includes("REFUND") ||
        courierStatusUpper.includes("RETURN") ||
        courierStatusUpper.includes("CANCEL") ||
        courierStatusUpper.includes("FAIL") ||
        courierStatusUpper.includes("REJECT");
    if (order.sentToCourierAt && !isReshipmentAllowed) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, `Order #${order.orderNumber || order.id.slice(0, 8)} is active & shipped via ${order.courierProvider || "courier"} (Tracking: ${order.trackingCode || "N/A"}). Double shipment is prevented unless the order status or courier status is Refunded, Cancelled, or Returned.`);
    }
    // 3. Prepare Recipient Data & Input Validation
    const invoice = order.orderNumber ? String(order.orderNumber) : order.id.slice(0, 8);
    const name = (recipientName || ((_a = order.shippingAddress) === null || _a === void 0 ? void 0 : _a.customerName) || ((_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.name) || "Customer").trim();
    const phone = (recipientPhone || ((_c = order.shippingAddress) === null || _c === void 0 ? void 0 : _c.phoneNumber) || ((_d = order.shippingAddress) === null || _d === void 0 ? void 0 : _d.altPhoneNumber) || "").trim();
    const addressParts = [
        (_e = order.shippingAddress) === null || _e === void 0 ? void 0 : _e.houseStreet,
        (_f = order.shippingAddress) === null || _f === void 0 ? void 0 : _f.village,
        (_g = order.shippingAddress) === null || _g === void 0 ? void 0 : _g.postOffice,
        (_h = order.shippingAddress) === null || _h === void 0 ? void 0 : _h.upazilla,
        district || ((_j = order.shippingAddress) === null || _j === void 0 ? void 0 : _j.district),
    ].filter(Boolean);
    const address = (recipientAddress || (addressParts.length > 0 ? addressParts.join(", ") : "")).trim();
    const finalCod = codAmount !== null && codAmount !== void 0 ? codAmount : order.totalAmount;
    if (!phone) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "Recipient phone number is required for courier dispatch.");
    }
    if (!address || address.length < 5) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, "A valid delivery address is required for courier dispatch.");
    }
    let courierResult = null;
    // 4. Execute Selected Courier API Request (BEFORE ANY DB WRITE)
    if (courierProvider === "STEADFAST") {
        courierResult = yield steadfast_service_1.SteadfastService.createParcel({
            invoice,
            recipient_name: name,
            recipient_phone: phone,
            recipient_address: address,
            cod_amount: finalCod,
            note: note || order.note || "Handle with care",
        });
    }
    else if (courierProvider === "PATHAO") {
        courierResult = yield pathao_service_1.PathaoService.createOrder({
            merchant_order_id: invoice,
            recipient_name: name,
            recipient_phone: phone,
            recipient_address: address,
            amount_to_collect: finalCod,
            special_instruction: note || order.note || "",
        });
    }
    else if (courierProvider === "REDX") {
        courierResult = yield redx_service_1.RedXService.createParcel({
            customer_name: name,
            customer_phone: phone,
            delivery_area: district || ((_k = order.shippingAddress) === null || _k === void 0 ? void 0 : _k.district) || "Dhaka",
            customer_address: address,
            merchant_invoice_id: invoice,
            cash_collection_amount: finalCod,
            instruction: note || order.note || "",
        });
    }
    else {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, `Unsupported courier provider: ${courierProvider}`);
    }
    // 5. Strict Courier API Response Validation (Zero DB writes if failure occurs)
    if (!courierResult || courierResult.success === false) {
        const errorMsg = (courierResult === null || courierResult === void 0 ? void 0 : courierResult.message) || `${courierProvider} rejected parcel creation due to validation errors`;
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, errorMsg);
    }
    const trackingCode = courierResult.trackingCode ? String(courierResult.trackingCode).trim() : null;
    const consignmentId = courierResult.consignmentId ? String(courierResult.consignmentId).trim() : null;
    if (!trackingCode || !consignmentId) {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, `${courierProvider} API response did not contain a valid tracking code or consignment ID. Order was NOT saved or updated.`);
    }
    // 6. DB Transaction: Executed ONLY after successful courier API response & verification
    const rawJson = typeof courierResult.data === "object" ? JSON.stringify(courierResult.data) : JSON.stringify(courierResult);
    const now = new Date();
    const [updatedOrder] = yield prisma_1.default.$transaction([
        // Update primary order fields with verified courier data
        prisma_1.default.order.update({
            where: { id: orderId },
            data: {
                courierProvider,
                trackingCode,
                consignmentId,
                courierStatus: "SHIPPED",
                sentToCourierAt: now,
                courierData: rawJson,
                status: "SHIPPED",
            },
        }),
        // Deactivate previous shipment history entries
        prisma_1.default.courierShipmentHistory.updateMany({
            where: { orderId, isCurrent: true },
            data: { isCurrent: false },
        }),
        // Append new shipment history entry
        prisma_1.default.courierShipmentHistory.create({
            data: {
                orderId,
                courierProvider,
                trackingCode,
                consignmentId,
                courierStatus: "SHIPPED",
                sentAt: now,
                courierData: courierResult.data ? JSON.parse(JSON.stringify(courierResult.data)) : courierResult,
                notes: note || (isReshipmentAllowed ? `Reshipped order via ${courierProvider}` : `Shipped via ${courierProvider}`),
                isCurrent: true,
            },
        }),
    ]);
    return {
        order: updatedOrder,
        courierResponse: courierResult,
        message: `Order #${invoice} successfully dispatched via ${courierProvider}! Consignment ID: ${consignmentId}, Tracking Code: ${trackingCode}`,
    };
});
const getCourierShipmentHistory = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!orderId)
        return [];
    return yield prisma_1.default.courierShipmentHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" },
    });
});
const resetCourierInfo = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_1.default.order.findUnique({
        where: { id: orderId },
    });
    if (!order) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    // Archive any current shipment history records
    yield prisma_1.default.courierShipmentHistory.updateMany({
        where: { orderId, isCurrent: true },
        data: { isCurrent: false },
    });
    // Clear courier tracking fields from Order record
    const updatedOrder = yield prisma_1.default.order.update({
        where: { id: orderId },
        data: {
            courierProvider: null,
            trackingCode: null,
            consignmentId: null,
            courierStatus: null,
            sentToCourierAt: null,
            courierData: null,
        },
    });
    return {
        order: updatedOrder,
        message: "Courier tracking info reset successfully. Order is ready for fresh courier dispatch.",
    };
});
exports.CourierServices = {
    dispatchOrderToCourier,
    getCourierShipmentHistory,
    resetCourierInfo,
};
