"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourierRoutes = void 0;
const express_1 = __importDefault(require("express"));
const courier_controller_1 = require("./courier.controller");
const fraudCheck_controller_1 = require("../fraudCheck/fraudCheck.controller");
const router = express_1.default.Router();
// FraudBD phone check route
router.get("/fraud-check/:phone", fraudCheck_controller_1.FraudCheckController.checkPhone);
// Unified Multi-Courier Dispatch Route (Steadfast / Pathao / RedX)
router.post("/dispatch", courier_controller_1.CourierController.dispatchOrder);
// Shipment History for an Order
router.get("/history/:orderId", courier_controller_1.CourierController.getShipmentHistory);
// Reset Courier Info on Order (Unlink active shipment, archive in history)
router.delete("/reset/:orderId", courier_controller_1.CourierController.resetCourierInfo);
// Legacy Steadfast specific routes
router.post("/steadfast/create", courier_controller_1.CourierController.sendOrderToSteadfast);
router.get("/steadfast/status/tracking/:trackingCode", courier_controller_1.CourierController.getSteadfastStatusByTrackingCode);
router.get("/steadfast/status/invoice/:invoice", courier_controller_1.CourierController.getSteadfastStatusByInvoice);
router.get("/steadfast/balance", courier_controller_1.CourierController.getSteadfastBalance);
exports.CourierRoutes = router;
