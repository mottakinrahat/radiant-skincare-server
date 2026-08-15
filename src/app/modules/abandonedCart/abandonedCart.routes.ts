import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import { AbandonedCartController } from "./abandonedCart.controller";

const router = express.Router();
const adminAuth = auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER);

// Public route for checkout auto-capture
router.post("/", AbandonedCartController.createOrUpdateAbandonedCart);
router.patch("/convert", AbandonedCartController.convertAbandonedCart);

// Protected admin routes
router.get("/", adminAuth, AbandonedCartController.getAbandonedCarts);
router.patch("/:id/status", adminAuth, AbandonedCartController.updateStatus);
router.patch("/:id/follow-up", adminAuth, AbandonedCartController.updateFollowUpNote);
router.delete("/:id", adminAuth, AbandonedCartController.deleteAbandonedCart);

export const abandonedCartRoutes = router;
