"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../middleWares/auth");
const prisma_1 = require("../../../../prisma/generated/prisma");
const fileUploader_1 = require("../../../helpers/fileUploader");
const user_validation_1 = require("./user.validation");
const validateRequest_1 = __importDefault(require("../../middleWares/validateRequest"));
const router = express_1.default.Router();
router.get("/me", (0, auth_1.auth)(prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.ADMIN, prisma_1.UserRole.BUYER, prisma_1.UserRole.MANAGER), user_controller_1.UserController.getMyProfile);
router.post("/create-admin", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.SUPER_ADMIN), fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    var _a;
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
        try {
            req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
        }
        catch (e) {
            // keep req.body
        }
    }
    return user_controller_1.UserController.createAdminUser(req, res, next);
}); //
router.post("/create-manager", (0, auth_1.auth)(prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.ADMIN), fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    var _a;
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
        try {
            req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
        }
        catch (e) {
            // keep req.body
        }
    }
    return user_controller_1.UserController.createManager(req, res, next);
}); //
router.post("/create-buyer", (0, validateRequest_1.default)(user_validation_1.UserValidation.createBuyerValidationSchema), user_controller_1.UserController.createBuyer); //
router.get("/", (0, auth_1.auth)(prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.ADMIN), user_controller_1.UserController.getAllUser);
router.patch("/:id/status", (0, auth_1.auth)(prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.ADMIN), user_controller_1.UserController.changeProfileStatus);
router.patch("/update-my-profile", (0, auth_1.auth)(prisma_1.UserRole.SUPER_ADMIN, prisma_1.UserRole.ADMIN, prisma_1.UserRole.BUYER, prisma_1.UserRole.MANAGER), fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    return user_controller_1.UserController.updateMyProfile(req, res, next);
});
exports.userRoutes = router;
