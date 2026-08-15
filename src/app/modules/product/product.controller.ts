import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { pick } from "../../../shared/pick";
import { productFilterableFields } from "./product.constant";
import { ProductServices } from "./product.services";

const createProduct = catchAsync(async (req: any, res: any) => {
  const user = req.user;

  const result = await ProductServices.createProductIntoDB(req, user);

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Product created successfully",
    data: result,
  });
});

const getPublishedProducts = catchAsync(async (req: any, res: any) => {
  const filter = pick(req.query, productFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ProductServices.getProductsFromDB(filter, options);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllProductsAdmin = catchAsync(async (req: any, res: any) => {
  const filter = pick(req.query, productFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ProductServices.getProductsFromDB(filter, options);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPublishedProductById = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductServices.getSingleProductFromDB(productId, {
    publishedOnly: true,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const getProductByIdAdmin = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductServices.getSingleProductFromDB(productId, {
    publishedOnly: false,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const body = req.body;

  const result = await ProductServices.updateProductIntoDB(productId, body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  await ProductServices.deleteProductIntoDB(productId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product deleted successfully",
    data: null,
  });
});

const getProductAttributeSchema = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductServices.getProductAttributeSchema(productId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Product attribute schema retrieved successfully",
    data: result,
  });
});

const createProductImage = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductServices.createProductImageIntoDB(productId, req);

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Product image uploaded successfully",
    data: result,
  });
});

const deleteProductImage = catchAsync(async (req: any, res: any) => {
  const { imageId } = req.params;
  await ProductServices.deleteProductImageIntoDB(imageId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Image deleted successfully",
    data: null,
  });
});

export const ProductController = {
  createProduct,
  getPublishedProducts,
  getAllProductsAdmin,
  getPublishedProductById,
  getProductByIdAdmin,
  updateProduct,
  deleteProduct,
  getProductAttributeSchema,
  createProductImage,
  deleteProductImage,
};
