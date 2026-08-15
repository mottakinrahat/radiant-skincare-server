"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../../prisma/generated/prisma");
const auth_1 = require("../../middleWares/auth");
const category_controller_1 = require("./category.controller");
const fileUploader_1 = require("../../../helpers/fileUploader");
const router = express_1.default.Router();
const adminAuth = (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN);
// Public routes
router.get("/", category_controller_1.CategoryController.getAllCategories);
router.get("/:categoryId", category_controller_1.CategoryController.getSingleCategory);
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
                    req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
                }
                catch (e) {
                    // ignore
                }
            }
            return category_controller_1.CategoryController.createCategory(req, res, next);
        });
    }
    return category_controller_1.CategoryController.createCategory(req, res, next);
});
router.patch("/:categoryId", adminAuth, (req, res, next) => {
    var _a;
    if ((_a = req.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.includes("multipart/form-data")) {
        return fileUploader_1.fileUploader.upload.single("file")(req, res, (err) => {
            var _a;
            if (err)
                return next(err);
            if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                try {
                    req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
                }
                catch (e) {
                    // ignore
                }
            }
            return category_controller_1.CategoryController.updateCategory(req, res, next);
        });
    }
    return category_controller_1.CategoryController.updateCategory(req, res, next);
});
router.delete("/:categoryId", adminAuth, category_controller_1.CategoryController.deleteCategory);
exports.categoryRoutes = router;
