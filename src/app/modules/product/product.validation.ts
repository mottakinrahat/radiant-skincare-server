import z from "zod";

const createProduct = z.object({
  body: z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required"),
    categoryId: z.string().min(1, "Category ID is required"),
    description: z.string().optional(),
    brandId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
  }),
});

const updateProduct = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      categoryId: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      brandId: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      metaTitle: z.string().optional().nullable(),
      metaDescription: z.string().optional().nullable(),
      attributes: z.record(z.string(), z.unknown()).optional(),
      variantId: z.string().optional().nullable(),
      stockQuantity: z.number().optional(),
      stock: z.number().optional(),
      initialSoldCount: z.number().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required for update",
    }),
});

const createProductImage = z.object({
  body: z.object({
    url: z.string().min(1, "Image URL is required"),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    altText: z.string().optional(),
    variantId: z.string().optional(),
  }),
});

export const ProductValidation = {
  createProduct,
  updateProduct,
  createProductImage,
};
