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
exports.OrderServices = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const geo_utils_1 = require("../geo/geo.utils");
const tracking_service_1 = require("../tracking/tracking.service");
const createOrder = (email, payload, metaInfo) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const user = yield prisma_2.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("User not found");
    }
    const items = payload.items;
    if (!items || items.length === 0) {
        throw new Error("Order items cannot be empty");
    }
    let subtotal = 0;
    // Collect item details for discount eligibility check
    const itemDetails = [];
    for (const item of items) {
        // Ensure quantity is a number, not a string from JSON body
        item.quantity = Number(item.quantity);
        if (!item.quantity || item.quantity <= 0) {
            throw new Error("Item quantity must be a positive number");
        }
        const product = yield prisma_2.default.product.findUnique({
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
        if (!product)
            throw new Error(`Product not found: ${item.productId}`);
        let itemPrice = (_b = (_a = product.sellingPrice) !== null && _a !== void 0 ? _a : product.buyingPrice) !== null && _b !== void 0 ? _b : 0;
        let resolvedVariantId = null;
        let resolvedOptionId = null;
        const hasCombinations = Array.isArray(product.variantCombinations) && product.variantCombinations.length > 0;
        const allVariantOptions = (product.variants || []).flatMap((v) => v.options || []);
        const hasVariants = hasCombinations || allVariantOptions.length > 0;
        if (hasCombinations) {
            // 1. PRODUCT WITH COMBINATIONS (Primary Variant System)
            let variant = item.variantId
                ? product.variantCombinations.find((v) => v.id === item.variantId)
                : null;
            if (!variant && item.variantId) {
                variant = product.variantCombinations.find((v) => v.sku === item.variantId);
            }
            if (!variant && item.variantId && item.variantId.includes("-")) {
                const optIds = item.variantId.split("-");
                variant = product.variantCombinations.find((combo) => {
                    const comboOptIds = combo.options.map((co) => { var _a; return co.productVariantOptionId || ((_a = co.option) === null || _a === void 0 ? void 0 : _a.id); });
                    return optIds.every((id) => comboOptIds.includes(id));
                });
            }
            if (!variant && item.variantId) {
                variant = product.variantCombinations.find((combo) => {
                    const comboOptIds = combo.options.map((co) => { var _a; return co.productVariantOptionId || ((_a = co.option) === null || _a === void 0 ? void 0 : _a.id); });
                    return comboOptIds.includes(item.variantId);
                });
            }
            if (!variant && product.variantCombinations.length > 0) {
                variant =
                    product.variantCombinations.find((c) => c.status === "ACTIVE" && c.quantity > 0) ||
                        product.variantCombinations[0];
            }
            if (!variant) {
                throw new Error(`Variant not found for product: ${product.name}`);
            }
            if (variant.status && variant.status !== "ACTIVE") {
                throw new Error(`The selected variant (${variant.sku || ""}) is currently unavailable for purchase.`);
            }
            const availableQty = (_d = (_c = variant.quantity) !== null && _c !== void 0 ? _c : variant.stock) !== null && _d !== void 0 ? _d : 0;
            if (availableQty < item.quantity) {
                throw new Error(`Insufficient stock for selected variant. Available: ${availableQty}, Requested: ${item.quantity}`);
            }
            itemPrice = variant.finalPrice && variant.finalPrice > 0 ? variant.finalPrice : itemPrice;
            resolvedVariantId = variant.id;
        }
        else if (allVariantOptions.length > 0) {
            // 2. PRODUCT WITH VARIANT OPTIONS (Without combinations generated)
            let matchedOption = item.variantId
                ? allVariantOptions.find((opt) => {
                    var _a;
                    return opt.id === item.variantId ||
                        opt.sku === item.variantId ||
                        ((_a = opt.value) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === item.variantId.toLowerCase();
                })
                : null;
            if (!matchedOption) {
                matchedOption =
                    allVariantOptions.find((opt) => { var _a; return opt.status === "ACTIVE" && ((_a = opt.quantity) !== null && _a !== void 0 ? _a : 0) > 0; }) ||
                        allVariantOptions[0];
            }
            if (!matchedOption) {
                throw new Error(`Variant option not found for product: ${product.name}`);
            }
            if (matchedOption.status && matchedOption.status !== "ACTIVE") {
                throw new Error(`The selected option (${matchedOption.value}) is currently unavailable.`);
            }
            const availableQty = (_f = (_e = matchedOption.quantity) !== null && _e !== void 0 ? _e : matchedOption.stock) !== null && _f !== void 0 ? _f : 0;
            if (availableQty < item.quantity) {
                throw new Error(`Insufficient stock for selected option. Available: ${availableQty}, Requested: ${item.quantity}`);
            }
            itemPrice = itemPrice + Number(matchedOption.priceAdjustment || 0);
            resolvedOptionId = matchedOption.id;
        }
        else {
            // 3. PRODUCT WITHOUT VARIANTS (Simple Product)
            const simpleStock = (_g = product.stock) !== null && _g !== void 0 ? _g : 0;
            if (simpleStock < item.quantity) {
                throw new Error(`Insufficient stock for product. Available: ${simpleStock}, Requested: ${item.quantity}`);
            }
        }
        subtotal += itemPrice * item.quantity;
        item.price = itemPrice; // attach for later use
        item.resolvedVariantId = resolvedVariantId;
        item.resolvedOptionId = resolvedOptionId;
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
        const discount = yield prisma_2.default.discount.findFirst({
            where: { code: { equals: payload.discountCode.trim(), mode: "insensitive" } },
            include: {
                products: true,
                categories: true,
            },
        });
        if (!discount)
            throw new Error("Invalid promo code");
        const now = new Date();
        if (!discount.isActive || now < discount.startDate || now > discount.endDate) {
            throw new Error("Promo code is not active or has expired");
        }
        if (discount.type === "FREE_SHIPPING" ||
            (discount.code && discount.code.toUpperCase().includes("FREE"))) {
            isFreeShipping = true;
            discountAmount = 0;
        }
        else {
            let eligibleTotal = 0;
            const hasSpecificProducts = discount.products && discount.products.length > 0;
            const hasSpecificCategories = discount.categories && discount.categories.length > 0;
            if (discount.isGlobal || (!hasSpecificProducts && !hasSpecificCategories)) {
                eligibleTotal = subtotal;
            }
            else {
                const discountProdIds = discount.products.map((dp) => dp.productId);
                const discountCatIds = discount.categories.map((dc) => dc.categoryId);
                for (const item of itemDetails) {
                    if (discountProdIds.includes(item.productId) ||
                        discountCatIds.includes(item.categoryId)) {
                        eligibleTotal += item.price * item.quantity;
                    }
                }
            }
            if (eligibleTotal > 0) {
                if (discount.type === "PERCENTAGE") {
                    discountAmount = Math.round((eligibleTotal * discount.value) / 100);
                }
                else {
                    discountAmount = Math.min(discount.value, eligibleTotal);
                }
            }
        }
    }
    else {
        // Fallback: manual discountAmount from payload (e.g. admin-applied)
        discountAmount = Number(payload.discountAmount) || 0;
    }
    // ─────────────────────────────────────────────────────────────────────────
    const geoResult = (0, geo_utils_1.calculateChargeByName)((_h = payload.shippingAddress) === null || _h === void 0 ? void 0 : _h.district, (_j = payload.shippingAddress) === null || _j === void 0 ? void 0 : _j.upazilla);
    const shipping = isFreeShipping ? 0 : geoResult.charge;
    const totalAmount = Math.max(0, subtotal - discountAmount + shipping);
    const clientNoteStr = payload.notes ||
        payload.clientNotes ||
        payload.clientNote ||
        payload.note ||
        ((_k = payload.shippingAddress) === null || _k === void 0 ? void 0 : _k.note) ||
        ((_l = payload.shippingAddress) === null || _l === void 0 ? void 0 : _l.clientNote) ||
        "";
    let shippingAddressId;
    const result = yield prisma_2.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        // determine payment method and initial payment status
        const pmRaw = (payload.paymentMethod || "").toString().toUpperCase();
        const paymentMethodValue = pmRaw === "ONLINE" ? prisma_1.PaymentMethod.ONLINE : prisma_1.PaymentMethod.COD;
        // ONLINE → paymentStatus starts as PENDING (confirmed after gateway callback)
        // COD    → paymentStatus starts as UNPAID (confirmed when cash is collected)
        const paymentStatus = paymentMethodValue === prisma_1.PaymentMethod.COD ? prisma_1.PaymentStatusEnum.UNPAID : prisma_1.PaymentStatusEnum.PENDING;
        let localShippingAddressId;
        if (payload.shippingAddress) {
            const shippingAddress = yield tx.shippingAddress.create({
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
        const orderStatus = prisma_1.OrderStatus.UNVERIFIED;
        // Compute next sequential orderNumber starting at 101
        const lastOrder = yield tx.order.findFirst({
            where: { orderNumber: { not: null } },
            orderBy: { orderNumber: "desc" },
            select: { orderNumber: true },
        });
        const nextOrderNumber = (lastOrder === null || lastOrder === void 0 ? void 0 : lastOrder.orderNumber) && lastOrder.orderNumber >= 101 ? lastOrder.orderNumber + 1 : 101;
        const newOrder = yield tx.order.create({
            data: {
                userId: user === null || user === void 0 ? void 0 : user.id,
                orderNumber: nextOrderNumber,
                status: orderStatus,
                paymentMethod: paymentMethodValue,
                paymentStatus,
                subtotal,
                discountAmount,
                totalAmount,
                shippingAddressId: localShippingAddressId,
                note: clientNoteStr || undefined,
            },
        });
        const orderItemsData = items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.resolvedVariantId || null,
            quantity: Number(item.quantity),
            price: Number(item.price),
        }));
        yield tx.orderItems.createMany({
            data: orderItemsData,
        });
        // Deduct stock on order creation atomically inside transaction
        for (const item of items) {
            if (item.resolvedVariantId) {
                // 1. Variant product with combination: decrement ONLY variant combination stock
                const currentVariant = yield tx.productVariantCombination.findUnique({
                    where: { id: item.resolvedVariantId },
                    select: { quantity: true, status: true },
                });
                if (!currentVariant || currentVariant.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for selected variant. Available: ${(_a = currentVariant === null || currentVariant === void 0 ? void 0 : currentVariant.quantity) !== null && _a !== void 0 ? _a : 0}, Requested: ${item.quantity}`);
                }
                const updated = yield tx.productVariantCombination.update({
                    where: { id: item.resolvedVariantId },
                    data: { quantity: { decrement: item.quantity } },
                });
                // Auto-deactivate if stock reached 0
                if (updated.quantity <= 0) {
                    yield tx.productVariantCombination.update({
                        where: { id: item.resolvedVariantId },
                        data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
                    });
                }
            }
            else if (item.resolvedOptionId) {
                // 2. Single variant option without combinations: decrement ONLY ProductVariantOption quantity
                const currentOption = yield tx.productVariantOption.findUnique({
                    where: { id: item.resolvedOptionId },
                    select: { quantity: true, status: true },
                });
                if (!currentOption || ((_b = currentOption.quantity) !== null && _b !== void 0 ? _b : 0) < item.quantity) {
                    throw new Error(`Insufficient stock for selected option. Available: ${(_c = currentOption === null || currentOption === void 0 ? void 0 : currentOption.quantity) !== null && _c !== void 0 ? _c : 0}, Requested: ${item.quantity}`);
                }
                const updated = yield tx.productVariantOption.update({
                    where: { id: item.resolvedOptionId },
                    data: { quantity: { decrement: item.quantity } },
                });
                if (updated.quantity <= 0) {
                    yield tx.productVariantOption.update({
                        where: { id: item.resolvedOptionId },
                        data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
                    });
                }
            }
            else {
                // 3. Simple product (no variants): decrement Product.stock ONLY
                const currentProduct = yield tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stock: true },
                });
                if (!currentProduct || ((_d = currentProduct.stock) !== null && _d !== void 0 ? _d : 0) < item.quantity) {
                    throw new Error(`Insufficient stock for product. Available: ${(_e = currentProduct === null || currentProduct === void 0 ? void 0 : currentProduct.stock) !== null && _e !== void 0 ? _e : 0}, Requested: ${item.quantity}`);
                }
                yield tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
        }
        if (payload.clearCart) {
            const cart = yield tx.cart.findUnique({ where: { userId: user.id } });
            if (cart) {
                yield tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }
        }
        return newOrder;
    }));
    // Increment LandingPage ordersCount (Purchases) ONLY if order explicitly originated from a Landing Page
    const landingProdId = payload.landingProductId || (payload.fromLandingPage ? (_m = items === null || items === void 0 ? void 0 : items[0]) === null || _m === void 0 ? void 0 : _m.productId : null);
    if (landingProdId) {
        try {
            yield prisma_2.default.landingPage.update({
                where: { productId: landingProdId },
                data: { ordersCount: { increment: 1 } },
            });
        }
        catch (_q) {
            // ignore if product is not linked to a landing page
        }
    }
    // Persist client note directly into Order table
    if (clientNoteStr) {
        const noteVal = clientNoteStr;
        const orderId = result.id;
        try {
            yield prisma_2.default.$executeRawUnsafe(`UPDATE "Order" SET note = $1 WHERE id = $2`, noteVal, orderId);
            result.note = noteVal;
        }
        catch (rawErr) {
            console.error("[OrderServices] Failed to persist client note:", rawErr);
        }
    }
    // Non-blocking Server-side Conversions API (CAPI) Purchase event for Meta & TikTok
    tracking_service_1.TrackingService.trackPurchase({
        eventId: result.id,
        email: user.email || ((_o = payload.shippingAddress) === null || _o === void 0 ? void 0 : _o.email),
        phone: ((_p = payload.shippingAddress) === null || _p === void 0 ? void 0 : _p.phoneNumber) || user.phone,
        value: result.totalAmount,
        currency: "BDT",
        clientIp: metaInfo === null || metaInfo === void 0 ? void 0 : metaInfo.clientIp,
        userAgent: metaInfo === null || metaInfo === void 0 ? void 0 : metaInfo.userAgent,
        contentIds: items.map((i) => i.productId),
    }).catch((err) => {
        console.error("[OrderServices] CAPI tracking error (non-blocking):", err);
    });
    return result;
});
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
const getOrdersForUser = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_2.default.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    return yield prisma_2.default.order.findMany({
        where: { userId: user.id },
        include: orderFullInclude,
        orderBy: { createdAt: "desc" },
    });
});
const getOrderById = (orderIdOrNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const clean = (orderIdOrNumber || "").trim().replace("#", "");
    const numericStr = clean.replace(/^[^\d]+/g, "").trim();
    const num = parseInt(numericStr, 10);
    const hasNum = !isNaN(num) && numericStr.length > 0;
    const whereClause = hasNum
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
    return yield prisma_2.default.order.findFirst({
        where: whereClause,
        include: orderFullInclude,
    });
});
const trackOrderPublic = (orderQuery, phoneQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const cleanOrderQuery = (orderQuery || "").trim().replace("#", "");
    const cleanPhoneQuery = (phoneQuery || "").trim().toLowerCase();
    if (!cleanOrderQuery || !cleanPhoneQuery) {
        throw new Error("Both Order Number / ID and Phone Number are required for tracking.");
    }
    const num = parseInt(cleanOrderQuery, 10);
    const isNum = !isNaN(num) && String(num) === cleanOrderQuery;
    const orConditions = [
        { id: { startsWith: cleanOrderQuery, mode: "insensitive" } },
        { id: cleanOrderQuery },
    ];
    if (isNum) {
        orConditions.push({ orderNumber: num });
    }
    const orders = yield prisma_2.default.order.findMany({
        where: { OR: orConditions },
        include: orderFullInclude,
        orderBy: { createdAt: "desc" },
    });
    if (!orders || orders.length === 0) {
        throw new Error("No order found with the provided Order Number.");
    }
    const targetDigits = cleanPhoneQuery.replace(/\D/g, "");
    const matchedOrder = orders.find((o) => {
        var _a, _b, _c;
        const sPhone = (((_a = o.shippingAddress) === null || _a === void 0 ? void 0 : _a.phoneNumber) || "").replace(/\D/g, "");
        const sAltPhone = (((_b = o.shippingAddress) === null || _b === void 0 ? void 0 : _b.altPhoneNumber) || "").replace(/\D/g, "");
        const uPhone = (((_c = o.user) === null || _c === void 0 ? void 0 : _c.contactNumber) || "").replace(/\D/g, "");
        return ((sPhone && (sPhone.includes(targetDigits) || targetDigits.includes(sPhone))) ||
            (sAltPhone && (sAltPhone.includes(targetDigits) || targetDigits.includes(sAltPhone))) ||
            (uPhone && (uPhone.includes(targetDigits) || targetDigits.includes(uPhone))));
    });
    if (!matchedOrder) {
        throw new Error("Order found, but the phone number does not match our records.");
    }
    return matchedOrder;
});
const getAllOrders = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_2.default.order.findMany({
        include: orderFullInclude,
        orderBy: { createdAt: "desc" },
    });
});
const updateOrderStatus = (orderId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const existingOrder = yield prisma_2.default.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    if (!existingOrder) {
        throw new Error("Order not found");
    }
    const prevStatus = existingOrder.status;
    const updateData = { status };
    if (status === prisma_1.OrderStatus.REFUNDED) {
        updateData.paymentStatus = prisma_1.PaymentStatusEnum.REFUNDED;
    }
    const updatedOrder = yield prisma_2.default.order.update({
        where: { id: orderId },
        data: updateData,
    });
    const isNowConfirmed = [
        prisma_1.OrderStatus.CONFIRMED,
        prisma_1.OrderStatus.PROGRESSING,
        prisma_1.OrderStatus.SHIPPED,
        prisma_1.OrderStatus.DELIVERED,
    ].includes(status);
    const wasConfirmed = [
        prisma_1.OrderStatus.CONFIRMED,
        prisma_1.OrderStatus.PROGRESSING,
        prisma_1.OrderStatus.SHIPPED,
        prisma_1.OrderStatus.DELIVERED,
    ].includes(prevStatus);
    const isCancelledOrRefunded = [
        prisma_1.OrderStatus.CANCELLED,
        prisma_1.OrderStatus.REFUNDED,
    ].includes(status);
    if (isNowConfirmed && !wasConfirmed) {
        for (const item of existingOrder.items) {
            const vId = item.variantCombinationId || item.variantId;
            if (vId) {
                const updated = yield prisma_2.default.productVariantCombination
                    .update({
                    where: { id: vId },
                    data: { quantity: { decrement: item.quantity } },
                })
                    .catch(() => null);
                if (updated && updated.quantity <= 0) {
                    yield prisma_2.default.productVariantCombination
                        .update({
                        where: { id: vId },
                        data: { status: "INACTIVE", quantity: Math.max(0, updated.quantity) },
                    })
                        .catch(() => { });
                }
            }
            else if (item.productId) {
                // Non-variant order confirmed: increment sold count
                yield prisma_2.default.product
                    .update({
                    where: { id: item.productId },
                    data: { initialSoldCount: { increment: item.quantity } },
                })
                    .catch(() => { });
            }
        }
    }
    else if (isCancelledOrRefunded && wasConfirmed) {
        for (const item of existingOrder.items) {
            const vId = item.variantCombinationId || item.variantId;
            if (vId) {
                yield prisma_2.default.productVariantCombination
                    .update({
                    where: { id: vId },
                    data: { quantity: { increment: item.quantity } },
                })
                    .catch(() => { });
            }
            else if (item.productId) {
                // Non-variant order cancelled/refunded: restore stock
                yield prisma_2.default.product
                    .update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        initialSoldCount: { decrement: Math.max(0, item.quantity) },
                    },
                })
                    .catch(() => { });
            }
        }
    }
    return updatedOrder;
});
const updatePaymentStatus = (orderId, paymentStatus) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_2.default.order.update({
        where: { id: orderId },
        data: { paymentStatus },
    });
});
const updateOrderCourierInfo = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_2.default.order.update({
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
});
const clearOrderCourierInfo = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_2.default.order.update({
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
});
exports.OrderServices = {
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
