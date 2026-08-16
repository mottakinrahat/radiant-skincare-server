import express from "express";
import { OrderController } from "./order.controller";

const router = express.Router();

router.post("/", OrderController.createOrder);
router.get("/my-orders", OrderController.getMyOrders);
router.get("track", OrderController.trackOrderPublic);
router.get("/all", OrderController.getAllOrders);
router.get("/", OrderController.getAllOrders);
router.get("/:id", OrderController.getOrderById);
router.patch("/:id/status", OrderController.updateOrderStatus);
router.patch("/:id/payment-status", OrderController.updatePaymentStatus);
router.patch("/:id/courier-info", OrderController.updateOrderCourierInfo);
router.delete("/:id/courier-info", OrderController.clearOrderCourierInfo);

router.delete("/:id", OrderController.deleteOrder);

export const orderRoutes = router;
