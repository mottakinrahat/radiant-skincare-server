"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productDetailRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const validateRequest_1 = __importDefault(require("../../middleWares/validateRequest"));
const productDetail_controller_1 = require("./productDetail.controller");
const productDetail_validation_1 = require("./productDetail.validation");
const router = express_1.default.Router({ mergeParams: true });
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER);
// POST   /products/:productId/details
router.post("/", adminAuth, (0, validateRequest_1.default)(productDetail_validation_1.ProductDetailValidation.createDetail), productDetail_controller_1.ProductDetailController.createDetail);
// GET    /products/:productId/details
router.get("/", productDetail_controller_1.ProductDetailController.getDetailsByProduct);
// GET    /products/:productId/details/:detailId
router.get("/:detailId", productDetail_controller_1.ProductDetailController.getSingleDetail);
// PATCH  /products/:productId/details/:detailId
router.patch("/:detailId", adminAuth, (0, validateRequest_1.default)(productDetail_validation_1.ProductDetailValidation.updateDetail), productDetail_controller_1.ProductDetailController.updateDetail);
// DELETE /products/:productId/details/:detailId
router.delete("/:detailId", adminAuth, productDetail_controller_1.ProductDetailController.deleteDetail);
exports.productDetailRoutes = router;
