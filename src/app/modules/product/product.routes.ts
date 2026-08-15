import express, { NextFunction, Request, Response } from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import validateRequest from "../../middleWares/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";
import { fileUploader } from "../../../helpers/fileUploader";
import { productDetailRoutes } from "../productDetail/productDetail.routes";
import { productVariantRoutes } from "../productVariant/productVariant.routes";

const router = express.Router();

const adminAuth = auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER);

// Product Image Management
router.post(
  "/:productId/images",
  adminAuth,
  fileUploader.upload.any(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      try {
        req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch (e) {}
    }
    return ProductController.createProductImage(req, res, next);
  },
);

router.delete(
  "/images/:imageId",
  adminAuth,
  ProductController.deleteProductImage,
);

// Base Product CRUD
router.post(
  "/",
  adminAuth,
  fileUploader.upload.any(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      try {
        req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch (e) {}
    }
    return ProductController.createProduct(req, res, next);
  },
);

router.get("/all", adminAuth, ProductController.getAllProductsAdmin);

router.get(
  "/admin/:productId",
  adminAuth,
  ProductController.getProductByIdAdmin,
);

// Returns category.attributeSchema for a product — used by frontend to render dynamic attribute form
router.get(
  "/:productId/attribute-schema",
  ProductController.getProductAttributeSchema,
);

router.patch(
  "/:productId",
  adminAuth,
  validateRequest(ProductValidation.updateProduct),
  ProductController.updateProduct,
);

router.delete("/:productId", adminAuth, ProductController.deleteProduct);

router.get("/", ProductController.getPublishedProducts);

router.get("/slug/:productId", ProductController.getPublishedProductById);
router.get("/:productId", ProductController.getPublishedProductById);

// Nested sub-resource routes
router.use("/:productId/variants", productVariantRoutes);
router.use("/:productId/details", productDetailRoutes);

export const productRoutes = router;
