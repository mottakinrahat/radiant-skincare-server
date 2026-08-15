import prisma from "../../../shared/prisma";

const getCart = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const cartInclude = {
    items: {
      include: {
        product: {
          include: {
            images: { take: 1 },
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
  };

  let cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
      include: cartInclude,
    });
  }

  return cart;
};

const addToCart = async (email: string, payload: { productId: string; variantId?: string; quantity: number; price: number }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const requestedQty = Number(payload.quantity) || 1;

  // Validate Stock Source of Truth (Combination vs Option vs Product Level)
  if (payload.variantId) {
    // 1. Try finding in combinations
    let variant = await prisma.productVariantCombination.findFirst({
      where: {
        productId: payload.productId,
        OR: [
          { id: payload.variantId },
          { sku: payload.variantId },
          { options: { some: { productVariantOptionId: payload.variantId } } },
        ],
      },
    });

    if (variant) {
      if (variant.status !== "ACTIVE") {
        throw new Error("This variant is currently inactive or unavailable.");
      }
      if (variant.quantity < requestedQty) {
        throw new Error(`Insufficient stock for this variant. Available: ${variant.quantity}`);
      }
    } else {
      // 2. Try finding in variant options
      const option = await prisma.productVariantOption.findFirst({
        where: {
          variant: { productId: payload.productId },
          OR: [
            { id: payload.variantId },
            { sku: payload.variantId },
            { value: payload.variantId },
          ],
        },
      });

      if (option) {
        if (option.status !== "ACTIVE") {
          throw new Error("This variant option is currently inactive or unavailable.");
        }
        if ((option.quantity ?? 0) < requestedQty) {
          throw new Error(`Insufficient stock for this option. Available: ${option.quantity ?? 0}`);
        }
      } else {
        throw new Error("Selected product variant not found");
      }
    }
  } else {
    // Check if product has variants — if so, variant selection is mandatory
    const product = await prisma.product.findUnique({
      where: { id: payload.productId },
      include: {
        variants: { include: { options: true } },
        variantCombinations: true,
      },
    });
    if (!product) {
      throw new Error("Product not found");
    }
    const hasCombinations = product.variantCombinations && product.variantCombinations.length > 0;
    const hasSingleVariant = product.variants && product.variants.length > 0 && product.variants.some((v) => v.options.length > 0);
    if (hasCombinations || hasSingleVariant) {
      throw new Error("Please select a variant option for this product.");
    }
    const simpleStock = product.stock ?? 0;
    if (simpleStock < requestedQty) {
      throw new Error(`Insufficient stock. Available: ${simpleStock}`);
    }
  }

  let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } });
  }

  // Cart item matching: if variantId is a combination id or option id
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: payload.productId,
      variantId: payload.variantId || null,
    },
  });

  if (existingItem) {
    const totalQty = existingItem.quantity + requestedQty;
    if (payload.variantId) {
      const variant = await prisma.productVariantCombination.findUnique({ where: { id: payload.variantId } });
      if (variant) {
        if (variant.quantity < totalQty) {
          throw new Error(`Cannot add more than available stock (${variant.quantity}).`);
        }
      } else {
        const option = await prisma.productVariantOption.findUnique({ where: { id: payload.variantId } });
        if (option && option.quantity < totalQty) {
          throw new Error(`Cannot add more than available stock (${option.quantity}).`);
        }
      }
    } else {
      const product = await prisma.product.findUnique({ where: { id: payload.productId } });
      if (product && (product.stock ?? 0) < totalQty) {
        throw new Error(`Cannot add more than available stock (${product.stock ?? 0}).`);
      }
    }

    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: totalQty },
    });
  }

  return await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: payload.productId,
      variantId: payload.variantId || null,
      quantity: requestedQty,
      price: payload.price,
    },
  });
};

const updateCartItemQuantity = async (email: string, cartItemId: string, quantity: number) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
    if (!cartItem || cartItem.cart.userId !== user.id) {
        throw new Error("Cart item not found");
    }

    if (quantity <= 0) {
        return await prisma.cartItem.delete({ where: { id: cartItemId } });
    }

    return await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
    });
};

const removeCartItem = async (email: string, cartItemId: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
  if (!cartItem || cartItem.cart.userId !== user.id) {
    throw new Error("Cart item not found");
  }

  return await prisma.cartItem.delete({
    where: { id: cartItemId },
  });
};

const clearCart = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) return { message: "Cart empty" };

  return await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
};

export const CartServices = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
