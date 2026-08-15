import prisma from "../../../shared/prisma";
import { LandingPageServices } from "../landingPage/landingPage.services";

const extractProductIdFromItems = (items: any): string | null => {
  try {
    const itemsArr = Array.isArray(items) ? items : [];
    const firstItem = itemsArr[0];
    if (!firstItem) return null;
    if (firstItem.productId && typeof firstItem.productId === "string") return firstItem.productId;
    if (firstItem.product?.id && typeof firstItem.product.id === "string") return firstItem.product.id;
    if (typeof firstItem.id === "string") {
      const parts = firstItem.id.split("-");
      if (parts.length >= 5) {
        return parts.slice(0, 5).join("-");
      }
      return firstItem.id;
    }
  } catch (_) {}
  return null;
};

const createOrUpdateAbandonedCartInDB = async (payload: any) => {
  const { id, customerName, customerPhone, customerEmail, district, items, totalAmount, status, followUpNote } = payload;

  const phoneToUse = (customerPhone && typeof customerPhone === "string" && customerPhone.trim())
    ? customerPhone.trim()
    : "Guest (Pending Phone)";

  // Match existing ONLY by draft ID, or by phone if updated in last 30 minutes
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

  const existing = await prisma.abandonedCart.findFirst({
    where: {
      OR: [
        { id: id || "invalid_id" },
        ...(phoneToUse !== "Guest (Pending Phone)"
          ? [{ customerPhone: phoneToUse, updatedAt: { gte: thirtyMinsAgo } }]
          : []),
      ],
    },
  });

  const productId = extractProductIdFromItems(items);

  if (existing) {
    return await prisma.abandonedCart.update({
      where: { id: existing.id },
      data: {
        customerName: customerName || existing.customerName,
        customerPhone: phoneToUse !== "Guest (Pending Phone)" ? phoneToUse : existing.customerPhone,
        customerEmail: customerEmail || existing.customerEmail,
        district: district || existing.district,
        items: items ? JSON.parse(JSON.stringify(items)) : existing.items,
        totalAmount: totalAmount ?? existing.totalAmount,
        status: status || existing.status,
        followUpNote: followUpNote !== undefined ? followUpNote : (existing as any).followUpNote,
      },
    });
  }

  // Brand new abandoned cart
  const newCart = await prisma.abandonedCart.create({
    data: {
      id: id || undefined,
      customerName: customerName || "Guest Customer",
      customerPhone: phoneToUse,
      customerEmail: customerEmail || null,
      district: district || null,
      items: items ? JSON.parse(JSON.stringify(items)) : [],
      totalAmount: totalAmount || 0,
      status: status || "ABANDONED",
      followUpNote: followUpNote || null,
    },
  });

  if (productId) {
    LandingPageServices.trackAbandonedCart(productId).catch(() => {});
  }

  return newCart;
};

const getAbandonedCartsFromDB = async () => {
  return await prisma.abandonedCart.findMany({
    orderBy: { updatedAt: "desc" },
  });
};

const convertAbandonedCartInDB = async (payload: any) => {
  const { draftId, phone } = payload;

  const match = await prisma.abandonedCart.findFirst({
    where: {
      OR: [
        { id: draftId || "invalid_id" },
        { customerPhone: phone?.trim() || "invalid_phone" },
      ],
    },
  });

  if (match) {
    return await prisma.abandonedCart.update({
      where: { id: match.id },
      data: { status: "CONVERTED" },
    });
  }

  return null;
};

const updateStatusInDB = async (id: string, status: string) => {
  return await prisma.abandonedCart.update({
    where: { id },
    data: { status },
  });
};

const updateFollowUpNoteInDB = async (id: string, followUpNote: string) => {
  return await prisma.abandonedCart.update({
    where: { id },
    data: { followUpNote },
  });
};

const deleteAbandonedCartFromDB = async (id: string) => {
  return await prisma.abandonedCart.delete({
    where: { id },
  });
};

export const AbandonedCartServices = {
  createOrUpdateAbandonedCartInDB,
  getAbandonedCartsFromDB,
  convertAbandonedCartInDB,
  updateStatusInDB,
  updateFollowUpNoteInDB,
  deleteAbandonedCartFromDB,
};
