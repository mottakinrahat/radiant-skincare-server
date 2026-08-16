"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleWares/auth");
const prisma_1 = require("../../../../prisma/generated/prisma");
const analytics_controller_1 = require("./analytics.controller");
const router = express_1.default.Router();
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN);
// Public fire-and-forget tracking endpoint (no auth required)
router.post("/track", analytics_controller_1.AnalyticsController.trackEvent);
// Protected Admin reporting endpoints
router.get("/overview", adminAuth, analytics_controller_1.AnalyticsController.getAnalyticsOverview);
router.get("/products", adminAuth, analytics_controller_1.AnalyticsController.getProductAnalyticsList);
router.get("/products/:productId", adminAuth, analytics_controller_1.AnalyticsController.getSingleProductAnalytics);
router.get("/searches", adminAuth, analytics_controller_1.AnalyticsController.getTopSearchQueries);
router.get("/abandoned-carts", adminAuth, analytics_controller_1.AnalyticsController.getAbandonedCartsList);
exports.analyticsRoutes = router;
