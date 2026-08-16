import { Request, Response } from "express";
import status from "http-status";
import { sendResponse } from "../../../helpers/sendResponse";
import { catchAsync } from "../../../helpers/trycatch";
import { AnalyticsServices } from "./analytics.services";

const trackEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.trackEvent(req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Event tracked successfully",
    data: result,
  });
});

const getAnalyticsOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.getAnalyticsOverview(req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Analytics overview retrieved successfully",
    data: result,
  });
});

const getProductAnalyticsList = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, searchTerm, timeRange, startDate, endDate } = req.query as any;
  const result = await AnalyticsServices.getProductAnalyticsList(
    { searchTerm, timeRange, startDate, endDate },
    { page, limit, sortBy, sortOrder }
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product analytics list retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleProductAnalytics = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const { timeRange, startDate, endDate } = req.query as any;
  const result = await AnalyticsServices.getSingleProductAnalytics(productId, {
    timeRange,
    startDate,
    endDate,
  });
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Single product analytics retrieved successfully",
    data: result,
  });
});

const getTopSearchQueries = catchAsync(async (req: Request, res: Response) => {
  const { timeRange, startDate, endDate } = req.query as any;
  const result = await AnalyticsServices.getTopSearchQueries({
    timeRange,
    startDate,
    endDate,
  });
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Top search queries retrieved successfully",
    data: result,
  });
});

const getAbandonedCartsList = catchAsync(async (req: Request, res: Response) => {
  const { timeRange, startDate, endDate, status: cartStatus } = req.query as any;
  const result = await AnalyticsServices.getAbandonedCartsList({
    timeRange,
    startDate,
    endDate,
    status: cartStatus,
  });
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned carts retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  trackEvent,
  getAnalyticsOverview,
  getProductAnalyticsList,
  getSingleProductAnalytics,
  getTopSearchQueries,
  getAbandonedCartsList,
};
