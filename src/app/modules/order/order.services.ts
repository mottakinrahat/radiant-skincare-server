import { OrderStatus, PaymentStatusEnum, PaymentMethod } from "../../../../prisma/generated/prisma";
import prisma from "../../../shared/prisma";

import { calculateChargeByName } from "../geo/geo.utils";
import { TrackingService } from "../tracking/tracking.service";

const createOrder = async (
  email: string,
  payload: any,
  metaInfo?: { clientIp?: string; userAgent?: string }
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }
  const items = payload.items as any[];
  if (!items || items.length === 0) {
    throw new Error("Order items cannot be empty");
  }

  let subtotal = 0;

  // Collect item details for discount eligibility check
  const itemDetails: {
    productId: string;
    categoryId: string;
    price: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    // Ensure quantity is a number, not a string from JSON body
    item.quantity = Number(item.quantity);
    if (!item.quantity || item.quantity <= 0) {
      throw new Error("Item quantity must be a positive number");
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          include: {
            options: true,
          },
        },
        variantCombinations: {
          include: {
            options: {
              include: { option: true },
            },
          },
        },
      },
    });

    if (!product) throw new Error(`Product not found: ${item.productId}`);

    let itemPrice = product.sellingPrice ?? product.buyingPrice ?? 0;
    let resolvedVariantId: string | null = null;
    let resolvedOptionId: string | null = null;

    const hasCombinations = Array.isArray(product.variantCombinations) && product.variantCombinations.length > 0;
    const allVariantOptions = (product.variants || []).flatMap((v: any) => v.options || []);
    const hasVariants = hasCombinations || allVariantOptions.length > 0;

    if (hasCombinations) {
      // 1. PRODUCT WITH COMBINATIONS (Primary Variant System)
      let variant = item.variantId
        ? product.variantCombinations.find((v: any) => v.id === item.variantId)
        : null;

      if (!variant && item.variantId) {
        variant = product.variantCombinations.find((v: any) => v.sku === item.variantId);
      }

      if (!variant && item.variantId && item.variantId.includes("-")) {
        const optIds = item.variantId.split("-");
        variant = product.variantCombinations.find((combo: any) => {
          const comboOptIds = combo.options.map((co: any) => co.productVariantOptionId || co.option?.id);
          return optIds.every((id: string) => comboOptIds.includes(id));
        });
      }

      if (!variant && item.variantId) {
        variant = product.variantCombinations.find((combo: any) => {
          const comboOptIds = combo.options.map((co: any) => co.productVariantOptionId || co.option?.id);
          return comboOptIds.includes(item.variantId);
        });
      }

      if (!variant && product.variantCombinations.length > 0) {
        variant =
          product.variantCombinations.find((c: any) => c.status === "ACTIVE" && c.quantity > 0) ||
          product.variantCombinations[0];
      }

      if (!variant) {
        throw new Error(`Variant not found for product: ${product.name}`);
      }

      if (variant.status && variant.status !== "ACTIVE") {
        throw new Error(`The selected variant (${variant.sku || ""}) is currently unavailable for purchase.`);
      }

      const availableQty = variant.quantity ?? (variant as any).stock ?? 0;
      if (availableQty < item.quantity) {
        throw new Error(
          `Insufficient stock for selected variant. Available: ${availableQty}, Requested: ${item.quantity}`
        );
      }

      itemPrice = variant.finalPrice && variant.finalPrice > 0 ? variant.finalPrice : itemPrice;
      resolvedVariantId = variant.id;
    } else if (allVariantOptions.length > 0) {
      // 2. PRODUCT WITH VARIANT OPTIONS (Without combinations generated)
      let matchedOption = item.variantId
        ? allVariantOptions.find(
            (opt: any) =>
              opt.id === item.variantId ||
              opt.sku === item.variantId ||
              opt.value?.toLowerCase() === item.variantId.toLowerCase()
          )
        : null;

      if (!matchedOption) {
        matchedOption =
          allVariantOptions.find((opt: any) => opt.status === "ACTIVE" && (opt.quantity ?? 0) > 0) ||
          allVariantOptions[0];
      }

      if (!matchedOption) {
        throw new Error(`Variant option not found for product: ${product.name}`);
      }

      if (matchedOption.status && matchedOption.status !== "ACTIVE") {
        throw new Error(`The selected option (${matchedOption.value}) is currently unavailable.`);
      }

      const availableQty = matchedOption.quantity ?? (matchedOption as any).stock ?? 0;
      if (availableQty < item.quantity) {
        throw new Error(
          `Insufficient stock for selected option. Available: ${availableQty}, Requested: ${item.quantity}`
        );
      }

      itemPrice = itemPrice + Number(matchedOption.priceAdjustment || 0);
      resolvedOptionId = matchedOption.id;
    } else {
      // 3. PRODUCT WITHOUT VARIANTS (Simple Product)
      const simpleStock = (product as any).stock ?? 0;
      if (simpleStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product. Available: ${simpleStock}, Requested: ${item.quantity}`
        );
      }
    }

    subtotal += itemPrice * item.quantity;
    item.price = itemPrice; // attach for later use
    (item as any).resolvedVariantId = resolvedVariantId;
    (item as any).resolvedOptionId = resolvedOptionId;

    // Push item detail for discount eligibility check
    itemDetails.push({
      productId: product.id,
      categoryId: product.categoryId,
      price: itemPrice,
      quantity: item.quantity,
    });
  }

  // ─── Discount calculation ─────────────────────────────────────────────────
  let discountAmount = 0;
  let isFreeShipping = Boolean(payload.isFreeShipping || payload.discountType === "FREE_SHIPPING");

  if (payload.discountCode) {
    const discount = await prisma.discount.findFirst({
      where: { code: { equals: payload.discountCode.trim(), mode: "insensitive" } },
      include: {
        products: true,
        categories: true,
      },
    });

    if (!discount) throw new Error("Invalid promo code");

    const now = new Date();
    if (!discount.isActive || now < discount.startDate || now > discount.endDate) {
      throw new Error("Promo code is not active or has expired");
    }

    if (
      discount.type === "FREE_SHIPPING" ||
      (discount.code && discount.code.toUpperCase().includes("FREE"))
    ) {
      isFreeShipping = true;
      discountAmount = 0;
    } else {
      let eligibleTotal = 0;
      const hasSpecificProducts = discount.products && discount.products.length > 0;
      const hasSpecificCategories = discount.categories && discount.categories.length > 0;

      if (discount.isGlobal || (!hasSpecificProducts && !hasSpecificCategories)) {
        eligibleTotal = subtotal;
      } else {
        const discountProdIds = discount.products.map((dp) => dp.productId);
        const discountCatIds = discount.categories.map((dc) => dc.categoryId);

        for (const item of itemDetails) {
          if (
            discountProdIds.includes(item.productId) ||
            discountCatIds.includes(item.categoryId)
          ) {
            eligibleTotal += item.price * item.quantity;
          }
        }
      }

      if (eligibleTotal > 0) {
        if (discount.type === "PERCENTAGE") {
          discountAmount = Math.round((eligibleTotal * discount.value) / 100);
        } else {
          discountAmount = Math.min(discount.value, eligibleTotal);
        }
      }
    }
  } else {
    // Fallback: manual discountAmount from payload (e.g. admin-applied)
    discountAmount = Number(payload.discountAmount) || 0;
  }
  // ─────────────────────────────────────────────────────────────────────────
  const geoResult = calculateChargeByName(
    payload.shippingAddress?.district,
    payload.shippingAddress?.upazilla
  );
  const shipping = isFreeShipping ? 0 : geoResult.charge;
  const totalAmount = Math.max(0, subtotal - discountAmount + shipping);

  const clientNoteStr =
    payload.notes ||
    payload.clientNotes ||
    payload.clientNote ||
    payload.note ||
    payload.shippingAddress?.note ||
    payload.shippingAddress?.clientNote ||
    "";

  let shippingAddressId: string | undefined;

  const result = await prisma.$transaction(async (tx) => {
    // determine payment method and initial payment status
    const pmRaw = (payload.paymentMethod || "").toString().toUpperCase();
    const paymentMethodValue = pmRaw === "ONLINE" ? PaymentMethod.ONLINE : PaymentMethod.COD;
    // ONLINE → paymentStatus starts as PENDING (confirmed after gateway callback)
    // COD    → paymentStatus starts as UNPAID (confirmed when cash is collected)
    const paymentStatus = paymentMethodValue === PaymentMethod.COD ? PaymentStatusEnum.UNPAID : PaymentStatusEnum.PENDING;

    let localShippingAddressId: string | undefined;
    if (payload.shippingAddress) {
      const shippingAddress = await tx.shippingAddress.create({
        data: {
          userId: user.id,
          houseStreet: payload.shippingAddress.houseStreet,
          village: payload.shippingAddress.village,
          postOffice: payload.shippingAddress.postOffice,
          upazilla: payload.shippingAddress.upazilla,
          district: payload.shippingAddress.district,
          division: payload.shippingAddress.division,
          country: payload.shippingAddress.country || "Bangladesh",
          phoneNumber: payload.shippingAddress.phoneNumber,
          altPhoneNumber: payload.shippingAddress.altPhoneNumber,
        },
      });
      localShippingAddressId = shippingAddress.id;
      shippingAddressId = shippingAddress.id;
    }

    // All new orders start as UNVERIFIED until manually verified by Admin/Manager via phone call
    const orderStatus = OrderStatus.UNVERIFIED;

    // Compute next sequential orderNumber starting at 101
    const lastOrder = await tx.order.findFirst({
      where: { orderNumber: { not: null } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const nextOrderNumber = lastOrder?.orderNumber && lastOrder.orderNumber >= 101 ? lastOrder.orderNumber + 1 : 101;

    const newOrder = await tx.order.create({
      data: {
        userId: user?.id,
        orderNumber: nextOrderNumber,
        status: orderStatus,
        paymentMethod: paymentMethodValue,
        paymentStatus,
        subtotal,
        discountAmount,
        totalAmount,
        shippingAddressId: localShippingAddressId,
        note: clientNoteStr || undefined,
      } as any,
    });

    const orderItemsData = items.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      variantId: (item as any).resolvedVariantId || null,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    await tx.orderItems.createMany({
      data: orderItemsData,
    });

    // Deduct stock on order creation atomically inside transaction
    for (const item of items as any[]) {
      if (item.resolvedVariantId) {
        // 1. Variant product with combination: decrement ONLY variant combination stock
        const currentVariant = await tx.productVariantCombination.findUnique({
          where: { id: item.resolvedVariantId },
          select: { quantity: true, status: true },
        });
        if (!currentVariant || currentVariant.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for selected variant. Available: ${currentVariant?.quantity ?? 0}, Requested: ${item.quantity}`
          );
        }
        const updated = await tx.productVariantCombination.update({
          where: { id: item.resolvedVariantId },
          data: { quantity: { decrement: item.quantity } },
        });
        // Auto-deactivate if stock reached 0
        if (updated.quantity <= 0) {
          await tx.productVariantCombination.update({
            where: { id: item.resolvedVariantId },
            data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
          });
        }
      } else if (item.resolvedOptionId) {
        // 2. Single variant option without combinations: decrement ONLY ProductVariantOption quantity
        const currentOption = await tx.productVariantOption.findUnique({
          where: { id: item.resolvedOptionId },
          select: { quantity: true, status: true },
        });
        if (!currentOption || (currentOption.quantity ?? 0) < item.quantity) {
          throw new Error(
            `Insufficient stock for selected option. Available: ${currentOption?.quantity ?? 0}, Requested: ${item.quantity}`
          );
        }
        const updated = await tx.productVariantOption.update({
          where: { id: item.resolvedOptionId },
          data: { quantity: { decrement: item.quantity } },
        });
        if (updated.quantity <= 0) {
          await tx.productVariantOption.update({
            where: { id: item.resolvedOptionId },
            data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
          });
        }
      } else {
        // 3. Simple product (no variants): decrement Product.stock ONLY
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (!currentProduct || (currentProduct.stock ?? 0) < item.quantity) {
          throw new Error(
            `Insufficient stock for product. Available: ${currentProduct?.stock ?? 0}, Requested: ${item.quantity}`
          );
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (payload.clearCart) {
      const cart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return newOrder;
  });

  // Increment LandingPage ordersCount (Purchases) ONLY if order explicitly originated from a Landing Page
  const landingProdId = (payload as any).landingProductId || ((payload as any).fromLandingPage ? items?.[0]?.productId : null);
  if (landingProdId) {
    try {
      await prisma.landingPage.update({
        where: { productId: landingProdId },
        data: { ordersCount: { increment: 1 } },
      });
    } catch {
      // ignore if product is not linked to a landing page
    }
  }

  // Persist client note directly into Order table
  if (clientNoteStr) {
    const noteVal = clientNoteStr;
    const orderId = result.id;
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Order" SET note = $1 WHERE id = $2`,
        noteVal,
        orderId
      );
      (result as any).note = noteVal;
    } catch (rawErr) {
      console.error("[OrderServices] Failed to persist client note:", rawErr);
    }
  }

  // Non-blocking Server-side Conversions API (CAPI) Purchase event for Meta & TikTok
  TrackingService.trackPurchase({
    eventId: result.id,
    email: user.email || payload.shippingAddress?.email,
    phone: payload.shippingAddress?.phoneNumber || (user as any).phone,
    value: result.totalAmount,
    currency: "BDT",
    clientIp: metaInfo?.clientIp,
    userAgent: metaInfo?.userAgent,
    contentIds: items.map((i: any) => i.productId),
  }).catch((err) => {
    console.error("[OrderServices] CAPI tracking error (non-blocking):", err);
  });

  return result;
};

const orderFullInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          category: true,
          brand: true,
          details: true,
        },
      },
      variant: {
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
      },
    },
  },
  payment: true,
  user: true,
  shippingAddress: true,
};

const getOrdersForUser = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  return await prisma.order.findMany({
    where: { userId: user.id },
    include: orderFullInclude,
    orderBy: { createdAt: "desc" },
  });
};

const getOrderById = async (orderIdOrNumber: string) => {
  const clean = (orderIdOrNumber || "").trim().replace("#", "");
  const numericStr = clean.replace(/^[^\d]+/g, "").trim();
  const num = parseInt(numericStr, 10);
  const hasNum = !isNaN(num) && numericStr.length > 0;

  const whereClause: any = hasNum
    ? {
        OR: [
          { id: orderIdOrNumber },
          { id: clean },
          { orderNumber: num },
        ],
      }
    : {
        OR: [
          { id: orderIdOrNumber },
          { id: clean },
        ],
      };

  return await prisma.order.findFirst({
    where: whereClause,
    include: orderFullInclude,
  });
};

const trackOrderPublic = async (orderQuery: string, phoneQuery: string) => {
  const cleanOrderQuery = (orderQuery || "").trim().replace("#", "");
  const cleanPhoneQuery = (phoneQuery || "").trim().toLowerCase();

  if (!cleanOrderQuery || !cleanPhoneQuery) {
    throw new Error("Both Order Number / ID and Phone Number are required for tracking.");
  }

  const num = parseInt(cleanOrderQuery, 10);
  const isNum = !isNaN(num) && String(num) === cleanOrderQuery;

  const orConditions: any[] = [
    { id: { startsWith: cleanOrderQuery, mode: "insensitive" } },
    { id: cleanOrderQuery },
  ];
  if (isNum) {
    orConditions.push({ orderNumber: num });
  }

  const orders = await prisma.order.findMany({
    where: { OR: orConditions },
    include: orderFullInclude,
    orderBy: { createdAt: "desc" },
  });

  if (!orders || orders.length === 0) {
    throw new Error("No order found with the provided Order Number.");
  }

  const targetDigits = cleanPhoneQuery.replace(/\D/g, "");

  const matchedOrder = orders.find((o) => {
    const sPhone = (o.shippingAddress?.phoneNumber || "").replace(/\D/g, "");
    const sAltPhone = (o.shippingAddress?.altPhoneNumber || "").replace(/\D/g, "");
    const uPhone = (o.user?.contactNumber || "").replace(/\D/g, "");

    return (
      (sPhone && (sPhone.includes(targetDigits) || targetDigits.includes(sPhone))) ||
      (sAltPhone && (sAltPhone.includes(targetDigits) || targetDigits.includes(sAltPhone))) ||
      (uPhone && (uPhone.includes(targetDigits) || targetDigits.includes(uPhone)))
    );
  });

  if (!matchedOrder) {
    throw new Error("Order found, but the phone number does not match our records.");
  }

  return matchedOrder;
};

const getAllOrders = async () => {
  return await prisma.order.findMany({
    include: orderFullInclude,
    orderBy: { createdAt: "desc" },
  });
};

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const prevStatus = existingOrder.status;
  const updateData: any = { status };
  if (status === OrderStatus.REFUNDED) {
    updateData.paymentStatus = PaymentStatusEnum.REFUNDED;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  const isNowConfirmed = (
    [
      OrderStatus.CONFIRMED,
      OrderStatus.PROGRESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ] as any[]
  ).includes(status);

  const wasConfirmed = (
    [
      OrderStatus.CONFIRMED,
      OrderStatus.PROGRESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ] as any[]
  ).includes(prevStatus);

  const isCancelledOrRefunded = (
    [
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ] as any[]
  ).includes(status);

  if (isNowConfirmed && !wasConfirmed) {
    for (const item of existingOrder.items) {
      const vId = (item as any).variantCombinationId || item.variantId;
      if (vId) {
        const updated = await prisma.productVariantCombination
          .update({
            where: { id: vId },
            data: { quantity: { decrement: item.quantity } },
          })
          .catch(() => null);
        if (updated && updated.quantity <= 0) {
          await prisma.productVariantCombination
            .update({
              where: { id: vId },
              data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
            })
            .catch(() => {});
        }
      } else if (item.productId) {
        // Non-variant order confirmed: increment sold count
        await prisma.product
          .update({
            where: { id: item.productId },
            data: { initialSoldCount: { increment: item.quantity } },
          })
          .catch(() => {});
      }
    }
  } else if (isCancelledOrRefunded && wasConfirmed) {
    for (const item of existingOrder.items) {
      const vId = (item as any).variantCombinationId || item.variantId;
      if (vId) {
        await prisma.productVariantCombination
          .update({
            where: { id: vId },
            data: { quantity: { increment: item.quantity } },
          })
          .catch(() => {});
      } else if (item.productId) {
        // Non-variant order cancelled/refunded: restore stock
        await prisma.product
          .update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              initialSoldCount: { decrement: Math.max(0, item.quantity) },
            },
          })
          .catch(() => {});
      }
    }
  }

  return updatedOrder;
};

const updatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatusEnum) => {
  return await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });
};

const updateOrderCourierInfo = async (
  orderId: string,
  payload: {
    courierProvider?: string;
    consignmentId?: string;
    trackingCode?: string;
    courierStatus?: string;
    sentToCourierAt?: Date | string;
    courierData?: any;
  }
) => {
  return await prisma.order.update({
    where: { id: orderId },
    data: {
      courierProvider: payload.courierProvider,
      consignmentId: payload.consignmentId,
      trackingCode: payload.trackingCode,
      courierStatus: payload.courierStatus || "SENT",
      sentToCourierAt: payload.sentToCourierAt ? new Date(payload.sentToCourierAt) : new Date(),
      courierData: payload.courierData ? JSON.stringify(payload.courierData) : undefined,
    },
  });
};

const clearOrderCourierInfo = async (orderId: string) => {
  return await prisma.order.update({
    where: { id: orderId },
    data: {
      courierProvider: null,
      consignmentId: null,
      trackingCode: null,
      courierStatus: null,
      sentToCourierAt: null,
      courierData: null,
    },
  });
};

export const OrderServices = {
  createOrder,
  getOrdersForUser,
  getOrderById,
  trackOrderPublic,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderCourierInfo,
  clearOrderCourierInfo,
};
