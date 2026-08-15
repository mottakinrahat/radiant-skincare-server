import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { FraudCheckService } from "./fraudCheck.service";

const checkPhone = catchAsync(async (req: Request, res: Response) => {
  const phone = req.params.phone as string;
  const result = await FraudCheckService.checkByPhone(phone);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud detection data retrieved successfully",
    data: result,
  });
});

export const FraudCheckController = {
  checkPhone,
};
