"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.abandonedCartRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const abandonedCart_controller_1 = require("./abandonedCart.controller");
const router = express_1.default.Router();
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER);
// Public route for checkout auto-capture
router.post("/", abandonedCart_controller_1.AbandonedCartController.createOrUpdateAbandonedCart);
router.patch("/convert", abandonedCart_controller_1.AbandonedCartController.convertAbandonedCart);
// Protected admin routes
router.get("/", adminAuth, abandonedCart_controller_1.AbandonedCartController.getAbandonedCarts);
router.patch("/:id/status", adminAuth, abandonedCart_controller_1.AbandonedCartController.updateStatus);
router.patch("/:id/follow-up", adminAuth, abandonedCart_controller_1.AbandonedCartController.updateFollowUpNote);
router.delete("/:id", adminAuth, abandonedCart_controller_1.AbandonedCartController.deleteAbandonedCart);
exports.abandonedCartRoutes = router;
