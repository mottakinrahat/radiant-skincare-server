import { Request, Response } from "express";
import status from "http-status";
import { sendResponse } from "../../../helpers/sendResponse";
import { catchAsync } from "../../../helpers/trycatch";
import { LandingPageServices } from "./landingPage.services";

const upsertLandingPage = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageServices.upsertLandingPage(req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Landing page saved successfully",
    data: result,
  });
});

const getLandingPageBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await LandingPageServices.getLandingPageBySlug(slug as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Landing page retrieved successfully",
    data: result,
  });
});

const getAllLandingPages = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageServices.getAllLandingPages();
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Landing pages retrieved successfully",
    data: result,
  });
});

const deleteLandingPage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageServices.deleteLandingPage(id as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Landing page deleted successfully",
    data: result,
  });
});

// ─── Analytics Tracking Handlers ───────────────────────────────────────────

const trackCheckoutClick = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  await LandingPageServices.trackCheckoutClick(productId as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Checkout click tracked",
    data: null,
  });
});

const trackPurchase = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  await LandingPageServices.trackPurchase(productId as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Purchase tracked",
    data: null,
  });
});

const getLandingPageStats = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await LandingPageServices.getLandingPageStatsByProductId(productId as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Landing page stats retrieved",
    data: result,
  });
});

export const LandingPageController = {
  upsertLandingPage,
  getLandingPageBySlug,
  getAllLandingPages,
  deleteLandingPage,
  trackCheckoutClick,
  trackPurchase,
  getLandingPageStats,
};
