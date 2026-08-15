"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const fileUploader_1 = require("../../../helpers/fileUploader");
const brand_controller_1 = require("./brand.controller");
const router = express_1.default.Router();
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.MANAGER);
// Public routes
router.get("/", brand_controller_1.BrandController.getAllBrands);
router.get("/:brandId", brand_controller_1.BrandController.getSingleBrand);
// Admin-only routes
router.post("/", adminAuth, (req, res, next) => {
    var _a;
    if ((_a = req.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.includes("multipart/form-data")) {
        return fileUploader_1.fileUploader.upload.single("file")(req, res, (err) => {
            var _a;
            if (err)
                return next(err);
            if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                }
                catch (e) {
                    // ignore
                }
            }
            return brand_controller_1.BrandController.createBrand(req, res, next);
        });
    }
    return brand_controller_1.BrandController.createBrand(req, res, next);
});
router.patch("/:brandId", adminAuth, (req, res, next) => {
    var _a;
    if ((_a = req.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.includes("multipart/form-data")) {
        return fileUploader_1.fileUploader.upload.single("file")(req, res, (err) => {
            var _a;
            if (err)
                return next(err);
            if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                }
                catch (e) {
                    // ignore
                }
            }
            return brand_controller_1.BrandController.updateBrand(req, res, next);
        });
    }
    return brand_controller_1.BrandController.updateBrand(req, res, next);
});
router.delete("/:brandId", adminAuth, brand_controller_1.BrandController.deleteBrand);
exports.brandRoutes = router;
