"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productVariantRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const validateRequest_1 = __importDefault(require("../../middleWares/validateRequest"));
const productVariant_controller_1 = require("./productVariant.controller");
const productVariant_validation_1 = require("./productVariant.validation");
const router = express_1.default.Router({ mergeParams: true });
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER);
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", productVariant_controller_1.ProductVariantController.getVariantAttributesByProduct);
router.post("/", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.createVariantAttribute), productVariant_controller_1.ProductVariantController.createVariantAttribute);
router.patch("/:variantId", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.updateVariantAttribute), productVariant_controller_1.ProductVariantController.updateVariantAttribute);
router.delete("/:variantId", adminAuth, productVariant_controller_1.ProductVariantController.deleteVariantAttribute);
// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:variantId/options", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.createVariantOption), productVariant_controller_1.ProductVariantController.addOptionToVariant);
router.patch("/options/:optionId", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.updateVariantOption), productVariant_controller_1.ProductVariantController.updateOption);
router.delete("/options/:optionId", adminAuth, productVariant_controller_1.ProductVariantController.deleteOption);
// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION MATRIX ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/combinations/all", productVariant_controller_1.ProductVariantController.getCombinationsByProduct);
router.post("/combinations", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.createCombination), productVariant_controller_1.ProductVariantController.createCombination);
router.patch("/combinations/:combinationId", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.updateCombination), productVariant_controller_1.ProductVariantController.updateCombination);
router.delete("/combinations/:combinationId", adminAuth, productVariant_controller_1.ProductVariantController.deleteCombination);
router.post("/generate-matrix", adminAuth, (0, validateRequest_1.default)(productVariant_validation_1.ProductVariantValidation.generateMatrix), productVariant_controller_1.ProductVariantController.generateMatrixCombinations);
exports.productVariantRoutes = router;
