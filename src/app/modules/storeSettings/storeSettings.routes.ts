import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import validateRequest from "../../middleWares/validateRequest";
import { StoreSettingsController } from "./storeSettings.controller";
import { StoreSettingsValidation } from "./storeSettings.validation";

const router = express.Router();

// GET /store-settings ??? public, fetched by frontend on load for branding
router.get("/", StoreSettingsController.getSettings);

// PUT / PATCH /store-settings ??? admin & manager, singleton upsert
router.put(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  validateRequest(StoreSettingsValidation.upsertSettings),
  StoreSettingsController.upsertSettings,
);
router.patch(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER),
  validateRequest(StoreSettingsValidation.upsertSettings),
  StoreSettingsController.upsertSettings,
);

export const storeSettingsRoutes = router;
