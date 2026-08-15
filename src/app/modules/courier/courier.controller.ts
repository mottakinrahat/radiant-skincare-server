import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { SteadfastService } from "./steadfast.service";
import { CourierServices } from "./courier.services";

const dispatchOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierServices.dispatchOrderToCourier(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message || "Order dispatched to courier successfully",
    data: result,
  });
});

const getShipmentHistory = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const result = await CourierServices.getCourierShipmentHistory(orderId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Courier shipment history retrieved successfully",
    data: result,
  });
});

const resetCourierInfo = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const result = await CourierServices.resetCourierInfo(orderId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message || "Courier info reset successfully",
    data: result,
  });
});

const sendOrderToSteadfast = catchAsync(async (req: Request, res: Response) => {
  const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = req.body;

  const result = await SteadfastService.createParcel({
    invoice,
    recipient_name,
    recipient_phone,
    recipient_address,
    cod_amount,
    note,
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Parcel sent to Steadfast Courier successfully",
    data: result,
  });
});

const getSteadfastStatusByTrackingCode = catchAsync(async (req: Request, res: Response) => {
  const trackingCode = req.params.trackingCode as string;
  const result = await SteadfastService.trackByTrackingCode(trackingCode);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tracking status retrieved successfully",
    data: result,
  });
});

const getSteadfastStatusByInvoice = catchAsync(async (req: Request, res: Response) => {
  const invoice = req.params.invoice as string;
  const result = await SteadfastService.trackByInvoice(invoice);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tracking status retrieved successfully",
    data: result,
  });
});

const getSteadfastBalance = catchAsync(async (req: Request, res: Response) => {
  const result = await SteadfastService.getBalance();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Steadfast balance retrieved successfully",
    data: result,
  });
});

export const CourierController = {
  dispatchOrder,
  getShipmentHistory,
  resetCourierInfo,
  sendOrderToSteadfast,
  getSteadfastStatusByTrackingCode,
  getSteadfastStatusByInvoice,
  getSteadfastBalance,
};
