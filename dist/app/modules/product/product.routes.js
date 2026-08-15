"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const validateRequest_1 = __importDefault(require("../../middleWares/validateRequest"));
const product_controller_1 = require("./product.controller");
const product_validation_1 = require("./product.validation");
const fileUploader_1 = require("../../../helpers/fileUploader");
const productDetail_routes_1 = require("../productDetail/productDetail.routes");
const productVariant_routes_1 = require("../productVariant/productVariant.routes");
const router = express_1.default.Router();
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER);
// Product Image Management
router.post("/:productId/images", adminAuth, fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    return product_controller_1.ProductController.createProductImage(req, res, next);
});
router.delete("/images/:imageId", adminAuth, product_controller_1.ProductController.deleteProductImage);
// Base Product CRUD
router.post("/", adminAuth, fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    if (req.body.data) {
        req.body = JSON.parse(req.body.data);
    }
    return product_controller_1.ProductController.createProduct(req, res, next);
});
router.get("/all", adminAuth, product_controller_1.ProductController.getAllProductsAdmin);
router.get("/admin/:productId", adminAuth, product_controller_1.ProductController.getProductByIdAdmin);
// Returns category.attributeSchema for a product — used by frontend to render dynamic attribute form
router.get("/:productId/attribute-schema", product_controller_1.ProductController.getProductAttributeSchema);
router.patch("/:productId", adminAuth, (0, validateRequest_1.default)(product_validation_1.ProductValidation.updateProduct), product_controller_1.ProductController.updateProduct);
router.delete("/:productId", adminAuth, product_controller_1.ProductController.deleteProduct);
router.get("/", product_controller_1.ProductController.getPublishedProducts);
router.get("/slug/:productId", product_controller_1.ProductController.getPublishedProductById);
router.get("/:productId", product_controller_1.ProductController.getPublishedProductById);
// Nested sub-resource routes
router.use("/:productId/variants", productVariant_routes_1.productVariantRoutes);
router.use("/:productId/details", productDetail_routes_1.productDetailRoutes);
exports.productRoutes = router;
