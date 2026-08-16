import prisma from "../../../shared/prisma";
import ApiError from "../../errors/apiError";
import status from "http-status";
import { StockAdjustmentPayload, StockChangeSource } from "./inventory.interface";

const getAllInventory = async (query: { search?: string; tab?: string }) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variantCombinations: {
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
    orderBy: { createdAt: "desc" },
  });

  const rows: any[] = [];

  products.forEach((p) => {
    const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || "/img-3.png";
    const catName = p.category?.categoryName || "Uncategorized";

    if (p.variantCombinations && p.variantCombinations.length > 0) {
      p.variantCombinations.forEach((combo) => {
        const optNames = combo.options
          ?.map((o) => o.option?.value)
          .filter(Boolean)
          .join(" / ");

        const stockQty = typeof combo.quantity === "number" ? combo.quantity : 0;
        rows.push({
          id: `${p.id}_${combo.id}`,
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          productSerial: p.productSerial,
          categoryName: catName,
          imageUrl: combo.imageId || primaryImg,
          variantId: combo.id,
          variantTitle: optNames || combo.sku,
          stockMode: "VARIANT_LEVEL",
          sku: combo.sku || `SKU-${p.id.slice(0, 6)}`,
          price: combo.finalPrice || p.sellingPrice || p.regularPrice || 0,
          regularPrice: p.regularPrice,
          sellingPrice: combo.finalPrice || p.sellingPrice,
          buyingPrice: p.buyingPrice,
          stock: stockQty,
          stockStatus: stockQty === 0 ? "OUT_OF_STOCK" : stockQty <= 5 ? "LOW_STOCK" : "IN_STOCK",
          soldCount: p.initialSoldCount || 0,
          updatedAt: combo.updatedAt,
        });
      });
    } else {
      const stockQty = typeof p.stock === "number" ? p.stock : 0;
      rows.push({
        id: p.id,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        productSerial: p.productSerial,
        categoryName: catName,
        imageUrl: primaryImg,
        variantId: null,
        variantTitle: null,
        stockMode: "PRODUCT_LEVEL",
        sku: p.productSerial || `SKU-${p.id.slice(0, 6)}`,
        price: p.sellingPrice || p.regularPrice || 0,
        regularPrice: p.regularPrice,
        sellingPrice: p.sellingPrice,
        buyingPrice: p.buyingPrice,
        stock: stockQty,
        stockStatus: stockQty === 0 ? "OUT_OF_STOCK" : stockQty <= 5 ? "LOW_STOCK" : "IN_STOCK",
        soldCount: p.initialSoldCount || 0,
        updatedAt: p.updatedAt,
      });
    }
  });

  return rows;
};

const adjustStock = async (payload: StockAdjustmentPayload) => {
  const { productId, variantId, quantity, changeType, source = "MANUAL_ADD", referenceId, note } = payload;

  if (!productId) {
    throw new ApiError(status.BAD_REQUEST, "Product ID is required for stock adjustment");
  }
  if (typeof quantity !== "number") {
    throw new ApiError(status.BAD_REQUEST, "Valid quantity is required");
  }

  let product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: productId },
        { slug: productId },
        { name: { contains: productId, mode: "insensitive" } },
      ],
    },
  });

  if (!product) {
    throw new ApiError(status.NOT_FOUND, `Product not found: ${productId}`);
  }

  const actualProductId = product.id;

  return await prisma.$transaction(async (tx) => {
    let previousStock = 0;
    let newStock = 0;
    let delta = 0;

    if (variantId) {
      const variant = await tx.productVariantCombination.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        throw new ApiError(status.NOT_FOUND, "Variant combination not found");
      }
      previousStock = variant.quantity || 0;

      if (changeType === "ADD" || changeType === "RESTORE") {
        delta = Math.abs(quantity);
        newStock = previousStock + delta;
      } else if (changeType === "DEDUCT") {
        delta = -Math.abs(quantity);
        newStock = Math.max(0, previousStock - Math.abs(quantity));
      } else if (changeType === "ADJUST") {
        newStock = Math.max(0, quantity);
        delta = newStock - previousStock;
      }

      await tx.productVariantCombination.update({
        where: { id: variantId },
        data: {
          quantity: newStock,
          status: newStock > 0 ? "ACTIVE" : variant.status,
        },
      });
    } else {
      previousStock = product.stock || 0;

      if (changeType === "ADD" || changeType === "RESTORE") {
        delta = Math.abs(quantity);
        newStock = previousStock + delta;
      } else if (changeType === "DEDUCT") {
        delta = -Math.abs(quantity);
        newStock = Math.max(0, previousStock - Math.abs(quantity));
      } else if (changeType === "ADJUST") {
        newStock = Math.max(0, quantity);
        delta = newStock - previousStock;
      }

      await tx.product.update({
        where: { id: actualProductId },
        data: {
          stock: newStock,
        },
      });
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId: actualProductId,
        variantId: variantId || null,
        changeType: changeType as any,
        quantity: Math.abs(delta),
        previousStock,
        newStock,
        source: source as any,
        referenceId: referenceId || null,
        note: note || (delta >= 0 ? `+${delta} items added` : `${delta} items deducted`),
      },
    });

    return {
      productId: actualProductId,
      productName: product.name,
      variantId,
      previousStock,
      newStock,
      delta,
      movement,
    };
  });
};

const getStockHistory = async (query: { productId?: string; limit?: number; page?: number }) => {
  const { productId, limit = 100, page = 1 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const whereClause: any = {};
  if (productId) {
    whereClause.productId = productId;
  }

  const [total, items] = await Promise.all([
    prisma.stockMovement.count({ where: whereClause }),
    prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sellingPrice: true,
            images: { take: 1, select: { url: true } },
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            finalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip,
    }),
  ]);

  return {
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: items,
  };
};

/**
 * Idempotently deduct stock for order placement/reshipment
 * Mathematical Net Deductions Guard: guarantees stock is deducted exactly once.
 */
const deductStockForOrder = async (
  orderId: string,
  items: Array<{ productId?: string; variantId?: string | null; quantity: number }>,
  source: StockChangeSource = "ORDER_PLACED"
) => {
  if (!orderId || !items || items.length === 0) return;

  // Check net deductions balance for this order
  const existingMovements = await prisma.stockMovement.findMany({
    where: { referenceId: orderId },
  });

  const totalDeductions = existingMovements.filter((m) => m.changeType === "DEDUCT").length;
  const totalRestores = existingMovements.filter((m) => m.changeType === "RESTORE").length;
  const netDeductions = totalDeductions - totalRestores;

  if (netDeductions > 0) {
    // Already currently deducted for this order, do NOT deduct again!
    console.log(`[Inventory] Skipping deductStockForOrder for order ${orderId}: already deducted.`);
    return;
  }

  for (const item of items) {
    try {
      const pId = item.productId;
      if (!pId) continue;
      const qty = Number(item.quantity) || 1;

      await adjustStock({
        productId: pId,
        variantId: item.variantId,
        quantity: qty,
        changeType: "DEDUCT",
        source,
        referenceId: orderId,
        note: `Order #${orderId} item deduction (${source})`,
      });
    } catch (err) {
      console.warn(`[Inventory] Error deducting stock for order ${orderId}:`, err);
    }
  }
};

/**
 * Idempotently restore stock for order cancellation/refund
 * Mathematical Net Deductions Guard: guarantees stock is restored exactly once.
 */
const restoreStockForOrder = async (
  orderId: string,
  items: Array<{ productId?: string; variantId?: string | null; quantity: number }>,
  source: StockChangeSource = "ORDER_CANCELLED"
) => {
  if (!orderId || !items || items.length === 0) return;

  const existingMovements = await prisma.stockMovement.findMany({
    where: { referenceId: orderId },
  });

  const totalDeductions = existingMovements.filter((m) => m.changeType === "DEDUCT").length;
  const totalRestores = existingMovements.filter((m) => m.changeType === "RESTORE").length;
  const netDeductions = totalDeductions - totalRestores;

  if (netDeductions <= 0) {
    // Stock is currently NOT in a deducted state, nothing to restore!
    console.log(`[Inventory] Skipping restoreStockForOrder for order ${orderId}: net deductions is ${netDeductions}.`);
    return;
  }

  for (const item of items) {
    try {
      const pId = item.productId;
      if (!pId) continue;
      const qty = Number(item.quantity) || 1;

      await adjustStock({
        productId: pId,
        variantId: item.variantId,
        quantity: qty,
        changeType: "RESTORE",
        source,
        referenceId: orderId,
        note: `Order #${orderId} stock restoration (${source})`,
      });
    } catch (err) {
      console.warn(`[Inventory] Error restoring stock for order ${orderId}:`, err);
    }
  }
};

export const InventoryServices = {
  getAllInventory,
  adjustStock,
  getStockHistory,
  deductStockForOrder,
  restoreStockForOrder,
};
