import z from "zod";

const createVariantAttribute = z.object({
  body: z.object({
    variantTitle: z.string().min(1, "Variant title is required (e.g. Color, Size)"),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    options: z
      .array(
        z.object({
          value: z.string().min(1, "Option value is required"),
          priceAdjustment: z.number().optional(),
          quantity: z.number().int().nonnegative().optional(),
          stock: z.number().int().nonnegative().optional(),
          stockQuantity: z.number().int().nonnegative().optional(),
          sku: z.string().optional().nullable(),
          status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
          sortOrder: z.number().int().optional(),
        })
      )
      .optional(),
  }),
});

const updateVariantAttribute = z.object({
  body: z.object({
    variantTitle: z.string().min(1).optional(),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const createVariantOption = z.object({
  body: z.object({
    value: z.string().min(1, "Option value is required (e.g. Red, Blue, XL)"),
    priceAdjustment: z.number().optional(),
    quantity: z.number().int().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    sku: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const updateVariantOption = z.object({
  body: z.object({
    value: z.string().optional(),
    priceAdjustment: z.number().optional(),
    quantity: z.number().int().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    sku: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const createCombination = z.object({
  body: z.object({
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().nonnegative("Quantity must be non-negative").default(0),
    finalPrice: z.number().nonnegative("Final price must be non-negative"),
    imageId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    optionIds: z.array(z.string()).min(1, "At least one option ID is required"),
  }),
});

const updateCombination = z.object({
  body: z.object({
    sku: z.string().optional(),
    quantity: z.number().int().nonnegative().optional(),
    finalPrice: z.number().nonnegative().optional(),
    imageId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
    optionIds: z.array(z.string()).optional(),
  }),
});

const generateMatrix = z.object({
  body: z.object({
    basePrice: z.number().nonnegative().optional(),
    defaultQuantity: z.number().int().nonnegative().optional(),
    skuPrefix: z.string().optional(),
  }),
});

export const ProductVariantValidation = {
  createVariantAttribute,
  updateVariantAttribute,
  createVariantOption,
  updateVariantOption,
  createCombination,
  updateCombination,
  generateMatrix,
};
