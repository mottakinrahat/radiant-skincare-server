import status from "http-status";
import { catchAsync } from "../../../helpers/trycatch";
import { sendResponse } from "../../../helpers/sendResponse";
import { ProductVariantServices } from "./productVariant.services";

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE CONTROLLERS (e.g. Color, Size, Weight)
// ─────────────────────────────────────────────────────────────────────────────
const createVariantAttribute = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductVariantServices.createVariantAttribute(productId, req);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Variant attribute created successfully",
    data: result,
  });
});

const getVariantAttributesByProduct = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductVariantServices.getVariantAttributesByProduct(productId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant attributes retrieved successfully",
    data: result,
  });
});

const updateVariantAttribute = catchAsync(async (req: any, res: any) => {
  const { productId, variantId } = req.params;
  const result = await ProductVariantServices.updateVariantAttribute(productId, variantId, req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant attribute updated successfully",
    data: result,
  });
});

const deleteVariantAttribute = catchAsync(async (req: any, res: any) => {
  const { productId, variantId } = req.params;
  await ProductVariantServices.deleteVariantAttribute(productId, variantId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant attribute deleted successfully",
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION CONTROLLERS (e.g. Red, Blue, XL)
// ─────────────────────────────────────────────────────────────────────────────
const addOptionToVariant = catchAsync(async (req: any, res: any) => {
  const { productId, variantId } = req.params;
  const result = await ProductVariantServices.addOptionToVariant(productId, variantId, req);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Option added to variant successfully",
    data: result,
  });
});

const updateOption = catchAsync(async (req: any, res: any) => {
  const { productId, optionId } = req.params;
  const result = await ProductVariantServices.updateOption(productId, optionId, req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant option updated successfully",
    data: result,
  });
});

const deleteOption = catchAsync(async (req: any, res: any) => {
  const { productId, optionId } = req.params;
  await ProductVariantServices.deleteOption(productId, optionId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant option deleted successfully",
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION CONTROLLERS (Crossed Matrix SKU Items)
// ─────────────────────────────────────────────────────────────────────────────
const getCombinationsByProduct = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductVariantServices.getCombinationsByProduct(productId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant combinations retrieved successfully",
    data: result,
  });
});

const createCombination = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductVariantServices.createCombination(productId, req);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Variant combination created successfully",
    data: result,
  });
});

const updateCombination = catchAsync(async (req: any, res: any) => {
  const { productId, combinationId } = req.params;
  const result = await ProductVariantServices.updateCombination(productId, combinationId, req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant combination updated successfully",
    data: result,
  });
});

const deleteCombination = catchAsync(async (req: any, res: any) => {
  const { productId, combinationId } = req.params;
  await ProductVariantServices.deleteCombination(productId, combinationId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Variant combination deleted successfully",
    data: null,
  });
});

const generateMatrixCombinations = catchAsync(async (req: any, res: any) => {
  const { productId } = req.params;
  const result = await ProductVariantServices.generateMatrixCombinations(productId, req);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Crossed variant matrix combinations generated successfully",
    data: result,
  });
});

export const ProductVariantController = {
  createVariantAttribute,
  getVariantAttributesByProduct,
  updateVariantAttribute,
  deleteVariantAttribute,
  addOptionToVariant,
  updateOption,
  deleteOption,
  getCombinationsByProduct,
  createCombination,
  updateCombination,
  deleteCombination,
  generateMatrixCombinations,
};
