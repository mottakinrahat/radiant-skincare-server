import prisma from "../../../shared/prisma";

const addToWishlist = async (email: string, productId: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  // Idempotent – return existing if already in wishlist
  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) throw new Error("Product is already in your wishlist");

  return prisma.wishlist.create({
    data: { userId: user.id, productId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { take: 1, select: { url: true } },
          variantCombinations: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              id: true,
              finalPrice: true,
              quantity: true,
            },
          },
          brand: { select: { brandName: true } },
          category: { select: { categoryName: true } },
        },
      },
    },
  });
};

const removeFromWishlist = async (email: string, productId: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (!item) throw new Error("Product is not in your wishlist");

  return prisma.wishlist.delete({
    where: { userId_productId: { userId: user.id, productId } },
  });
};

const getMyWishlist = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  return prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPublished: true,
          images: { take: 1, select: { url: true } },
          variantCombinations: {
            where: { status: "ACTIVE" },
            take: 1,
            select: {
              id: true,
              finalPrice: true,
              quantity: true,
            },
          },
          brand: { select: { brandName: true } },
          category: { select: { categoryName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const toggleWishlist = async (email: string, productId: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId: user.id, productId } },
    });
    return { wishlisted: false };
  }

  await prisma.wishlist.create({ data: { userId: user.id, productId } });
  return { wishlisted: true };
};

export const WishlistServices = {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  toggleWishlist,
};
