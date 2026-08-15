"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const getCart = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
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
    let cart = yield prisma_1.default.cart.findUnique({
        where: { userId: user.id },
        include: cartInclude,
    });
    if (!cart) {
        cart = yield prisma_1.default.cart.create({
            data: { userId: user.id },
            include: cartInclude,
        });
    }
    return cart;
});
const addToCart = (email, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("User not found");
    }
    const requestedQty = Number(payload.quantity) || 1;
    // Validate Stock Source of Truth (Combination vs Option vs Product Level)
    if (payload.variantId) {
        // 1. Try finding in combinations
        let variant = yield prisma_1.default.productVariantCombination.findFirst({
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
        }
        else {
            // 2. Try finding in variant options
            const option = yield prisma_1.default.productVariantOption.findFirst({
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
                if (((_a = option.quantity) !== null && _a !== void 0 ? _a : 0) < requestedQty) {
                    throw new Error(`Insufficient stock for this option. Available: ${(_b = option.quantity) !== null && _b !== void 0 ? _b : 0}`);
                }
            }
            else {
                throw new Error("Selected product variant not found");
            }
        }
    }
    else {
        // Check if product has variants — if so, variant selection is mandatory
        const product = yield prisma_1.default.product.findUnique({
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
        const simpleStock = (_c = product.stock) !== null && _c !== void 0 ? _c : 0;
        if (simpleStock < requestedQty) {
            throw new Error(`Insufficient stock. Available: ${simpleStock}`);
        }
    }
    let cart = yield prisma_1.default.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
        cart = yield prisma_1.default.cart.create({ data: { userId: user.id } });
    }
    // Cart item matching: if variantId is a combination id or option id
    const existingItem = yield prisma_1.default.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId: payload.productId,
            variantId: payload.variantId || null,
        },
    });
    if (existingItem) {
        const totalQty = existingItem.quantity + requestedQty;
        if (payload.variantId) {
            const variant = yield prisma_1.default.productVariantCombination.findUnique({ where: { id: payload.variantId } });
            if (variant) {
                if (variant.quantity < totalQty) {
                    throw new Error(`Cannot add more than available stock (${variant.quantity}).`);
                }
            }
            else {
                const option = yield prisma_1.default.productVariantOption.findUnique({ where: { id: payload.variantId } });
                if (option && option.quantity < totalQty) {
                    throw new Error(`Cannot add more than available stock (${option.quantity}).`);
                }
            }
        }
        else {
            const product = yield prisma_1.default.product.findUnique({ where: { id: payload.productId } });
            if (product && ((_d = product.stock) !== null && _d !== void 0 ? _d : 0) < totalQty) {
                throw new Error(`Cannot add more than available stock (${(_e = product.stock) !== null && _e !== void 0 ? _e : 0}).`);
            }
        }
        return yield prisma_1.default.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: totalQty },
        });
    }
    return yield prisma_1.default.cartItem.create({
        data: {
            cartId: cart.id,
            productId: payload.productId,
            variantId: payload.variantId || null,
            quantity: requestedQty,
            price: payload.price,
        },
    });
});
const updateCartItemQuantity = (email, cartItemId, quantity) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    const cartItem = yield prisma_1.default.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
    if (!cartItem || cartItem.cart.userId !== user.id) {
        throw new Error("Cart item not found");
    }
    if (quantity <= 0) {
        return yield prisma_1.default.cartItem.delete({ where: { id: cartItemId } });
    }
    return yield prisma_1.default.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
    });
});
const removeCartItem = (email, cartItemId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    const cartItem = yield prisma_1.default.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
    if (!cartItem || cartItem.cart.userId !== user.id) {
        throw new Error("Cart item not found");
    }
    return yield prisma_1.default.cartItem.delete({
        where: { id: cartItemId },
    });
});
const clearCart = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    const cart = yield prisma_1.default.cart.findUnique({ where: { userId: user.id } });
    if (!cart)
        return { message: "Cart empty" };
    return yield prisma_1.default.cartItem.deleteMany({
        where: { cartId: cart.id },
    });
});
exports.CartServices = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
