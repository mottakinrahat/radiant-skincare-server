import status from "http-status";
import { Prisma, UserStatus } from "../../../../prisma/generated/prisma";
import ApiError from "../../errors/apiError";
import { paginationHelpers } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../interfaces/pagination";
import { productSearchableFields } from "./product.constant";
import { IProductFilterRequest } from "./product.interface";
import { productHelpers } from "./product.helper";
import { fileUploader } from "../../../helpers/fileUploader";

const generateUniqueSlug = async (nameOrSlug: string, currentProductId?: string) => {
  let baseSlug = (nameOrSlug || "product")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!baseSlug) baseSlug = `product-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (currentProductId && existing.id === currentProductId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Generate sequential product serial number (e.g. 01, 02, 03... or 1, 2, 3...)
 * Safe against race conditions and preserves existing serial formats.
 */
export const generateNextProductSerial = async (tx?: any): Promise<string> => {
  const db = tx || prisma;
  const products = await db.product.findMany({
    select: { productSerial: true },
  });

  let maxSerial = 0;
  for (const p of products) {
    if (p.productSerial) {
      const digits = p.productSerial.replace(/\D/g, "");
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > maxSerial) {
        maxSerial = num;
      }
    }
  }

  const nextNum = maxSerial + 1;
  return nextNum < 10 ? `0${nextNum}` : String(nextNum);
};

const createProductIntoDB = async (req: any, user: any) => {
  try {
    const file = req?.file;
    let payload = req.body;

    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    if (payload?.data && typeof payload.data === "string") {
      try {
        payload = JSON.parse(payload.data);
      } catch (e) {}
    } else if (payload?.data && typeof payload.data === "object") {
      payload = payload.data;
    }

    if (!payload || !payload.name) {
      throw new ApiError(status.BAD_REQUEST, "Product name is required.");
    }

    const trimmedName = payload.name.trim();

    // Check for duplicate product name (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });

    if (existingProduct) {
      throw new ApiError(
        status.CONFLICT,
        `A product with name "${trimmedName}" already exists.`
      );
    }

    // Auto-resolve unique slug to prevent unique constraint collisions
    payload.slug = await generateUniqueSlug(payload.slug || trimmedName);

    // Always auto-generate productSerial safely on backend (sequential: 01, 02, 03...)
    payload.productSerial = await generateNextProductSerial();

    if (payload.sellingPrice !== undefined && payload.sellingPrice !== null) {
      payload.sellingPrice = Number(payload.sellingPrice);
    }
    if (payload.regularPrice !== undefined && payload.regularPrice !== null) {
      payload.regularPrice = Number(payload.regularPrice);
    }
    if (payload.buyingPrice !== undefined && payload.buyingPrice !== null) {
      payload.buyingPrice = Number(payload.buyingPrice);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!existingUser) {
      throw new ApiError(status.NOT_FOUND, "User not found");
    }

    // Collect all uploaded files (supports single req.file or multiple req.files)
    const uploadedFiles: Express.Multer.File[] = [];
    if (req.file) {
      uploadedFiles.push(req.file);
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        uploadedFiles.push(...req.files);
      } else if (typeof req.files === "object") {
        Object.values(req.files).forEach((f: any) => {
          if (Array.isArray(f)) {
            uploadedFiles.push(...f);
          } else if (f?.path) {
            uploadedFiles.push(f);
          }
        });
      }
    }

    let uploadedR2Images: Array<{ url: string; key: string }> = [];
    if (uploadedFiles.length > 0) {
      uploadedR2Images = await fileUploader.uploadMultipleToCloudflare(uploadedFiles);
    }

    if (!payload.brandId || payload.brandId === "" || payload.brandId === "null") {
      delete payload.brandId;
    }

    const { details, variants, variantCombinations, images, ...productData } = payload;

    const hasVariantsOnCreate = Array.isArray(variants) && variants.length > 0 && variants.some((v: any) => Array.isArray(v.options) && v.options.length > 0);
    if (hasVariantsOnCreate) {
      // Products with variants must NOT use product-level stock
      productData.stock = 0;
    } else {
      // Products without variants use product-level stock
      productData.stock = Math.max(0, Number(payload.stock ?? payload.stockQuantity ?? 0));
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      // 1. Create base product with details, variant attributes & options
      const product = await tx.product.create({
        data: {
          ...productData,
          productAddById: existingUser.id,
          ...(Array.isArray(details) && details.length > 0
            ? {
                details: {
                  create: details.map((d: any, idx: number) => ({
                    topic: d.topic || "Specification",
                    description: d.description || "",
                    sortOrder: d.sortOrder ?? idx + 1,
                  })),
                },
              }
            : {}),
          ...(Array.isArray(variants) && variants.length > 0
            ? {
                variants: {
                  create: variants.map((v: any, idx: number) => ({
                    variantTitle: v.variantTitle || v.title || "Variant",
                    isRequired: v.isRequired ?? false,
                    sortOrder: v.sortOrder ?? idx + 1,
                    ...(Array.isArray(v.options) && v.options.length > 0
                      ? {
                          options: {
                            create: v.options.map((opt: any, optIdx: number) => ({
                              value: opt.value,
                              priceAdjustment: Number(opt.priceAdjustment ?? 0),
                              quantity: Number(opt.quantity ?? opt.stock ?? opt.stockQuantity ?? 0),
                              sku: opt.sku || null,
                              status: opt.status || "ACTIVE",
                              sortOrder: opt.sortOrder ?? optIdx + 1,
                            })),
                          },
                        }
                      : {}),
                  })),
                },
              }
            : {}),
        },
        include: productHelpers.productIncludeDefault,
      });

      // 2. Build image records with guaranteed productId
      const imageRecords: Array<{
        url: string;
        productId: string;
        isPrimary?: boolean;
        sortOrder?: number;
        altText?: string;
      }> = [];

      // Add all Cloudflare R2 uploaded files
      uploadedR2Images.forEach((img, idx) => {
        imageRecords.push({
          url: img.url,
          productId: product.id,
          isPrimary: idx === 0,
          sortOrder: idx,
          altText: product.name,
        });
      });

      const isValidUrl = (u: any) =>
        typeof u === "string" && u.trim().length > 0 && u.length < 2000 && !u.startsWith("blob:");

      // Also include any raw image URLs passed in payload
      if (Array.isArray(images)) {
        images.forEach((img: any, idx: number) => {
          const url = typeof img === "string" ? img : img?.url;
          if (isValidUrl(url) && !imageRecords.some((r) => r.url === url)) {
            imageRecords.push({
              url,
              productId: product.id,
              isPrimary:
                typeof img === "object"
                  ? !!img.isPrimary
                  : imageRecords.length === 0 && idx === 0,
              sortOrder: imageRecords.length + idx,
              altText: typeof img === "object" ? img.altText : product.name,
            });
          }
        });
      }

      if (imageRecords.length > 0) {
        await tx.productImage.createMany({
          data: imageRecords,
        });
      }

      // Auto-generate Matrix Combinations ONLY if 2 or more variant attributes were created
      if (Array.isArray(variants) && variants.length >= 2) {
        const createdVariants = await tx.productVariant.findMany({
          where: { productId: product.id },
          include: { options: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        });

        const validAttrs = createdVariants.filter((v) => v.options.length > 0);
        if (validAttrs.length >= 2) {
          const cartesian = (arrays: any[][]): any[][] =>
            arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])), [[]]);

          const optionGroups = validAttrs.map((v) => v.options);
          const crossed = cartesian(optionGroups);
          const basePrice = product.sellingPrice ?? product.buyingPrice ?? 0;
          const skuPrefix = product.slug.toUpperCase();

          for (const comboOptions of crossed) {
            const skuParts = comboOptions.map((opt: any) =>
              opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            );
            const sku = `${skuPrefix}-${skuParts.join("-")}`.toUpperCase();
            const priceAdjustmentsSum = comboOptions.reduce(
              (sum: number, opt: any) => sum + Number(opt.priceAdjustment || 0),
              0
            );
            const finalPrice = Math.max(0, basePrice + priceAdjustmentsSum);

            const existingCombo = await tx.productVariantCombination.findUnique({
              where: { sku },
            });

            if (!existingCombo) {
              await tx.productVariantCombination.create({
                data: {
                  productId: product.id,
                  sku,
                  finalPrice,
                  quantity: 0,
                  status: "INACTIVE",
                  options: {
                    create: comboOptions.map((opt: any) => ({
                      productVariantOptionId: opt.id,
                    })),
                  },
                },
              });
            }
          }
        }
      }

      return await tx.product.findUnique({
        where: { id: product.id },
        include: productHelpers.productIncludeDefault,
      });
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    return newProduct;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta?.target.join(", ")
          : (error.meta?.target as string) || "";
        if (target.includes("sku")) {
          throw new ApiError(status.CONFLICT, "Product variant SKU must be unique");
        }
        throw new ApiError(status.CONFLICT, "Product slug must be unique");
      }
      if (error.code === "P2003") {
        const field = (error.meta?.constraint as string)?.includes("brandId")
          ? "brandId"
          : (error.meta?.constraint as string)?.includes("categoryId")
          ? "categoryId"
          : "Brand or Category";
        throw new ApiError(
          status.BAD_REQUEST,
          `Invalid ${field} — specified ${field} does not exist in the database.`,
        );
      }
    }
    throw error;
  }
};

const getProductsFromDB = async (
  filters: IProductFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, sortBy, sortOrder, skip } =
    paginationHelpers.calculatePagination(options);
  const {
    searchTerm,
    category,
    categoryId,
    categorySlug,
    brand,
    brandId,
    minPrice,
    maxPrice,
    isPublished,
    isFeatured,
    status: productStatus,
    ...filterData
  } = filters;
  const andConditions: Prisma.ProductWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...productSearchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" as const },
        })),
        {
          variants: {
            some: {
              variantTitle: { contains: searchTerm, mode: "insensitive" as const },
            },
          },
        },
        {
          variantCombinations: {
            some: {
              sku: { contains: searchTerm, mode: "insensitive" as const },
            },
          },
        },
      ],
    });
  }

  const targetCategory = categoryId || categorySlug || category;
  if (targetCategory && targetCategory.length > 0) {
    const unhyphenated = targetCategory.replace(/-/g, " ");
    andConditions.push({
      OR: [
        { categoryId: targetCategory },
        { category: { id: targetCategory } },
        { category: { slug: { equals: targetCategory, mode: "insensitive" } } },
        { category: { categoryName: { equals: targetCategory, mode: "insensitive" } } },
        { category: { categoryName: { equals: unhyphenated, mode: "insensitive" } } },
      ],
    });
  }

  if (brand && brand.length > 0) {
    andConditions.push({
      brand: { brandName: { equals: brand, mode: "insensitive" } },
    });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceCondition: any = {};
    if (minPrice !== undefined) priceCondition.gte = Number(minPrice);
    if (maxPrice !== undefined) priceCondition.lte = Number(maxPrice);
    andConditions.push({ variantCombinations: { some: { finalPrice: priceCondition } } });
  }

  const published = productHelpers.parseBooleanParam(isPublished);
  if (published !== undefined) andConditions.push({ isPublished: published });

  const featured = productHelpers.parseBooleanParam(isFeatured);
  if (featured !== undefined) andConditions.push({ isFeatured: featured });

  if (productStatus) andConditions.push({ status: productStatus as any });

  if (Object.keys(filterData).length > 0) {
    const filterCondition = Object.keys(filterData).map((key) => ({
      [key]: { equals: (filterData as any)[key] },
    }));
    andConditions.push(...filterCondition);
  }

  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy:
        sortBy && sortOrder
          ? [{ [sortBy]: sortOrder }]
          : [{ createdAt: "asc" }],
      include: productHelpers.productIncludeDefault,
    }),
    prisma.product.count({ where: whereConditions }),
  ]);

  const productIds = result.map((p) => p.id);
  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const productsWithRatings = result.map((product) => {
    const ratingData = ratings.find((r) => r.productId === product.id);
    return {
      ...product,
      rating: ratingData?._avg.rating ?? 0,
      reviewCount: ratingData?._count.rating ?? 0,
    };
  });

  return { meta: { page, limit, total }, data: productsWithRatings };
};

const getSingleProductFromDB = async (
  identifier: string,
  options: { publishedOnly?: boolean } = {},
) => {
  const andConditions: Prisma.ProductWhereInput[] = [
    productHelpers.identifierWhere(identifier),
  ];

  if (options.publishedOnly) {
    andConditions.push({ isPublished: true });
  }

  const result = await prisma.product.findFirst({
    where: { AND: andConditions },
    include: options.publishedOnly
      ? {
          ...productHelpers.productIncludeDefault,
          variantCombinations: {
            include: {
              options: {
                include: {
                  option: {
                    include: { variant: true },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        }
      : productHelpers.productIncludeDefault,
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }

  const validAttrsCount = Array.isArray(result.variants)
    ? result.variants.filter((v: any) => Array.isArray(v.options) && v.options.length > 0).length
    : 0;

  const finalCombinations = result.variantCombinations || [];

  const agg = await prisma.review.aggregate({
    where: { productId: result.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...result,
    variantCombinations: finalCombinations,
    rating: agg._avg.rating ?? 0,
    reviewCount: agg._count.rating ?? 0,
  };
};

const updateProductIntoDB = async (
  identifier: string,
  payload: any,
) => {
  const existing = await prisma.product.findFirst({
    where: productHelpers.identifierWhere(identifier),
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }

  const { details, variants, images, variantId, stockQuantity, ...productData } = payload;

  // Retrieve existing product with its variant combinations
  const existingRecord = await prisma.product.findUnique({
    where: { id: existing.id },
    include: { variantCombinations: true, variants: { include: { options: true } } },
  });

  // Preserve permanent productSerial (do not allow edits to change it)
  productData.productSerial = existingRecord?.productSerial || (await generateNextProductSerial());

  const existingVariantsCount = existingRecord?.variants?.length ?? 0;
  const newVariantsCount = Array.isArray(variants) ? variants.length : existingVariantsCount;
  const hasMultipleVariants = newVariantsCount >= 2;
  const hasSingleVariant = newVariantsCount === 1;
  const hasVariantsInDB = hasMultipleVariants || hasSingleVariant;

  if (hasVariantsInDB) {
    // Product HAS variants: Product-level stock is disabled / not applicable
    productData.stock = 0;

    if (variantId && typeof stockQuantity === "number") {
      if (hasMultipleVariants) {
        // Check if variantId is a combination or option
        const comb = await prisma.productVariantCombination.findFirst({
          where: { id: variantId, productId: existing.id },
        });
        if (comb) {
          await prisma.productVariantCombination.update({
            where: { id: variantId },
            data: {
              quantity: Math.max(0, stockQuantity),
              ...(stockQuantity <= 0 ? { status: "INACTIVE" } : {}),
            },
          }).catch(() => {});
        } else {
          await prisma.productVariantOption.update({
            where: { id: variantId },
            data: {
              quantity: Math.max(0, stockQuantity),
              ...(stockQuantity <= 0 ? { status: "INACTIVE" } : {}),
            },
          }).catch(() => {});
        }
      } else {
        // Single variant attribute: update option stock directly
        await prisma.productVariantOption.update({
          where: { id: variantId },
          data: {
            quantity: Math.max(0, stockQuantity),
            ...(stockQuantity <= 0 ? { status: "INACTIVE" } : {}),
          },
        }).catch(() => {});
      }
    }
  } else {
    // Product has NO variants: Stock is managed at product level
    if (typeof stockQuantity === "number") {
      productData.stock = Math.max(0, stockQuantity);
    } else if (payload.stock !== undefined) {
      productData.stock = Math.max(0, Number(payload.stock));
    }
  }

  if (productData.name) {
    const trimmedName = productData.name.trim();
    const duplicate = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        NOT: { id: existing.id },
      },
    });
    if (duplicate) {
      throw new ApiError(
        status.CONFLICT,
        `A product with name "${trimmedName}" already exists.`
      );
    }
  }

  if (productData.slug || productData.name) {
    productData.slug = await generateUniqueSlug(
      productData.slug || productData.name,
      existing.id
    );
  }

  try {
    if (Array.isArray(details)) {
      await prisma.productDetail.deleteMany({ where: { productId: existing.id } });
      if (details.length > 0) {
        await prisma.productDetail.createMany({
          data: details.map((d: any, idx: number) => ({
            productId: existing.id,
            topic: d.topic || "Specification",
            description: d.description || "",
            sortOrder: d.sortOrder ?? idx + 1,
          })),
        });
      }
    }

    return await prisma.product.update({
      where: { id: existing.id },
      data: productData,
      include: productHelpers.productIncludeDefault,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(status.CONFLICT, "Product slug must be unique");
    }
    throw error;
  }
};

const deleteProductIntoDB = async (identifier: string) => {
  const existing = await prisma.product.findFirst({
    where: productHelpers.identifierWhere(identifier),
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }

  await prisma.product.delete({ where: { id: existing.id } });
};

const getProductAttributeSchema = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      categoryId: true,
      category: true,
    },
  });

  if (!product) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }

  return {
    categoryName: (product.category as any).categoryName,
    attributeSchema: (product.category as any).attributeSchema ?? [],
  };
};

const createProductImageIntoDB = async (productId: string, req: any) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(status.NOT_FOUND, "Product not found");
  }

  // Collect all uploaded files (single or multiple)
  const uploadedFiles: Express.Multer.File[] = [];
  if (req.file) uploadedFiles.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) uploadedFiles.push(...req.files);
    else if (typeof req.files === "object") {
      Object.values(req.files).forEach((f: any) => {
        if (Array.isArray(f)) uploadedFiles.push(...f);
        else if (f?.path) uploadedFiles.push(f);
      });
    }
  }

  let uploadedR2Images: Array<{ url: string; key: string }> = [];
  if (uploadedFiles.length > 0) {
    uploadedR2Images = await fileUploader.uploadMultipleToCloudflare(uploadedFiles);
  }

  const { isPrimary, sortOrder, altText } = req.body;
  const isPrimaryBool = isPrimary === true || isPrimary === "true";

  // If newly uploaded image is primary, unmark previous primaries
  if (isPrimaryBool) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  if (uploadedR2Images.length > 0) {
    const records = uploadedR2Images.map((img, idx) => ({
      url: img.url,
      productId,
      isPrimary: isPrimaryBool && idx === 0,
      sortOrder: sortOrder ? Number(sortOrder) + idx : idx,
      altText: altText || product.name,
    }));

    await prisma.productImage.createMany({ data: records });
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
  }

  if (req.body?.url) {
    return prisma.productImage.create({
      data: {
        url: req.body.url,
        productId,
        isPrimary: isPrimaryBool,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        altText: altText || product.name,
      },
    });
  }

  throw new ApiError(status.BAD_REQUEST, "Image file(s) or URL is required");
};

const deleteProductImageIntoDB = async (imageId: string) => {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new ApiError(status.NOT_FOUND, "Image not found");
  }

  await prisma.productImage.delete({ where: { id: imageId } });
};

export const ProductServices = {
  createProductIntoDB,
  getProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  deleteProductIntoDB,
  getProductAttributeSchema,
  createProductImageIntoDB,
  deleteProductImageIntoDB,
};
