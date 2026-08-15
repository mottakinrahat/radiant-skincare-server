import express from "express";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { LandingPageController } from "./landingPage.controller";

const router = express.Router();

// Public routes
router.get("/public/:slug", LandingPageController.getLandingPageBySlug);

// Analytics: public (no auth) — fire-and-forget from frontend
router.post("/track/:productId/checkout", LandingPageController.trackCheckoutClick);
router.post("/track/:productId/purchase", LandingPageController.trackPurchase);

// Admin: get stats for a product's landing page
router.get(
  "/stats/:productId",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  LandingPageController.getLandingPageStats
);

// Admin routes
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  LandingPageController.upsertLandingPage
);

router.get(
  "/all",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  LandingPageController.getAllLandingPages
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN),
  LandingPageController.deleteLandingPage
);

export const landingPageRoutes = router;
