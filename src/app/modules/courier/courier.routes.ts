import express from "express";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { CourierController } from "./courier.controller";
import { FraudCheckController } from "../fraudCheck/fraudCheck.controller";

const router = express.Router();

// FraudBD phone check route
router.get(
  "/fraud-check/:phone",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  FraudCheckController.checkPhone
);

// Unified Multi-Courier Dispatch Route (Steadfast / Pathao / RedX)
router.post(
  "/dispatch",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.dispatchOrder
);

// Shipment History for an Order
router.get(
  "/history/:orderId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.getShipmentHistory
);

// Reset Courier Info on Order (Unlink active shipment, archive in history)
router.delete(
  "/reset/:orderId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.resetCourierInfo
);

// Legacy Steadfast specific routes
router.post(
  "/steadfast/create",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.sendOrderToSteadfast
);

router.get(
  "/steadfast/status/tracking/:trackingCode",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.getSteadfastStatusByTrackingCode
);

router.get(
  "/steadfast/status/invoice/:invoice",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.getSteadfastStatusByInvoice
);

router.get(
  "/steadfast/balance",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  CourierController.getSteadfastBalance
);

export const CourierRoutes = router;
