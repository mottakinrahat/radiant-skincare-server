const fs = require('fs');

// 1. Update order.services.js
let servicesCode = fs.readFileSync('/app/dist/app/modules/order/order.services.js', 'utf8');

const deleteServiceSnippet = `
const deleteOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_2.default.order.findFirst({
        where: {
            OR: [
                { id: orderId },
                { orderNumber: isNaN(Number(orderId)) ? -1 : Number(orderId) }
            ]
        },
        include: { items: true },
    });
    if (!order) {
        return { id: orderId, deleted: true, message: "Order not found or already deleted" };
    }
    const realId = order.id;
    const confirmedStatuses = ["CONFIRMED", "PROGRESSING", "SHIPPED", "DELIVERED"];
    if (confirmedStatuses.includes(order.status) && Array.isArray(order.items)) {
        for (const item of order.items) {
            try {
                yield prisma_2.default.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
                yield prisma_2.default.stockMovement.create({
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        type: "IN",
                        reason: "Order Deleted: #" + order.orderNumber,
                    },
                });
            } catch (e) {
                console.warn("Stock restoration note on delete:", e.message);
            }
        }
    }
    try { yield prisma_2.default.orderItems.deleteMany({ where: { orderId: realId } }); } catch (e) {}
    try { yield prisma_2.default.courierShipmentHistory.deleteMany({ where: { orderId: realId } }); } catch (e) {}
    try { yield prisma_2.default.payment.deleteMany({ where: { orderId: realId } }); } catch (e) {}
    yield prisma_2.default.order.delete({ where: { id: realId } });
    return { id: realId, orderNumber: order.orderNumber, deleted: true };
});
`;

if (!servicesCode.includes('deleteOrder =')) {
    servicesCode = servicesCode.replace(
        'exports.OrderServices = {',
        deleteServiceSnippet + '\nexports.OrderServices = {\n    deleteOrder,'
    );
    fs.writeFileSync('/app/dist/app/modules/order/order.services.js', servicesCode);
    console.log('Successfully added deleteOrder to order.services.js');
} else {
    console.log('order.services.js already has deleteOrder');
}

// 2. Update order.controller.js
let controllerCode = fs.readFileSync('/app/dist/app/modules/order/order.controller.js', 'utf8');

const deleteControllerSnippet = `
const deleteOrder = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_services_1.OrderServices.deleteOrder(id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order deleted successfully",
        data: result,
    });
}));
`;

if (!controllerCode.includes('deleteOrder =')) {
    controllerCode = controllerCode.replace(
        'exports.OrderController = {',
        deleteControllerSnippet + '\nexports.OrderController = {\n    deleteOrder,'
    );
    fs.writeFileSync('/app/dist/app/modules/order/order.controller.js', controllerCode);
    console.log('Successfully added deleteOrder to order.controller.js');
} else {
    console.log('order.controller.js already has deleteOrder');
}

// 3. Update order.routes.js
let routesCode = fs.readFileSync('/app/dist/app/modules/order/order.routes.js', 'utf8');

const deleteRouteSnippet = `router.delete("/:id", (0, auth_1.auth)(prisma_1.UserRole.ADMIN, prisma_1.UserRole.MANAGER, prisma_1.UserRole.SUPER_ADMIN), order_controller_1.OrderController.deleteOrder);
exports.orderRoutes = router;`;

if (!routesCode.includes('router.delete("/:id",')) {
    routesCode = routesCode.replace('exports.orderRoutes = router;', deleteRouteSnippet);
    fs.writeFileSync('/app/dist/app/modules/order/order.routes.js', routesCode);
    console.log('Successfully added DELETE /:id route to order.routes.js');
} else {
    console.log('order.routes.js already has DELETE /:id route');
}
