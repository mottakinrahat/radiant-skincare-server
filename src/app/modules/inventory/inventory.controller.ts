import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { InventoryServices } from "./inventory.services";

const getInventory = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryServices.getAllInventory(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Inventory retrieved successfully",
    data: result,
  });
});

const adjustStock = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryServices.adjustStock(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Stock adjusted successfully",
    data: result,
  });
});

const getStockHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryServices.getStockHistory(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Stock history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getProductStockHistory = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const result = await InventoryServices.getStockHistory({ productId, ...req.query });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Product stock history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const InventoryController = {
  getInventory,
  adjustStock,
  getStockHistory,
  getProductStockHistory,
};
