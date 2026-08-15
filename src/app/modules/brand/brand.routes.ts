import express, { NextFunction, Request, Response } from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { BrandController } from "./brand.controller";

const router = express.Router();

const adminAuth = auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER);

// Public routes
router.get("/", BrandController.getAllBrands);
router.get("/:brandId", BrandController.getSingleBrand);

// Admin-only routes
router.post(
  "/",
  adminAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return fileUploader.upload.single("file")(req, res, (err) => {
        if (err) return next(err);
        if (req.body?.data) {
          try {
            req.body = JSON.parse(req.body.data);
          } catch (e) {
            // ignore
          }
        }
        return BrandController.createBrand(req, res, next);
      });
    }
    return BrandController.createBrand(req, res, next);
  }
);

router.patch(
  "/:brandId",
  adminAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return fileUploader.upload.single("file")(req, res, (err) => {
        if (err) return next(err);
        if (req.body?.data) {
          try {
            req.body = JSON.parse(req.body.data);
          } catch (e) {
            // ignore
          }
        }
        return BrandController.updateBrand(req, res, next);
      });
    }
    return BrandController.updateBrand(req, res, next);
  }
);

router.delete("/:brandId", adminAuth, BrandController.deleteBrand);

export const brandRoutes = router;
