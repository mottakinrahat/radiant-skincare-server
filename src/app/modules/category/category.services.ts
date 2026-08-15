import status from "http-status";
import ApiError from "../../errors/apiError";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../../helpers/fileUploader";

const generateUniqueCategorySlug = async (nameOrSlug: string, currentCategoryId?: string) => {
  let baseSlug = (nameOrSlug || "category")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!baseSlug) baseSlug = "category-" + Date.now();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (currentCategoryId && existing.id === currentCategoryId)) {
      return slug;
    }

    slug = baseSlug + "-" + counter;
    counter++;
  }
};

const createCategoryIntoDB = async (req: any) => {
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

  const categoryName = payload?.categoryName || payload?.name;
  if (!categoryName) {
    throw new ApiError(status.BAD_REQUEST, "Category name is required");
  }

  const existing = await prisma.category.findFirst({
    where: {
      categoryName: {
        equals: categoryName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new ApiError(
      status.CONFLICT,
      "A category with this name already exists",
    );
  }

  let imageUrl = payload?.image || payload?.imageUrl;
  if (file?.path) {
    const uploaded = await fileUploader.uploadToCloudflare(file.path);
    imageUrl = uploaded?.url;
  }

  if (!imageUrl) {
    imageUrl = "/img-3.png";
  }

  const categorySlug = await generateUniqueCategorySlug(payload.slug || categoryName);

  return prisma.category.create({
    data: {
      categoryName: categoryName,
      description: payload.description || "",
      image: imageUrl,
      slug: categorySlug,
      attributeSchema: payload.attributeSchema ?? [],
    },
  });
};

const getCategoriesFromDB = async () => {
  return prisma.category.findMany({
    orderBy: { categoryName: "asc" },
    include: {
      _count: { select: { product: true } },
    },
  });
};

const getSingleCategoryFromDB = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: { select: { product: true } },
    },
  });

  if (!category) {
    throw new ApiError(status.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategoryIntoDB = async (req: any) => {
  const categoryId = req.params.categoryId;
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

  await getSingleCategoryFromDB(categoryId);

  const categoryName = payload?.categoryName || payload?.name;
  if (categoryName) {
    const duplicate = await prisma.category.findFirst({
      where: {
        categoryName: { equals: categoryName, mode: "insensitive" },
        NOT: { id: categoryId },
      },
    });

    if (duplicate) {
      throw new ApiError(
        status.CONFLICT,
        "A category with this name already exists",
      );
    }
  }

  let imageUrl: string | undefined;
  if (file?.path) {
    const uploaded = await fileUploader.uploadToCloudflare(file.path);
    imageUrl = uploaded?.url;
  }

  const updateData: Record<string, unknown> = { ...payload };
  if (categoryName) updateData.categoryName = categoryName;
  if (imageUrl) updateData.image = imageUrl;

  return prisma.category.update({
    where: { id: categoryId },
    data: updateData,
  });
};

const deleteCategoryFromDB = async (categoryId: string) => {
  await getSingleCategoryFromDB(categoryId);

  const productCount = await prisma.product.count({
    where: { categoryId },
  });

  if (productCount > 0) {
    throw new ApiError(
      status.CONFLICT,
      "Cannot delete category - it has products linked to it",
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
};

export const CategoryServices = {
  createCategoryIntoDB,
  getCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
