import { Request, Response } from "express";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { GeoService } from "./geo.service";

const getDivisions = catchAsync(async (req: Request, res: Response) => {
  const result = await GeoService.getDivisions();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Divisions retrieved successfully",
    data: result.data,
  });
});

const getDistricts = catchAsync(async (req: Request, res: Response) => {
  const { divisionName } = req.params;
  const result = await GeoService.getDistricts(String(divisionName));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Districts retrieved successfully",
    data: result.data,
  });
});

const getUpazilas = catchAsync(async (req: Request, res: Response) => {
  const { districtName } = req.params;
  const result = await GeoService.getUpazilas(String(districtName));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Upazilas retrieved successfully",
    data: result.data,
  });
});

const getAllUpazilas = catchAsync(async (req: Request, res: Response) => {
  const result = await GeoService.getAllUpazilas();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All upazilas retrieved successfully",
    data: result.data,
  });
});

const getDeliveryCharge = catchAsync(async (req: Request, res: Response) => {
  const { districtName, upazilaName } = req.query;
  const result = await GeoService.getDeliveryCharge(
    districtName as string,
    upazilaName as string
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delivery charge calculated successfully",
    data: result.data,
  });
});

export const GeoController = {
  getDivisions,
  getDistricts,
  getUpazilas,
  getAllUpazilas,
  getDeliveryCharge,
};
