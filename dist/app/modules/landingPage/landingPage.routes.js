"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.landingPageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleWares/auth");
const prisma_1 = require("../../../../prisma/generated/prisma");
const landingPage_controller_1 = require("./landingPage.controller");
const router = express_1.default.Router();
// Public routes
router.get("/public/:slug", landingPage_controller_1.LandingPageController.getLandingPageBySlug);
// Analytics: public (no auth) — fire-and-forget from frontend
router.post("/track/:productId/checkout", landingPage_controller_1.LandingPageController.trackCheckoutClick);
router.post("/track/:productId/purchase", landingPage_controller_1.LandingPageController.trackPurchase);
// Admin: get stats for a product's landing page
router.get("/stats/:productId", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN), landingPage_controller_1.LandingPageController.getLandingPageStats);
// Admin routes
router.post("/", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN), landingPage_controller_1.LandingPageController.upsertLandingPage);
router.get("/all", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN), landingPage_controller_1.LandingPageController.getAllLandingPages);
router.delete("/:id", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN), landingPage_controller_1.LandingPageController.deleteLandingPage);
exports.landingPageRoutes = router;
