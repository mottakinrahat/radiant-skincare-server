import prisma from "../../../shared/prisma";

const upsertLandingPage = async (payload: {
  productId: string;
  slug?: string;
  title?: string;
  headline?: string;
  subheadline?: string;
  videoUrl?: string;
  features?: string[] | any;
  customPrice?: number;
  discountText?: string;
  isActive?: boolean;
}) => {
  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Generate clean slug if not provided
  let slug = payload.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!slug) {
    slug = `${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-lp`;
  }

  // Ensure unique slug if different landing page uses it
  const existingWithSlug = await prisma.landingPage.findFirst({
    where: {
      slug,
      NOT: { productId: payload.productId },
    },
  });

  if (existingWithSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const existingLanding = await prisma.landingPage.findUnique({
    where: { productId: payload.productId },
  });

  if (existingLanding) {
    return await prisma.landingPage.update({
      where: { productId: payload.productId },
      data: {
        slug,
        title: payload.title || product.name,
        headline: payload.headline || null,
        subheadline: payload.subheadline || null,
        videoUrl: payload.videoUrl || null,
        features: payload.features || [],
        customPrice: payload.customPrice || null,
        discountText: payload.discountText || null,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      },
      include: {
        product: {
          include: {
            images: true,
            variantCombinations: {
              include: { options: { include: { option: true } } },
            },
          },
        },
      },
    });
  }

  return await prisma.landingPage.create({
    data: {
      productId: payload.productId,
      slug,
      title: payload.title || product.name,
      headline: payload.headline || null,
      subheadline: payload.subheadline || null,
      videoUrl: payload.videoUrl || null,
      features: payload.features || [],
      customPrice: payload.customPrice || null,
      discountText: payload.discountText || null,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    },
    include: {
      product: {
        include: {
          images: true,
          variantCombinations: {
            include: { options: { include: { option: true } } },
          },
        },
      },
    },
  });
};

const getLandingPageBySlug = async (slug: string) => {
  const landing = await prisma.landingPage.findFirst({
    where: {
      OR: [{ slug }, { productId: slug }],
    },
    include: {
      product: {
        include: {
          images: true,
          details: true,
          variants: {
            include: { options: true },
          },
          variantCombinations: {
            include: { options: { include: { option: true } } },
          },
        },
      },
    },
  });

  if (!landing || (!landing.isActive && !landing.product)) {
    throw new Error("Landing page not found or inactive");
  }

  // Increment views count non-blockingly
  prisma.landingPage
    .update({
      where: { id: landing.id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch(() => {});

  return landing;
};

const getAllLandingPages = async () => {
  return await prisma.landingPage.findMany({
    include: {
      product: {
        include: {
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const deleteLandingPage = async (id: string) => {
  return await prisma.landingPage.delete({
    where: { id },
  });
};

// ─── Analytics Tracking ────────────────────────────────────────────────────

const trackCheckoutClick = async (productId: string) => {
  const landing = await prisma.landingPage.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (!landing) return;
  await (prisma.landingPage as any).update({
    where: { id: landing.id },
    data: { checkoutClicks: { increment: 1 } },
  });
};

const trackAbandonedCart = async (productId: string) => {
  const landing = await prisma.landingPage.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (!landing) return;
  await (prisma.landingPage as any).update({
    where: { id: landing.id },
    data: { abandonedCartCount: { increment: 1 } },
  });
};

const trackPurchase = async (productId: string) => {
  const landing = await prisma.landingPage.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (!landing) return;
  await (prisma.landingPage as any).update({
    where: { id: landing.id },
    data: { ordersCount: { increment: 1 } },
  });
};

const getLandingPageStatsByProductId = async (productId: string) => {
  const landing = await (prisma.landingPage as any).findUnique({
    where: { productId },
    select: {
      id: true,
      slug: true,
      viewsCount: true,
      checkoutClicks: true,
      abandonedCartCount: true,
      ordersCount: true,
      isActive: true,
    },
  });
  return landing || null;
};

export const LandingPageServices = {
  upsertLandingPage,
  getLandingPageBySlug,
  getAllLandingPages,
  deleteLandingPage,
  trackCheckoutClick,
  trackAbandonedCart,
  trackPurchase,
  getLandingPageStatsByProductId,
};
