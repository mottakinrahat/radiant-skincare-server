import status from "http-status";
import ApiError from "../../errors/apiError";
import prisma from "../../../shared/prisma";

const assertProductExists = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }
  return product;
};

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT ATTRIBUTE (ProductVariant: e.g. Color, Size, Weight)
// ─────────────────────────────────────────────────────────────────────────────
const createVariantAttribute = async (productId: string, req: any) => {
  await assertProductExists(productId);
  const data = req.body;

  const result = await prisma.productVariant.create({
    data: {
      productId,
      variantTitle: data.variantTitle,
      isRequired: data.isRequired ?? false,
      sortOrder: data.sortOrder ?? 0,
      ...(Array.isArray(data.options) && data.options.length > 0
        ? {
            options: {
              create: data.options.map((opt: any, idx: number) => ({
                value: opt.value,
                priceAdjustment: Number(opt.priceAdjustment ?? 0),
                quantity: Number(opt.quantity ?? opt.stock ?? opt.stockQuantity ?? 0),
                sku: opt.sku || null,
                status: opt.status || "ACTIVE",
                sortOrder: opt.sortOrder ?? idx + 1,
              })),
            },
          }
        : {}),
    },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return result;
};

const getVariantAttributesByProduct = async (productId: string) => {
  await assertProductExists(productId);
  return prisma.productVariant.findMany({
    where: { productId },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
};

const updateVariantAttribute = async (
  productId: string,
  variantId: string,
  req: any
) => {
  await assertProductExists(productId);
  const data = req.body;

  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Variant attribute not found for this product");
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(data.variantTitle && { variantTitle: data.variantTitle }),
      ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
};

const deleteVariantAttribute = async (productId: string, variantId: string) => {
  await assertProductExists(productId);
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Variant attribute not found for this product");
  }

  const deleted = await prisma.productVariant.delete({
    where: { id: variantId },
  });

  // Check remaining attributes — if fewer than 2, clean up combinations
  const remainingVariants = await prisma.productVariant.findMany({
    where: { productId },
    include: { options: true },
  });
  const validRemaining = remainingVariants.filter((v) => v.options.length > 0);
  if (validRemaining.length === 0) {
    await prisma.productVariantCombination.deleteMany({
      where: { productId },
    });
  }

  return deleted;
};

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT OPTION (ProductVariantOption: e.g. Red, Blue, XL)
// ─────────────────────────────────────────────────────────────────────────────
const addOptionToVariant = async (
  productId: string,
  variantId: string,
  req: any
) => {
  await assertProductExists(productId);
  const data = req.body;

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) {
    throw new ApiError(status.NOT_FOUND, "Variant attribute not found for this product");
  }

  return prisma.productVariantOption.create({
    data: {
      variantId,
      value: data.value,
      priceAdjustment: Number(data.priceAdjustment ?? 0),
      quantity: Number(data.quantity ?? data.stock ?? data.stockQuantity ?? 0),
      sku: data.sku || null,
      status: data.status || "ACTIVE",
      sortOrder: data.sortOrder ?? 0,
    },
  });
};

const updateOption = async (productId: string, optionId: string, req: any) => {
  await assertProductExists(productId);
  const data = req.body;

  const option = await prisma.productVariantOption.findFirst({
    where: { id: optionId, variant: { productId } },
  });
  if (!option) {
    throw new ApiError(status.NOT_FOUND, "Option not found for this product");
  }

  const quantityToSet =
    data.quantity !== undefined
      ? Number(data.quantity)
      : data.stock !== undefined
      ? Number(data.stock)
      : data.stockQuantity !== undefined
      ? Number(data.stockQuantity)
      : undefined;

  return prisma.productVariantOption.update({
    where: { id: optionId },
    data: {
      ...(data.value && { value: data.value }),
      ...(data.priceAdjustment !== undefined && {
        priceAdjustment: Number(data.priceAdjustment),
      }),
      ...(quantityToSet !== undefined && {
        quantity: Math.max(0, quantityToSet),
      }),
      ...(data.sku !== undefined && { sku: data.sku || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
};

const deleteOption = async (productId: string, optionId: string) => {
  await assertProductExists(productId);
  const option = await prisma.productVariantOption.findFirst({
    where: { id: optionId, variant: { productId } },
  });
  if (!option) {
    throw new ApiError(status.NOT_FOUND, "Option not found for this product");
  }

  const deleted = await prisma.productVariantOption.delete({
    where: { id: optionId },
  });

  // Check remaining attributes — if fewer than 2 valid attributes remain, clean up combinations
  const remainingVariants = await prisma.productVariant.findMany({
    where: { productId },
    include: { options: true },
  });
  const validRemaining = remainingVariants.filter((v) => v.options.length > 0);
  if (validRemaining.length === 0) {
    await prisma.productVariantCombination.deleteMany({
      where: { productId },
    });
  }

  return deleted;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION (ProductVariantCombination: crossed Matrix SKU items)
// ─────────────────────────────────────────────────────────────────────────────
const getCombinationsByProduct = async (productId: string) => {
  await assertProductExists(productId);
  return prisma.productVariantCombination.findMany({
    where: { productId },
    include: {
      options: {
        include: {
          option: {
            include: {
              variant: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

const createCombination = async (productId: string, req: any) => {
  const product = await assertProductExists(productId);
  const { sku, quantity, finalPrice, imageId, status: combStatus, optionIds } = req.body;

  let calculatedPrice = finalPrice !== undefined ? Number(finalPrice) : 0;

  // Auto-calculate finalPrice if 0 or not provided
  if (!calculatedPrice && Array.isArray(optionIds) && optionIds.length > 0) {
    const selectedOptions = await prisma.productVariantOption.findMany({
      where: { id: { in: optionIds } },
    });
    const priceAdjustmentsSum = selectedOptions.reduce(
      (sum, opt) => sum + Number(opt.priceAdjustment || 0),
      0
    );
    const baseProductPrice = product.sellingPrice ?? product.buyingPrice ?? 0;
    calculatedPrice = Math.max(0, baseProductPrice + priceAdjustmentsSum);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const combination = await tx.productVariantCombination.create({
        data: {
          productId,
          sku,
          quantity: Number(quantity ?? 0),
          finalPrice: calculatedPrice,
          imageId: imageId || null,
          status: combStatus || "ACTIVE",
          ...(Array.isArray(optionIds) && optionIds.length > 0
            ? {
                options: {
                  create: optionIds.map((optId: string) => ({
                    productVariantOptionId: optId,
                  })),
                },
              }
            : {}),
        },
        include: {
          options: {
            include: {
              option: {
                include: { variant: true },
              },
            },
          },
        },
      });

      return combination;
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(status.CONFLICT, "A variant combination with this SKU already exists");
    }
    throw error;
  }
};

const updateCombination = async (
  productId: string,
  combinationId: string,
  req: any
) => {
  const product = await assertProductExists(productId);
  const data = req.body;

  const existing = await prisma.productVariantCombination.findFirst({
    where: { id: combinationId, productId },
  });
  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Combination not found for this product");
  }

  // Stock & Status Logic:
  // If target quantity is 0 or less, it must be INACTIVE
  // If target status is ACTIVE but target quantity is 0 or less, reject with error
  const finalQuantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
  let finalStatus = data.status !== undefined ? data.status : existing.status;

  if (finalQuantity <= 0) {
    // If quantity is 0, automatic INACTIVE
    finalStatus = "INACTIVE";
    if (data.status === "ACTIVE") {
      throw new ApiError(
        status.BAD_REQUEST,
        "Cannot activate variant with 0 stock. Please add stock quantity first."
      );
    }
  } else if (data.status !== undefined) {
    finalStatus = data.status;
  } else if (finalQuantity > 0) {
    finalStatus = "ACTIVE";
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let finalPriceToSet = data.finalPrice !== undefined ? Number(data.finalPrice) : existing.finalPrice;

      if (Array.isArray(data.optionIds)) {
        await tx.productVariantCombinationOption.deleteMany({
          where: { productVariantCombinationId: combinationId },
        });
        if (data.optionIds.length > 0) {
          await tx.productVariantCombinationOption.createMany({
            data: data.optionIds.map((optId: string) => ({
              productVariantCombinationId: combinationId,
              productVariantOptionId: optId,
            })),
          });
          // Recalculate price if finalPrice wasn't explicitly passed
          if (data.finalPrice === undefined) {
            const selectedOptions = await tx.productVariantOption.findMany({
              where: { id: { in: data.optionIds } },
            });
            const priceAdjustmentsSum = selectedOptions.reduce(
              (sum, opt) => sum + Number(opt.priceAdjustment || 0),
              0
            );
            const baseProductPrice = product.sellingPrice ?? product.buyingPrice ?? 0;
            finalPriceToSet = Math.max(0, baseProductPrice + priceAdjustmentsSum);
          }
        }
      }

      return await tx.productVariantCombination.update({
        where: { id: combinationId },
        data: {
          ...(data.sku && { sku: data.sku }),
          quantity: Math.max(0, finalQuantity),
          finalPrice: finalPriceToSet,
          ...(data.imageId !== undefined && { imageId: data.imageId }),
          status: finalStatus,
        },
        include: {
          options: {
            include: {
              option: {
                include: { variant: true },
              },
            },
          },
        },
      });
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(status.CONFLICT, "A variant combination with this SKU already exists");
    }
    throw error;
  }
};

const deleteCombination = async (productId: string, combinationId: string) => {
  await assertProductExists(productId);
  const existing = await prisma.productVariantCombination.findFirst({
    where: { id: combinationId, productId },
  });
  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Combination not found for this product");
  }

  return prisma.productVariantCombination.delete({
    where: { id: combinationId },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MATRIX CROSS COMBINATIONS GENERATOR
// Given product's variant attributes & options, cross them to form combinations
// ONLY when 2 or more variant attributes exist
// ─────────────────────────────────────────────────────────────────────────────
const generateMatrixCombinations = async (productId: string, req: any) => {
  const product = await assertProductExists(productId);
  const basePrice =
    req.body?.basePrice !== undefined && req.body?.basePrice !== null
      ? Number(req.body.basePrice)
      : (product.sellingPrice ?? product.buyingPrice ?? 0);
  const defaultQuantity =
    req.body?.defaultQuantity !== undefined ? Number(req.body.defaultQuantity) : 0;
  const skuPrefix = req.body?.skuPrefix || product.slug.toUpperCase();

  const variantAttributes = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const validAttributes = variantAttributes.filter((v) => v.options.length > 0);

  if (validAttributes.length === 0) {
    await prisma.productVariantCombination.deleteMany({
      where: { productId },
    });
    return [];
  }

  // Cartesian Product helper for 2 or more variant attributes
  const cartesian = (arrays: any[][]): any[][] => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]]
    );
  };

  const optionGroups = validAttributes.map((attr) => attr.options);
  const crossedCombinations = cartesian(optionGroups);

  const createdCombinations = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const comboOptions of crossedCombinations) {
      // comboOptions is an array of ProductVariantOption objects
      const skuParts = comboOptions.map((opt: any) =>
        opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      );
      const sku = `${skuPrefix}-${skuParts.join("-")}`.toUpperCase();

      const priceAdjustmentsSum = comboOptions.reduce(
        (sum: number, opt: any) => sum + Number(opt.priceAdjustment || 0),
        0
      );
      const finalPrice = Math.max(0, basePrice + priceAdjustmentsSum);

      // Check if SKU exists
      const existingCombo = await tx.productVariantCombination.findUnique({
        where: { sku },
      });

      let combination: any;
      if (existingCombo) {
        // Delete existing combination options and recreate
        await tx.productVariantCombinationOption.deleteMany({
          where: { productVariantCombinationId: existingCombo.id },
        });

        combination = await tx.productVariantCombination.update({
          where: { id: existingCombo.id },
          data: {
            finalPrice,
            quantity: defaultQuantity,
            options: {
              create: comboOptions.map((opt: any) => ({
                productVariantOptionId: opt.id,
              })),
            },
          },
          include: {
            options: {
              include: {
                option: {
                  include: { variant: true },
                },
              },
            },
          },
        });
      } else {
        combination = await tx.productVariantCombination.create({
          data: {
            productId,
            sku,
            finalPrice,
            quantity: defaultQuantity,
            status: defaultQuantity > 0 ? "ACTIVE" : "INACTIVE",
            options: {
              create: comboOptions.map((opt: any) => ({
                productVariantOptionId: opt.id,
              })),
            },
          },
          include: {
            options: {
              include: {
                option: {
                  include: { variant: true },
                },
              },
            },
          },
        });
      }

      results.push(combination);
    }
    return results;
  }, {
    maxWait: 10000,
    timeout: 30000,
  });

  return createdCombinations;
};

export const ProductVariantServices = {
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
