"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeSettingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const validateRequest_1 = __importDefault(require("../../middleWares/validateRequest"));
const storeSettings_controller_1 = require("./storeSettings.controller");
const storeSettings_validation_1 = require("./storeSettings.validation");
const router = express_1.default.Router();
// GET /store-settings ??? public, fetched by frontend on load for branding
router.get("/", storeSettings_controller_1.StoreSettingsController.getSettings);
// PUT / PATCH /store-settings ??? admin & manager, singleton upsert
router.put("/", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER), (0, validateRequest_1.default)(storeSettings_validation_1.StoreSettingsValidation.upsertSettings), storeSettings_controller_1.StoreSettingsController.upsertSettings);
router.patch("/", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER), (0, validateRequest_1.default)(storeSettings_validation_1.StoreSettingsValidation.upsertSettings), storeSettings_controller_1.StoreSettingsController.upsertSettings);
exports.storeSettingsRoutes = router;
