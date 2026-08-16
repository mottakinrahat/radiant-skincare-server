import express from "express";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { CourierController } from "./courier.controller";
import { FraudCheckController } from "../fraudCheck/fraudCheck.controller";

const router = express.Router();

// FraudBD phone check route
router.get(
  "/fraud-check/:phone",
  FraudCheckController.checkPhone
);

// Unified Multi-Courier Dispatch Route (Steadfast / Pathao / RedX)
router.post(
  "/dispatch",
  CourierController.dispatchOrder
);

// Shipment History for an Order
router.get(
  "/history/:orderId",
  CourierController.getShipmentHistory
);

// Reset Courier Info on Order (Unlink active shipment, archive in history)
router.delete(
  "/reset/:orderId",
  CourierController.resetCourierInfo
);

// Legacy Steadfast specific routes
router.post(
  "/steadfast/create",
  CourierController.sendOrderToSteadfast
);

router.get(
  "/steadfast/status/tracking/:trackingCode",
  CourierController.getSteadfastStatusByTrackingCode
);

router.get(
  "/steadfast/status/invoice/:invoice",
  CourierController.getSteadfastStatusByInvoice
);

router.get(
  "/steadfast/balance",
  CourierController.getSteadfastBalance
);

export const CourierRoutes = router;
