import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import validateRequest from "../../middleWares/validateRequest";
import { ProductVariantController } from "./productVariant.controller";
import { ProductVariantValidation } from "./productVariant.validation";

const router = express.Router({ mergeParams: true });

const adminAuth = auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER);

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", ProductVariantController.getVariantAttributesByProduct);

router.post(
  "/",
  adminAuth,
  validateRequest(ProductVariantValidation.createVariantAttribute),
  ProductVariantController.createVariantAttribute
);

router.patch(
  "/:variantId",
  adminAuth,
  validateRequest(ProductVariantValidation.updateVariantAttribute),
  ProductVariantController.updateVariantAttribute
);

router.delete(
  "/:variantId",
  adminAuth,
  ProductVariantController.deleteVariantAttribute
);

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/:variantId/options",
  adminAuth,
  validateRequest(ProductVariantValidation.createVariantOption),
  ProductVariantController.addOptionToVariant
);

router.patch(
  "/options/:optionId",
  adminAuth,
  validateRequest(ProductVariantValidation.updateVariantOption),
  ProductVariantController.updateOption
);

router.delete(
  "/options/:optionId",
  adminAuth,
  ProductVariantController.deleteOption
);

// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION MATRIX ROUTES (/products/:productId/variants...)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/combinations/all",
  ProductVariantController.getCombinationsByProduct
);

router.post(
  "/combinations",
  adminAuth,
  validateRequest(ProductVariantValidation.createCombination),
  ProductVariantController.createCombination
);

router.patch(
  "/combinations/:combinationId",
  adminAuth,
  validateRequest(ProductVariantValidation.updateCombination),
  ProductVariantController.updateCombination
);

router.delete(
  "/combinations/:combinationId",
  adminAuth,
  ProductVariantController.deleteCombination
);

router.post(
  "/generate-matrix",
  adminAuth,
  validateRequest(ProductVariantValidation.generateMatrix),
  ProductVariantController.generateMatrixCombinations
);

export const productVariantRoutes = router;
