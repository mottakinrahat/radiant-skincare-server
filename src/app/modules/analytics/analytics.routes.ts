import express from "express";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { AnalyticsController } from "./analytics.controller";

const router = express.Router();
const adminAuth = auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN);

// Public fire-and-forget tracking endpoint (no auth required)
router.post("/track", AnalyticsController.trackEvent);

// Protected Admin reporting endpoints
router.get("/overview", adminAuth, AnalyticsController.getAnalyticsOverview);
router.get("/products", adminAuth, AnalyticsController.getProductAnalyticsList);
router.get("/products/:productId", adminAuth, AnalyticsController.getSingleProductAnalytics);
router.get("/searches", adminAuth, AnalyticsController.getTopSearchQueries);
router.get("/abandoned-carts", adminAuth, AnalyticsController.getAbandonedCartsList);

export const analyticsRoutes = router;
