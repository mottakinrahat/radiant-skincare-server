import express from "express";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { OrderController } from "./order.controller";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.BUYER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.createOrder
);

router.get(
  "/my-orders",
  auth(UserRole.BUYER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.getMyOrders
);

router.get("/track", OrderController.trackOrderPublic);

router.get(
  "/all",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.getAllOrders
);

router.get(
  "/:id",
  auth(UserRole.BUYER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.getOrderById
);

router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.updateOrderStatus
);

router.patch(
  "/:id/payment-status",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.updatePaymentStatus
);

router.patch(
  "/:id/courier-info",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.updateOrderCourierInfo
);

router.delete(
  "/:id/courier-info",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  OrderController.clearOrderCourierInfo
);

export const orderRoutes = router;
