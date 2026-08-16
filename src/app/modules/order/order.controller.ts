import { Request, Response } from "express";
import status from "http-status";
import { sendResponse } from "../../../helpers/sendResponse";
import { catchAsync } from "../../../helpers/trycatch";
import { OrderServices } from "./order.services";
import { UserRole } from "../../../../prisma/generated/prisma";
import prisma from "../../../shared/prisma";

const createOrder = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  let userEmail = req.user?.email || req.body?.email || req.body?.shippingAddress?.email;
  const phone = req.body?.phone || req.body?.shippingAddress?.phoneNumber || req.body?.shippingAddress?.phone || "";

  if (!userEmail) {
    userEmail = `buyer_${String(phone).replace(/\D/g, "") || Date.now()}@radiantskincare.com`;
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: userEmail },
        ...(phone ? [{ contactNumber: String(phone) }] : []),
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: req.body?.shippingAddress?.name || req.body?.name || "Customer",
        email: userEmail,
        contactNumber: phone ? String(phone) : null,
        role: UserRole.BUYER,
        password: "guest_buyer_account",
      },
    });
  }

  const result = await OrderServices.createOrder(user.email, req.body, { clientIp, userAgent });
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order created successfully",
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await OrderServices.getOrdersForUser(req.user.email);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.getOrderById(id as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order retrieved successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrders();
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "All orders retrieved successfully",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status: orderStatus } = req.body;
  const result = await OrderServices.updateOrderStatus(id as string, orderStatus);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order status updated successfully",
    data: result,
  });
});

const updatePaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  const result = await OrderServices.updatePaymentStatus(id as string, paymentStatus);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment status updated successfully",
    data: result,
  });
});

const updateOrderCourierInfo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.updateOrderCourierInfo(id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order courier info updated successfully",
    data: result,
  });
});

const trackOrderPublic = catchAsync(async (req: Request, res: Response) => {
  const { orderId, orderNumber, phone } = req.query;
  const orderQuery = (orderNumber || orderId) as string;
  const result = await OrderServices.trackOrderPublic(orderQuery, phone as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order tracked successfully",
    data: result,
  });
});

const clearOrderCourierInfo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.clearOrderCourierInfo(id as string);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order courier info cleared successfully",
    data: result,
  });
});


const deleteOrder = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await OrderServices.deleteOrder(id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Order deleted successfully",
    data: result,
  });
});

export const OrderController = {
  deleteOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrderPublic,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderCourierInfo,
  clearOrderCourierInfo,
};
