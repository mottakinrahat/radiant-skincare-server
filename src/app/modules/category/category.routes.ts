import express, { NextFunction, Request, Response } from "express";
import { UserRole } from "../../../../prisma/generated/prisma";
import { auth } from "../../middleWares/auth";
import { CategoryController } from "./category.controller";
import { fileUploader } from "../../../helpers/fileUploader";

const router = express.Router();

const adminAuth = auth(UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Public routes
router.get("/", CategoryController.getAllCategories);
router.get("/:categoryId", CategoryController.getSingleCategory);

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
            req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
          } catch (e) {
            // ignore
          }
        }
        return CategoryController.createCategory(req, res, next);
      });
    }
    return CategoryController.createCategory(req, res, next);
  }
);

router.patch(
  "/:categoryId",
  adminAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return fileUploader.upload.single("file")(req, res, (err) => {
        if (err) return next(err);
        if (req.body?.data) {
          try {
            req.body = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
          } catch (e) {
            // ignore
          }
        }
        return CategoryController.updateCategory(req, res, next);
      });
    }
    return CategoryController.updateCategory(req, res, next);
  }
);

router.delete("/:categoryId", adminAuth, CategoryController.deleteCategory);

export const categoryRoutes = router;
