import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { AbandonedCartServices } from "./abandonedCart.services";

const createOrUpdateAbandonedCart = catchAsync(async (req: any, res: any) => {
  const result = await AbandonedCartServices.createOrUpdateAbandonedCartInDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned cart saved successfully",
    data: result,
  });
});

const getAbandonedCarts = catchAsync(async (_req: any, res: any) => {
  const result = await AbandonedCartServices.getAbandonedCartsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned carts retrieved successfully",
    data: result,
  });
});

const convertAbandonedCart = catchAsync(async (req: any, res: any) => {
  const result = await AbandonedCartServices.convertAbandonedCartInDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned cart status updated to CONVERTED",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const { status: cartStatus } = req.body;

  const result = await AbandonedCartServices.updateStatusInDB(id, cartStatus);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned cart status updated successfully",
    data: result,
  });
});

const updateFollowUpNote = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const { followUpNote } = req.body;

  const result = await AbandonedCartServices.updateFollowUpNoteInDB(id, followUpNote);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Follow-up note updated successfully",
    data: result,
  });
});

const deleteAbandonedCart = catchAsync(async (req: any, res: any) => {
  await AbandonedCartServices.deleteAbandonedCartFromDB(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Abandoned cart record deleted successfully",
    data: null,
  });
});

export const AbandonedCartController = {
  createOrUpdateAbandonedCart,
  getAbandonedCarts,
  convertAbandonedCart,
  updateStatus,
  updateFollowUpNote,
  deleteAbandonedCart,
};
