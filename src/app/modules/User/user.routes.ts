import express, { NextFunction, Request, Response } from "express";
import { UserController } from "./user.controller";
import { auth } from "../../middleWares/auth";
import { UserRole } from "../../../../prisma/generated/prisma";
import { fileUploader } from "../../../helpers/fileUploader";
import { UserValidation } from "./user.validation";
import validateRequest from "../../middleWares/validateRequest";

const router = express.Router();

router.get(
  "/me",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUYER, UserRole.MANAGER),
  UserController.getMyProfile,
);
router.post(
  "/create-admin",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      try {
        req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch (e) {
        // keep req.body
      }
    }
    return UserController.createAdminUser(req, res, next);
  },
); //

router.post(
  "/create-manager",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      try {
        req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      } catch (e) {
        // keep req.body
      }
    }
    return UserController.createManager(req, res, next);
  },
); //
router.post(
  "/create-buyer",
  validateRequest(UserValidation.createBuyerValidationSchema),
  UserController.createBuyer,
); //
router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.getAllUser,
);

router.patch(
  "/:id/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.changeProfileStatus,
);
router.patch(
  "/update-my-profile",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUYER, UserRole.MANAGER),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body=JSON.parse(req.body.data)
    return UserController.updateMyProfile(req, res,next);
  }
);
export const userRoutes = router;
